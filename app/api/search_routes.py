from fastapi import APIRouter, Query
from app.services.search_services import search

router = APIRouter(prefix="/search", tags=["Search"])

@router.get("")
def search_query(q: str = Query(...)):
    results = search(q)
    return {"query": q, "results": results}
