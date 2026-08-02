from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.api import search_routes

app = FastAPI(title="Search Engine")

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "https://disee.xyz",
        "https://www.disee.xyz",
        "https://diseeee.onrender.com",
        "http://localhost:5173",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
@app.on_event("startup")
def startup_event():
    print("Node startup: Ready to process queries...")
    from app.services.index_services import build_index
    build_index()

app.include_router(search_routes.router)