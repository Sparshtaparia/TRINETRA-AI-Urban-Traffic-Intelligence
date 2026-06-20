from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from fastapi.responses import JSONResponse
import os
from app.api import endpoints, live_endpoints

app = FastAPI(title="TRINETRA-P API")

# CORS must be the FIRST middleware registered
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=False,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Explicit OPTIONS handler so Vercel doesn't swallow the preflight
@app.options("/{full_path:path}")
async def options_handler(full_path: str):
    return JSONResponse(
        content={},
        status_code=200,
        headers={
            "Access-Control-Allow-Origin": "*",
            "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
            "Access-Control-Allow-Headers": "Content-Type, Authorization",
        }
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
