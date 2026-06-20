from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
import os
from app.api import endpoints, live_endpoints

app = FastAPI(title="TRINETRA-P API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(endpoints.router, prefix="/api")
app.include_router(live_endpoints.router, prefix="/api/live")

base_dir = os.path.dirname(__file__)
figures_dir = os.path.join(base_dir, "processed", "figures")
if os.path.exists(figures_dir):
    app.mount("/api/static/figures", StaticFiles(directory=figures_dir), name="figures")

@app.get("/")
def read_root():
    return {"status": "ok", "message": "TRINETRA-P Backend is running"}
