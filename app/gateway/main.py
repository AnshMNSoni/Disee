from fastapi import FastAPI, Query
from fastapi.middleware.cors import CORSMiddleware
import httpx
import asyncio

app = FastAPI(title="Search Gateway")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=False,
    allow_methods=["*"],
    allow_headers=["*"],
)

import os

# Check environment or fallback to localhost if not in container environment
IN_DOCKER = os.path.exists("/.dockerenv") or os.environ.get("IN_DOCKER", "false").lower() == "true"

if IN_DOCKER:
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
        return await fetch_stackoverflow_search(client, q)
    elif mode == "prose":
        return await fetch_wikipedia_search(client, q)
    
    # Default 'all' mode — fetch both concurrently
    wiki_res, so_res = await asyncio.gather(
        fetch_wikipedia_search(client, q),
        fetch_stackoverflow_search(client, q)
    )
    return wiki_res + so_res

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
        dynamic_results_task = _fetch_dynamic_content(client, q, mode)
        
        # 2. Fetch local storage results concurrently
        index_mode = "prose" if mode == "all" else mode
        local_tasks = [fetch_local_node_search(client, node_url, q, index_mode) for node_url in NODES]
        
        dynamic_results, local_results_list = await asyncio.gather(
            dynamic_results_task,
            asyncio.gather(*local_tasks)
        )
        
        # 3. Partition and distribute dynamic results to nodes
        processed_dynamic_results = await _partition_and_distribute(client, q, dynamic_results)

    # 4. Merge all results
    merged = []
    for r in local_results_list:
        merged.extend(r)
    merged.extend(processed_dynamic_results)

    # 5. Deduplicate and sort by score
    final_results = _deduplicate_and_sort(merged)

    return {
        "query": q,
        "mode": mode,
        "results": final_results
    }
