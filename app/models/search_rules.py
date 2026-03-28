from pydantic import BaseModel
from typing import List

class SearchResponse(BaseModel):
    query: str
    results: List[str]
