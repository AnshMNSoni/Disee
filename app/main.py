from fastapi import FastAPI
from app.api import search_routes
from app.services.index_services import build_index

app = FastAPI(title="Search Engine")

@app.on_event("startup")
def startup_event():
    print("Building index at startup...")
    build_index()
    print("Index ready!")
    
app.include_router(search_routes.router)
