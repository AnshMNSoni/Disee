from fastapi import APIRouter, Query
from pydantic import BaseModel
from typing import List, Dict, Any
from app.services.search_services import search, process_wiki_chunk

router = APIRouter(prefix="/search", tags=["Search"])

class ProcessRequest(BaseModel):
    query: str
    content: List[Dict[str, Any]]

@router.get("")
def search_query(q: str = Query(...)):
    results = search(q)
    return {"query": q, "results": results}

@router.post("/process")
def process_dynamic(payload: ProcessRequest):
    results = process_wiki_chunk(payload.query, payload.content)
    return {"query": payload.query, "results": results}
