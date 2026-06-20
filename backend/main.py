import traceback
import os
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse

# ── capture startup errors so we can diagnose on Vercel ──────────────────────
_startup_error: str = ""

app = FastAPI(title="TRINETRA-P API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=False,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.options("/{full_path:path}")
async def options_handler(full_path: str):
    return JSONResponse(content={}, status_code=200, headers={
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
        "Access-Control-Allow-Headers": "Content-Type, Authorization",
    })

# ── debug endpoint – always works even if routers fail to load ────────────────
@app.get("/api/debug")
def debug():
    return {
        "startup_error": _startup_error or None,
        "VERCEL": os.getenv("VERCEL"),
        "VERCEL_ENV": os.getenv("VERCEL_ENV"),
        "AWS_REGION": os.getenv("AWS_REGION"),
        "python_path": os.getenv("PYTHONPATH", ""),
        "env_keys": sorted(k for k in os.environ if not k.startswith("npm_")),
    }

@app.get("/api/health")
def health():
    if _startup_error:
        return JSONResponse(status_code=500, content={"status": "crashed", "error": _startup_error})
    return {"status": "ok"}

@app.get("/")
def root():
    return {"status": "ok"}

# ── load routers, catching any failure ────────────────────────────────────────
try:
    from app.api import endpoints, live_endpoints
    app.include_router(endpoints.router, prefix="/api")
    app.include_router(live_endpoints.router, prefix="/api/live")

    from fastapi.staticfiles import StaticFiles
    figures_dir = os.path.join(os.path.dirname(__file__), "processed", "figures")
    if os.path.exists(figures_dir):
        app.mount("/api/static/figures", StaticFiles(directory=figures_dir), name="figures")

except Exception:
    _startup_error = traceback.format_exc()
