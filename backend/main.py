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
        "figures_dir": os.path.join(os.path.dirname(__file__), "processed", "figures"),
        "figures_dir_exists": os.path.exists(os.path.join(os.path.dirname(__file__), "processed", "figures")),
    }

@app.get("/api/health")
def health():
    if _startup_error:
        return JSONResponse(status_code=500, content={"status": "crashed", "error": _startup_error})
    return {"status": "ok"}

@app.get("/api/health")
def health_check():
    return {"status": "ok"}

@app.get("/api/debug-env")
def debug_env():
    import os
    keys = {k: "SET" if os.getenv(k) else "MISSING" for k in ["Gemini_API", "GEMINI_API_KEY_1", "GEMINI_API_KEY_2", "GEMINI_API_KEY_3", "MAPMYINDIA_REST_API_KEY"]}
    return {"status": "ok", "env_vars": keys}

@app.get("/api/debug-gemini")
def debug_gemini():
    import os, requests
    key = os.getenv("Gemini_API") or os.getenv("GEMINI_API_KEY_1") or os.getenv("GEMINI_API_KEY_3")
    url = f"https://generativelanguage.googleapis.com/v1beta/models?key={key}"
    try:
        resp = requests.get(url).json()
        models = [m["name"] for m in resp.get("models", [])]
        while "nextPageToken" in resp:
            resp = requests.get(url + "&pageToken=" + resp["nextPageToken"]).json()
            models.extend([m["name"] for m in resp.get("models", [])])
        return {"gemini_models": [m for m in models if "gemini" in m]}
    except Exception as e:
        return {"error": str(e)}

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
        # Mount at /figures/ to avoid conflict with /api/static/* router routes
        app.mount("/figures", StaticFiles(directory=figures_dir), name="figures")

except Exception:
    _startup_error = traceback.format_exc()
