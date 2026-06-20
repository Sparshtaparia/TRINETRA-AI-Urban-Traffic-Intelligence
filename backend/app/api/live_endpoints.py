from fastapi import APIRouter, UploadFile, File, Body
from typing import Dict, Any, List
import pandas as pd
import io
import os
import uuid
from datetime import datetime, timezone
import random
from collections import deque
from app.api.live_state import (
    live_state, reset_live_state, start_session,
    append_event, get_recent_events, get_all_events,
    get_label, compute_analytics,
    LIVE_EVENT_LIMIT, FRONTEND_EVENT_LIMIT
)

router = APIRouter()

UPLOADS_DIR = os.path.join(os.path.dirname(os.path.dirname(os.path.dirname(__file__))), "uploads", "live")
os.makedirs(UPLOADS_DIR, exist_ok=True)


def generate_event_id():
    return f"CSV-{str(uuid.uuid4())[:6].upper()}"


def compute_severity():
    return round(random.uniform(0.5, 0.95), 2)


def compute_picq_delta():
    return round(random.uniform(2.0, 20.0), 1)


def simulate_live_event(source_type: str) -> dict:
    segment_id = f"SEG-{random.randint(1000, 9999)}"
    severity = compute_severity()
    
    return {
        "event_id": generate_event_id(),
        "timestamp": datetime.now(timezone.utc).isoformat(),
        "road_segment_id": segment_id,
        "segment_id": segment_id,
        "zone": random.choice(["Indiranagar", "Koramangala", "Whitefield", "MG Road", "Jayanagar", "BTM Layout"]),
        "latitude": round(12.97 + random.uniform(-0.05, 0.05), 4),
        "longitude": round(77.59 + random.uniform(-0.05, 0.05), 4),
        "violation_type": random.choice(["illegal_parking", "no_parking", "blocking_hydrant", "footpath"]),
        "vehicle_type": random.choice(["car", "bike", "auto", "truck"]),
        "severity": severity,
        "picq_delta": compute_picq_delta(),
        "confidence": round(random.uniform(0.75, 0.99), 2),
        "source": source_type,
        "recommended_action": "Dispatch tow unit" if severity >= 0.8 else "Monitor",
        "raw_payload": {}
    }


def normalize_row(row: pd.Series, mapping: dict, source_type: str) -> dict:
    ts_col = mapping.get("timestamp")
    timestamp = str(row.get(ts_col) if ts_col else datetime.now(timezone.utc).isoformat())

    try:
        lat = float(row.get(mapping.get("latitude"), 0) or 0)
    except (ValueError, TypeError):
        lat = 0

    try:
        lon = float(row.get(mapping.get("longitude"), 0) or 0)
    except (ValueError, TypeError):
        lon = 0

    if lat == 0 or lon == 0:
        lat = round(12.9716 + random.uniform(-0.05, 0.05), 4)
        lon = round(77.5946 + random.uniform(-0.05, 0.05), 4)

    segment_id = str(row.get(mapping.get("road_segment_id"), f"SEG-{random.randint(1000, 9999)}"))
    violation_type = str(row.get(mapping.get("violation_type"), "illegal_parking"))
    zone = str(row.get(mapping.get("zone"), "central"))
    vehicle_type = str(row.get(mapping.get("vehicle_type"), "car"))

    severity = compute_severity()
    picq_delta = compute_picq_delta()
    confidence = round(random.uniform(0.8, 0.99), 2)

    action = "Dispatch tow unit" if severity >= 0.8 else "Monitor"

    return {
        "event_id": generate_event_id(),
        "timestamp": timestamp,
        "road_segment_id": segment_id,
        "segment_id": segment_id,
        "zone": zone,
        "latitude": lat,
        "longitude": lon,
        "violation_type": violation_type,
        "vehicle_type": vehicle_type,
        "severity": severity,
        "picq_delta": picq_delta,
        "confidence": confidence,
        "source": source_type,
        "recommended_action": action,
        "raw_payload": {}
    }


@router.post("/upload-csv-source")
async def upload_csv_source(file: UploadFile = File(...)):
    contents = await file.read()
    file_id = f"live_{datetime.now().strftime('%Y%m%d_%H%M%S')}_{file.filename}"
    file_path = os.path.join(UPLOADS_DIR, file_id)

    with open(file_path, "wb") as f:
        f.write(contents)

    return {
        "status": "uploaded",
        "source_type": "csv_replay",
        "file_id": file_id,
        "file_name": file.filename,
        "file_size_mb": round(len(contents) / (1024 * 1024), 2),
        "message": "File uploaded. Validate schema before starting replay."
    }


@router.post("/validate-csv-source")
def validate_csv_source(payload: Dict[str, Any] = Body(...)):
    file_id = payload.get("file_id")
    if not file_id:
        return {"status": "error", "message": "file_id required"}

    file_path = os.path.join(UPLOADS_DIR, file_id)
    if not os.path.exists(file_path):
        return {"status": "error", "message": "File not found"}

    try:
        if file_path.endswith(".csv"):
            df = pd.read_csv(file_path, nrows=5)
        else:
            df = pd.read_excel(file_path, nrows=5)

        columns = list(df.columns)
        detected_mapping = {}
        for col in columns:
            col_lower = col.lower()
            if "time" in col_lower or "date" in col_lower:
                detected_mapping["timestamp"] = {"column": col, "confidence": "High"}
            elif "lat" in col_lower:
                detected_mapping["latitude"] = {"column": col, "confidence": "High"}
            elif "lon" in col_lower or "lng" in col_lower:
                detected_mapping["longitude"] = {"column": col, "confidence": "High"}
            elif "segment" in col_lower:
                detected_mapping["road_segment_id"] = {"column": col, "confidence": "High"}
            elif "offence" in col_lower or "violation" in col_lower:
                detected_mapping["violation_type"] = {"column": col, "confidence": "Medium"}
            elif "zone" in col_lower or "police" in col_lower or "station" in col_lower:
                detected_mapping["zone"] = {"column": col, "confidence": "Medium"}

        return {
            "status": "ready",
            "detected_mapping": detected_mapping,
            "can_replay": True,
            "warnings": []
        }
    except Exception as e:
        return {"status": "error", "message": str(e)}


@router.post("/start-csv-replay")
def start_csv_replay(payload: Dict[str, Any] = Body(...)):
    file_id = payload.get("file_id")
    poll_interval = payload.get("poll_interval", 2)
    events_per_tick = payload.get("events_per_tick", 3)
    mapping = payload.get("mapping", {})

    file_path = os.path.join(UPLOADS_DIR, file_id)
    if not os.path.exists(file_path):
        return {"status": "error", "message": "File not found"}

    try:
        if file_path.endswith(".csv"):
            df = pd.read_csv(file_path)
        else:
            df = pd.read_excel(file_path)

        # Basic EDA: Convert timestamp, sort ascending, fillna
        ts_col = mapping.get("timestamp")
        if ts_col and ts_col in df.columns:
            df[ts_col] = pd.to_datetime(df[ts_col], errors="coerce")
            df = df.dropna(subset=[ts_col])
            df = df.sort_values(by=ts_col, ascending=True)
            df[ts_col] = df[ts_col].dt.strftime('%Y-%m-%dT%H:%M:%S')

        # Provide a default mock coordinate mapping if missing
        if "latitude" not in mapping:
            mapping["latitude"] = "latitude"
            if "latitude" not in df.columns:
                df["latitude"] = 12.9716
        if "longitude" not in mapping:
            mapping["longitude"] = "longitude"
            if "longitude" not in df.columns:
                df["longitude"] = 77.5946

        reset_live_state()
        start_session("csv_polling", "replay")

        normalized_events = []
        for _, row in df.iterrows():
            normalized_events.append(normalize_row(row, mapping, "csv_replay"))

        live_state["source_file"] = file_id
        live_state["all_normalized_rows"] = normalized_events
        live_state["cursor"] = 0
        live_state["poll_interval"] = poll_interval
        live_state["events_per_tick"] = events_per_tick

        return {
            "status": "connected",
            "source_type": "csv_polling",
            "mode": "replay",
            "session_id": live_state["session_id"],
            "label": "CONNECTED · CSV REPLAY MODE",
            "message": "CSV replay started successfully."
        }
    except Exception as e:
        return {"status": "error", "message": str(e)}


@router.post("/start-file-polling")
def start_file_polling(payload: Dict[str, Any] = Body(...)):
    file_path = payload.get("file_path")
    poll_interval = payload.get("poll_interval", 3)
    mapping = payload.get("mapping", {})

    if not os.path.isabs(file_path):
        file_path = os.path.join(os.path.dirname(os.path.dirname(os.path.dirname(__file__))), file_path)

    if not os.path.exists(file_path):
        return {"status": "error", "message": f"File not found: {file_path}"}

    try:
        if file_path.endswith(".csv"):
            df = pd.read_csv(file_path)
        else:
            df = pd.read_excel(file_path)

        reset_live_state()
        start_session("csv_polling", "append")

        live_state["source_file"] = file_path
        live_state["last_row_index"] = len(df)
        live_state["poll_interval"] = poll_interval
        live_state["events_per_tick"] = 0
        live_state["mapping"] = mapping

        return {
            "status": "connected",
            "source_type": "csv_polling",
            "mode": "append",
            "session_id": live_state["session_id"],
            "label": "CONNECTED · CSV APPEND POLLING",
            "message": f"Started polling {file_path}. Waiting for new rows."
        }
    except Exception as e:
        return {"status": "error", "message": str(e)}


@router.post("/start-demo-stream")
def start_demo_stream():
    reset_live_state()
    start_session("websocket", "demo")

    live_state["poll_interval"] = 2
    live_state["events_per_tick"] = 3

    return {
        "status": "connected",
        "source_type": "websocket",
        "mode": "demo",
        "session_id": live_state["session_id"],
        "label": "CONNECTED · DEMO STREAM",
        "message": "Demo stream started."
    }


@router.post("/stop")
def stop_live():
    reset_live_state()
    return {"status": "stopped", "message": "Live stream stopped."}


@router.post("/pause")
def pause_live():
    if live_state["status"] == "connected":
        live_state["status"] = "paused"
    return {"status": "paused", "message": "Live stream paused."}


@router.post("/resume")
def resume_live():
    if live_state["status"] == "paused":
        live_state["status"] = "connected"
    return {"status": "connected", "message": "Live stream resumed."}


@router.get("/status")
def get_status():
    if live_state["status"] == "disconnected":
        return {
            "status": "disconnected",
            "label": "DISCONNECTED",
            "message": "Not running."
        }

    analytics = compute_analytics()
    return {
        "status": live_state["status"],
        "session_id": live_state["session_id"],
        "source_type": live_state["source_type"],
        "mode": live_state["mode"],
        "label": get_label(),
        "events_received": live_state["events_received"],
        "events_in_memory": len(live_state["events"]),
        "analytics_window_size": LIVE_EVENT_LIMIT,
        "last_event_at": live_state["last_event_at"],
        "analytics": analytics
    }


@router.get("/events")
def get_events():
    if live_state["status"] not in ["connected", "paused"]:
        return {
            "status": "disconnected",
            "session_id": None,
            "events_received": 0,
            "analytics_window_size": LIVE_EVENT_LIMIT,
            "frontend_event_limit": FRONTEND_EVENT_LIMIT,
            "events": [],
            "analytics": {},
            "message": "Not running."
        }

    new_event_count = 0

    if live_state["status"] == "connected":
        if live_state["mode"] == "replay":
            cursor = live_state["cursor"]
            limit = live_state["events_per_tick"]
            total = len(live_state["all_normalized_rows"])

            if cursor < total:
                new_rows = live_state["all_normalized_rows"][cursor:cursor + limit]
                live_state["cursor"] += limit
                for row in new_rows:
                    append_event(row)
                new_event_count = len(new_rows)

        elif live_state["mode"] == "append":
            file_path = live_state["source_file"]
            mapping = live_state.get("mapping", {})
            try:
                if os.path.exists(file_path):
                    if file_path.endswith(".csv"):
                        df = pd.read_csv(file_path)
                    else:
                        df = pd.read_excel(file_path)

                    current_len = len(df)
                    last_idx = live_state["last_row_index"]

                    if current_len > last_idx:
                        new_rows = df.iloc[last_idx:]
                        live_state["last_row_index"] = current_len
                        for _, row in new_rows.iterrows():
                            append_event(normalize_row(row, mapping, "csv_polling"))
                        new_event_count = len(new_rows)
            except Exception as e:
                print("Append read error:", e)

        elif live_state["mode"] == "demo":
            for _ in range(live_state["events_per_tick"]):
                append_event(simulate_live_event("demo"))
            new_event_count = live_state["events_per_tick"]

    msg = ""
    if live_state["mode"] == "append" and new_event_count == 0:
        if live_state["last_event_at"]:
            from datetime import datetime, timezone
            try:
                last = datetime.fromisoformat(live_state["last_event_at"])
                if (datetime.now(timezone.utc) - last).total_seconds() > 10:
                    msg = "Connected, but no new rows detected. Append rows to the watched CSV or switch to CSV Replay Mode."
            except Exception:
                pass
        else:
            msg = "Connected, but no new rows detected yet."
    elif live_state["mode"] == "replay" and live_state["cursor"] >= len(live_state["all_normalized_rows"]):
        msg = "Replay finished."

    analytics = compute_analytics()
    recent = get_recent_events(FRONTEND_EVENT_LIMIT)

    return {
        "status": "connected",
        "session_id": live_state["session_id"],
        "source_type": live_state["source_type"],
        "mode": live_state["mode"],
        "label": get_label(),
        "events_received": live_state["events_received"],
        "analytics_window_size": LIVE_EVENT_LIMIT,
        "frontend_event_limit": FRONTEND_EVENT_LIMIT,
        "events": recent,
        "new_events_count": new_event_count,
        "analytics": analytics,
        "message": msg if msg else "OK"
    }


@router.get("/analytics")
def get_live_analytics():
    if live_state["status"] != "connected":
        return {
            "status": "disconnected",
            "analytics": {},
            "message": "Not running."
        }

    analytics = compute_analytics()
    return {
        "status": "connected",
        "session_id": live_state["session_id"],
        "analytics_window_size": LIVE_EVENT_LIMIT,
        "analytics": analytics
    }


@router.get("/dispatch")
def get_dispatch():
    analytics = compute_analytics()
    seg = analytics.get("recommended_dispatch_segment")
    if seg:
        return {
            "status": "ok",
            "dispatch": seg,
            "analytics": analytics
        }
    return {
        "status": "waiting",
        "message": "No dispatch recommendation until live events are received.",
        "analytics": analytics
    }


@router.get("/map-events")
def get_map_events():
    if live_state["status"] not in ["connected", "paused"]:
        return {
            "status": "disconnected",
            "events": [],
            "message": "No active live stream."
        }

    all_events = get_all_events()
    coord_events = [
        e for e in all_events
        if e.get("latitude") and e.get("longitude")
        and e["latitude"] != 0 and e["longitude"] != 0
    ]

    if not coord_events:
        return {
            "status": "ok",
            "events": [],
            "message": "Live Map requires latitude/longitude. Current stream has no coordinate events.",
            "total_coordinate_events": 0
        }

    latest = coord_events[-100:]
    return {
        "status": "ok",
        "events": latest,
        "total_coordinate_events": len(latest),
        "message": "OK"
    }


@router.post("/ask-trinetra")
def ask_live_trinetra(payload: Dict[str, Any] = Body(...)):
    question = payload.get("question", "")
    if not question:
        return {"status": "error", "message": "question required"}

    events = get_all_events()
    if not events:
        return {
            "status": "ready",
            "answer": "Start a live stream or CSV replay first so I can answer using live TRINETRA intelligence.",
            "evidence": {"events_analyzed": 0}
        }

    analytics = compute_analytics()
    recent = get_recent_events(FRONTEND_EVENT_LIMIT)

    highest = max(events, key=lambda e: (
        0.50 * e.get("severity", 0)
        + 0.30 * min(e.get("picq_delta", 0) / 20.0, 1.0)
        + 0.20 * e.get("confidence", 0)
    )) if events else None

    critical = [e for e in events if e.get("severity", 0) >= 0.80 or e.get("picq_delta", 0) >= 15]

    zone_counts = {}
    for e in events:
        z = e.get("zone", "unknown")
        zone_counts[z] = zone_counts.get(z, 0) + 1
    top_zone = max(zone_counts, key=zone_counts.get) if zone_counts else None

    evidence = {
        "events_analyzed": len(events),
        "recommended_segment": analytics.get("recommended_dispatch_segment"),
        "critical_alerts": analytics.get("critical_alerts", 0),
        "top_zone": top_zone
    }

    import google.generativeai as genai
    from dotenv import load_dotenv
    import os

    base_dir = os.path.dirname(os.path.dirname(os.path.dirname(__file__)))
    env_path = os.path.join(base_dir, ".env")
    load_dotenv(dotenv_path=env_path)
    
    keys = [os.getenv(k) for k in ["Gemini_API", "GEMINI_API_KEY_1", "GEMINI_API_KEY_2", "GEMINI_API_KEY_3"] if os.getenv(k)]
    if not keys:
        return {"status": "error", "message": "No Gemini API keys found in environment"}

    system_prompt = f"""You are TRINETRA AI, assisting with LIVE parking enforcement operations.
You MUST rely strictly on the provided live metrics. Be concise, professional, and do NOT write code.

LIVE METRICS CONTEXT:
- Total Events in Memory: {len(events)}
- Critical Alerts Active: {analytics.get('critical_alerts', 0)}
- Most Active Zone: {top_zone}
- Recommended Dispatch Segment: {analytics.get('recommended_dispatch_segment', 'N/A')}
- Average Severity (Last 5m): {analytics.get('avg_severity_5m', 0)}
- Highest PICQ Delta: {analytics.get('highest_picq_delta', 0)}"""

    last_err = None
    for key in keys:
        try:
            genai.configure(api_key=key)
            model = genai.GenerativeModel('gemini-2.5-flash', system_instruction=system_prompt)
            response = model.generate_content(question)
            
            return {
                "status": "ready",
                "answer": response.text,
                "evidence": evidence
            }
        except Exception as e:
            last_err = e
            continue

    return {
        "status": "ready",
        "answer": f"Error reaching AI: {str(last_err)}",
        "evidence": evidence
    }
