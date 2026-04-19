from fastapi import FastAPI
from app.api import search_routes

app = FastAPI(title="Search Engine")

@app.on_event("startup")
def startup_event():
    print("Node startup: Ready to process dynamic Wikipedia queries...")
    
app.include_router(search_routes.router)