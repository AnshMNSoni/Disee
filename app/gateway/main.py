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

@app.get("/search")
async def search(q: str = Query(...), mode: str = Query("all")):
    async with httpx.AsyncClient() as client:
<<<<<<< HEAD
        # 1. Fetch dynamic content based on mode
        #    'all' fetches both, 'prose' = Wikipedia only, 'code' = StackOverflow only
        if mode == "code":
            wiki_results, so_results = [], await fetch_stackoverflow_search(client, q)
        elif mode == "prose":
            wiki_results, so_results = await fetch_wikipedia_search(client, q), []
        else:
            # Default 'all' mode — fetch both concurrently
            wiki_results, so_results = await asyncio.gather(
                fetch_wikipedia_search(client, q),
                fetch_stackoverflow_search(client, q)
            )
        
        # 2. Concurrently query all local storage nodes (uses prose index for 'all')
        index_mode = "prose" if mode == "all" else mode
        local_tasks = [fetch_local_node_search(client, node_url, q, index_mode) for node_url in NODES]
        
        # Execute local node queries concurrently
        local_results_list = await asyncio.gather(*local_tasks)
        
        combined_results = wiki_results + so_results
=======
        # Dynamically fetch content from Wikipedia, StackOverflow, and GitHub
        wiki_task = fetch_wikipedia_search(client, q)
        so_task = fetch_stackoverflow_search(client, q)
        github_task = fetch_github_search(client, q)
        
        wiki_results, so_results, github_results = await asyncio.gather(wiki_task, so_task, github_task)
        combined_results = wiki_results + so_results + github_results
>>>>>>> upstream/main
        
        # Partition dynamic data across the available nodes for processing
        node_count = len(NODES)
        chunk_size = (len(combined_results) + node_count - 1) // node_count if combined_results else 0
        
        chunks = []
        for i in range(node_count):
            if chunk_size == 0:
                chunks.append([])
            else:
                chunks.append(combined_results[i * chunk_size : (i + 1) * chunk_size])

        # Distribute chunks to nodes
        distribute_tasks = [
            distribute_to_node(client, NODES[i], q, chunks[i])
            for i in range(node_count)
        ]
        
        processed_dynamic_results = await asyncio.gather(*distribute_tasks)

    # Merge all local and dynamic results
    merged = []
    for r in local_results_list:
        merged.extend(r)
    for r in processed_dynamic_results:
        merged.extend(r)

    # Convert complex structures like dicts to sortable types to eliminate duplicates
    unique_merged = []
    seen = set()
    for item in merged:
        if isinstance(item, dict):
            item_id = item.get("title", str(item))
            if item_id not in seen:
                seen.add(item_id)
                unique_merged.append(item)
        else:
            if item not in seen:
                seen.add(item)
                unique_merged.append(item)

    # Sort results by score (highest first)
    unique_merged.sort(key=lambda x: x.get("score", 0.0) if isinstance(x, dict) else 0.0, reverse=True)

    return {
        "query": q,
        "mode": mode,
        "results": unique_merged
    }

