from fastapi import FastAPI, Query
from fastapi.middleware.cors import CORSMiddleware
import httpx
import asyncio
import xml.etree.ElementTree as ET
import re

app = FastAPI(title="Search Gateway")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=False,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/")
def root():
    return {"status": "ok", "service": "Disee Search Gateway"}

import os

def _is_docker() -> bool:
    if os.path.exists("/.dockerenv"):
        return True
    if os.environ.get("IN_DOCKER", "false").lower() == "true":
        return True
    try:
        if os.path.exists("/proc/1/cgroup"):
            with open("/proc/1/cgroup", "r") as f:
                content = f.read()
                if "docker" in content or "kubepods" in content or "containerd" in content:
                    return True
    except Exception:
        pass
    return False

IN_DOCKER = _is_docker()
IS_RENDER = bool(os.environ.get("RENDER"))

# Allow configuring via environment variable for flexibility in non-standard setups
NODE_URLS_ENV = os.environ.get("DISEE_NODE_URLS") or os.environ.get("NODE_URLS")
if NODE_URLS_ENV:
    NODES = [url.strip() for url in NODE_URLS_ENV.split(",") if url.strip()]
elif IS_RENDER:
    # On Render (single service), no separate node containers are available
    NODES = []
elif IN_DOCKER:
    NODES = [
        "http://node1:8000/search",
        "http://node2:8000/search",
        "http://node3:8000/search",
    ]
else:
    NODES = [
        "http://localhost:8001/search",
        "http://localhost:8002/search",
        "http://localhost:8003/search",
    ]


async def fetch_wikipedia_search(client, query):
    try:
        url = f"https://en.wikipedia.org/w/api.php"
        params = {"action": "query", "list": "search", "srsearch": query, "utf8": "", "format": "json", "srlimit": "5"}
        headers = {"User-Agent": "DiseeApp/1.0"}
        response = await client.get(url, params=params, headers=headers, timeout=5.0)
        if response.status_code == 200:
            items = response.json().get("query", {}).get("search", [])
            return [
                {
                    "title": item.get("title", ""),
                    "snippet": item.get("snippet", ""),
                    "url": f"https://en.wikipedia.org/?curid={item.get('pageid', '')}" if item.get("pageid") else "",
                    "external_source": "Wikipedia API"
                } for item in items
            ]
    except Exception as e:
        print(f"Error calling Wikipedia: {e}")
    return []

async def fetch_stackoverflow_search(client, query):
    try:
        url = f"https://api.stackexchange.com/2.3/search"
        params = {"order": "desc", "sort": "relevance", "intitle": query, "site": "stackoverflow", "pagesize": 5}
        headers = {"User-Agent": "DiseeApp/1.0"}
        response = await client.get(url, params=params, headers=headers, timeout=5.0)
        if response.status_code == 200:
            items = response.json().get("items", [])
            return [
                {
                    "title": item.get("title", ""),
                    "snippet": "Tags: " + ", ".join(item.get("tags", [])),
                    "url": item.get("link", ""),
                    "external_source": "StackOverflow API"
                } for item in items
            ]
    except Exception as e:
        print(f"Error calling StackOverflow: {e}")
    return []

async def fetch_github_search(client, query):
    try:
        url = "https://api.github.com/search/repositories"
        params = {"q": query, "per_page": 5}
        headers = {"User-Agent": "DiseeApp/1.0"}
        response = await client.get(url, params=params, headers=headers, timeout=5.0)
        if response.status_code == 200:
            items = response.json().get("items", [])
            return [
                {
                    "title": item.get("full_name", ""),
                    "snippet": f"{item.get('description', 'No description')} - Stars: {item.get('stargazers_count', 0)}",
                    "url": item.get("html_url", ""),
                    "external_source": "GitHub API"
                } for item in items
            ]
    except Exception as e:
        print(f"Error calling GitHub: {e}")
    return []

async def fetch_reddit_search(client, query):
    try:
        url = "https://www.reddit.com/search.rss"
        params = {"q": query, "sort": "relevance", "limit": 5}
        headers = {"User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:115.0) Gecko/20100101 Firefox/115.0"}
        response = await client.get(url, params=params, headers=headers, timeout=5.0)
        if response.status_code == 200:
            root = ET.fromstring(response.content)
            namespaces = {'atom': 'http://www.w3.org/2005/Atom'}
            entries = root.findall('atom:entry', namespaces)
            results = []
            for entry in entries:
                title_elem = entry.find('atom:title', namespaces)
                link_elem = entry.find('atom:link', namespaces)
                content_elem = entry.find('atom:content', namespaces)
                
                title = title_elem.text if title_elem is not None else ""
                url = link_elem.attrib.get('href', "") if link_elem is not None else ""
                
                snippet = ""
                if content_elem is not None and content_elem.text:
                    # Clean HTML tags using re
                    clean_text = re.sub(r'<[^>]+>', ' ', content_elem.text)
                    # Normalize spaces
                    clean_text = ' '.join(clean_text.split())
                    snippet = clean_text[:200] + "..." if len(clean_text) > 200 else clean_text
                
                # Check if it has a subreddit mention in link
                subreddit = "r/reddit"
                sub_match = re.search(r'/r/([^/]+)', url)
                if sub_match:
                    subreddit = f"r/{sub_match.group(1)}"
                
                if snippet:
                    snippet = f"[{subreddit}] {snippet}"
                else:
                    snippet = f"Post in {subreddit}"
                    
                results.append({
                    "title": title,
                    "snippet": snippet,
                    "url": url,
                    "external_source": "Reddit API"
                })
            return results
    except Exception as e:
        print(f"Error calling Reddit RSS: {e}")
    return []

async def fetch_youtube_search(client, query):
    instances = [
        "https://yewtu.be",
        "https://invidious.nerdvpn.de",
        "https://invidious.flokinet.to",
        "https://vid.puffyan.us"
    ]
    for base_url in instances:
        try:
            url = f"{base_url}/api/v1/search"
            params = {"q": query, "type": "video"}
            headers = {"User-Agent": "DiseeApp/1.0"}
            response = await client.get(url, params=params, headers=headers, timeout=5.0)
            if response.status_code == 200:
                items = response.json()
                if isinstance(items, list):
                    results = []
                    for item in items[:5]:
                        video_id = item.get("videoId", "")
                        title = item.get("title", "")
                        author = item.get("author", "")
                        desc = item.get("description", "")
                        snippet = f"Channel: {author} - {desc[:150]}..." if desc else f"Channel: {author}"
                        url = f"https://www.youtube.com/watch?v={video_id}" if video_id else ""
                        results.append({
                            "title": title,
                            "snippet": snippet,
                            "url": url,
                            "external_source": "YouTube API"
                        })
                    return results
        except Exception as e:
            print(f"Error calling YouTube (Invidious instance {base_url}): {e}")
    return []

async def distribute_to_node(client, url, query, chunk):
    try:
        if not chunk:
            return []
        process_url = url.replace("/search", "/search/process")
        payload = {"query": query, "content": chunk}
        response = await client.post(process_url, json=payload, timeout=5.0)
        if response.status_code == 200:
            return response.json().get("results", [])
    except Exception as e:
        print(f"Error calling node {url}: {e}")
    return []

async def fetch_local_node_search(client, node_url, query, mode):
    try:
        response = await client.get(node_url, params={"q": query, "mode": mode}, timeout=5.0)
        if response.status_code == 200:
            return response.json().get("results", [])
    except Exception as e:
        print(f"Error querying local search from {node_url}: {e}")
    return []

async def _fetch_dynamic_content(client: httpx.AsyncClient, q: str, mode: str) -> list:
    if mode == "code":
        so_res, github_res = await asyncio.gather(
            fetch_stackoverflow_search(client, q),
            fetch_github_search(client, q)
        )
        return so_res + github_res
    elif mode == "prose":
        wiki_res, reddit_res, youtube_res = await asyncio.gather(
            fetch_wikipedia_search(client, q),
            fetch_reddit_search(client, q),
            fetch_youtube_search(client, q)
        )
        return wiki_res + reddit_res + youtube_res
    
    # Default 'all' mode — fetch all concurrently
    wiki_res, so_res, github_res, reddit_res, youtube_res = await asyncio.gather(
        fetch_wikipedia_search(client, q),
        fetch_stackoverflow_search(client, q),
        fetch_github_search(client, q),
        fetch_reddit_search(client, q),
        fetch_youtube_search(client, q)
    )
    return wiki_res + so_res + github_res + reddit_res + youtube_res

async def _partition_and_distribute(client: httpx.AsyncClient, q: str, combined_results: list) -> list:
    node_count = len(NODES)
    chunk_size = (len(combined_results) + node_count - 1) // node_count if combined_results else 0
    
    chunks = []
    for i in range(node_count):
        if chunk_size == 0:
            chunks.append([])
        else:
            chunks.append(combined_results[i * chunk_size : (i + 1) * chunk_size])

    distribute_tasks = [
        distribute_to_node(client, NODES[i], q, chunks[i])
        for i in range(node_count)
    ]
    processed = await asyncio.gather(*distribute_tasks)
    
    merged = []
    for r in processed:
        merged.extend(r)
    return merged

def _deduplicate_and_sort(merged_results: list) -> list:
    unique_merged = []
    seen = set()
    for item in merged_results:
        is_dict = isinstance(item, dict)
        item_id = item.get("title", str(item)) if is_dict else item
        if item_id not in seen:
            seen.add(item_id)
            unique_merged.append(item)
            
    unique_merged.sort(
        key=lambda x: x.get("score", 0.0) if isinstance(x, dict) else 0.0,
        reverse=True
    )
    return unique_merged

@app.get("/search")
async def search(q: str = Query(...), mode: str = Query("all")):
    async with httpx.AsyncClient() as client:
        # 1. Fetch dynamic external results
        dynamic_results = await _fetch_dynamic_content(client, q, mode)

        if NODES:
            # Multi-node mode (Docker Compose / local dev)
            # 2. Fetch local storage results concurrently
            index_mode = "prose" if mode == "all" else mode
            local_tasks = [fetch_local_node_search(client, node_url, q, index_mode) for node_url in NODES]
            local_results_list = await asyncio.gather(*local_tasks)

            # 3. Partition and distribute dynamic results to nodes for processing
            processed_dynamic_results = await _partition_and_distribute(client, q, dynamic_results)

            # 4. Merge all results
            merged = []
            for r in local_results_list:
                merged.extend(r)
            merged.extend(processed_dynamic_results)
        else:
            # Single-service mode (Render) — no nodes available,
            # return external API results directly
            merged = dynamic_results

    # 5. Deduplicate and sort by score
    final_results = _deduplicate_and_sort(merged)

    return {
        "query": q,
        "mode": mode,
        "results": final_results
    }

@app.get("/suggestions")
async def get_suggestions(q: str = Query(...)):
    try:
        async with httpx.AsyncClient() as client:
            url = "https://suggestqueries.google.com/complete/search"
            params = {"client": "firefox", "q": q}
            response = await client.get(url, params=params, timeout=2.0)
            if response.status_code == 200:
                data = response.json()
                if len(data) > 1:
                    return {"suggestions": data[1]}
    except Exception as e:
        print(f"Error fetching suggestions: {e}")
    return {"suggestions": []}
