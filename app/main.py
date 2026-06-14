from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.api import search_routes

app = FastAPI(title="Search Engine")

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "https://disee.xyz",
        "https://www.disee.xyz",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.on_event("startup")
def startup_event():
    print("Node startup: Ready to process dynamic Wikipedia queries...")

app.include_router(search_routes.router)