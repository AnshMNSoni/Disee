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


async def fetch_results(client, url, query):
    try:
        response = await client.get(url, params={"q": query}, timeout=5.0)
        data = response.json()
        return data.get("results", [])
    except Exception as e:
        print(f"Error calling {url}: {e}")
        return []  # Fail-safe


@app.get("/search")
async def search(q: str = Query(...)):
    async with httpx.AsyncClient() as client:
        tasks = [
            fetch_results(client, node, q)
            for node in NODES
        ]

        results = await asyncio.gather(*tasks)

    merged = []
    for r in results:
        merged.extend(r)

    # Remove duplicates
    merged = list(set(merged))

    return {
        "query": q,
        "results": merged
    }
