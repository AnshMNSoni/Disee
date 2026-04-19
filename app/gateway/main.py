from fastapi import FastAPI, Query
from fastapi.middleware.cors import CORSMiddleware
import httpx
import asyncio

app = FastAPI(title="Search Gateway")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# All node URLs
NODES = [
    "http://node1:8000/search",
    "http://node2:8000/search",
    "http://node3:8000/search",
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

@app.get("/search")
async def search(q: str = Query(...)):
    async with httpx.AsyncClient() as client:
        # Dynamically fetch content from Wikipedia and StackOverflow
        wiki_task = fetch_wikipedia_search(client, q)
        so_task = fetch_stackoverflow_search(client, q)
        
        wiki_results, so_results = await asyncio.gather(wiki_task, so_task)
        combined_results = wiki_results + so_results
        
        # Partition data across the available nodes
        node_count = len(NODES)
        chunk_size = (len(combined_results) + node_count - 1) // node_count if combined_results else 0
        
        chunks = []
        for i in range(node_count):
            if chunk_size == 0:
                chunks.append([])
            else:
                chunks.append(combined_results[i * chunk_size : (i + 1) * chunk_size])

        # Distribute chunks to nodes
        tasks = [
            distribute_to_node(client, NODES[i], q, chunks[i])
            for i in range(node_count)
        ]
        
        node_results = await asyncio.gather(*tasks)

    merged = []
    for r in node_results:
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

    return {
        "query": q,
        "results": unique_merged
    }
