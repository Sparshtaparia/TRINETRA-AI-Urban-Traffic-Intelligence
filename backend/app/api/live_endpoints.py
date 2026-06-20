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

    if lat == 0 and lon == 0:
        lat = 12.9716
        lon = 77.5946

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
    if live_state["status"] != "connected":
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
            append_event({
                "event_id": generate_event_id(),
                "timestamp": datetime.now(timezone.utc).isoformat(),
                "road_segment_id": f"SEG-{random.randint(1000, 9999)}",
                "segment_id": f"SEG-{random.randint(1000, 9999)}",
                "zone": random.choice(["Indiranagar", "Koramangala", "Whitefield", "MG Road", "Jayanagar", "BTM Layout"]),
                "latitude": round(12.97 + random.uniform(-0.05, 0.05), 4),
                "longitude": round(77.59 + random.uniform(-0.05, 0.05), 4),
                "violation_type": random.choice(["illegal_parking", "no_parking", "blocking_hydrant", "footpath"]),
                "vehicle_type": random.choice(["car", "bike", "auto", "truck"]),
                "severity": round(random.uniform(0.4, 0.95), 2),
                "picq_delta": round(random.uniform(2.0, 22.0), 1),
                "confidence": round(random.uniform(0.75, 0.99), 2),
                "source": "demo",
                "recommended_action": random.choice(["Dispatch tow unit", "Issue challan", "Monitor", "Alert patrol"]),
                "raw_payload": {}
            })
            new_event_count += 1

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
    if live_state["status"] != "connected":
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

    q = question.lower()

    answer_parts = []
    evidence = {
        "events_analyzed": len(events),
        "recommended_segment": analytics.get("recommended_dispatch_segment"),
        "critical_alerts": analytics.get("critical_alerts", 0),
        "top_zone": top_zone
    }

    if "summarize" in q or "what is happening" in q:
        part = f"The stream has processed {live_state['events_received']} events ({len(events)} in memory). "
        part += f"There are {analytics['critical_alerts']} critical alerts. "
        part += f"Average severity: {analytics['avg_severity_5m']}. "
        if top_zone:
            part += f"Most active zone: {top_zone}. "
        if analytics.get("recommended_dispatch_segment"):
            part += f"Recommended dispatch: {analytics['recommended_dispatch_segment']}."
        answer_parts.append(part)

    if "dispatch" in q or "segment" in q or ("which" in q and "dispatch" in q):
        seg = analytics.get("recommended_dispatch_segment")
        if seg:
            if highest:
                answer_parts.append(
                    f"Based on the latest {len(events)} events, {seg} has the highest live priority "
                    f"because severity is {highest.get('severity', 'N/A')}, "
                    f"PICQ delta is {highest.get('picq_delta', 'N/A')}, "
                    f"and confidence is {highest.get('confidence', 'N/A')}."
                )
            else:
                answer_parts.append(f"Recommended dispatch segment: {seg}.")
        else:
            answer_parts.append("No dispatch recommendation until live events are received.")

    if "critical" in q or "alert" in q:
        count = analytics.get("critical_alerts", 0)
        answer_parts.append(f"There are {count} critical alerts (severity >= 0.80 or PICQ delta >= 15).")
        if critical:
            top_crit = critical[-1]
            answer_parts.append(
                f"Most recent critical: {top_crit.get('road_segment_id', 'N/A')} "
                f"in {top_crit.get('zone', 'N/A')} with severity {top_crit.get('severity', 'N/A')}."
            )

    if "zone" in q or "area" in q or "recurring" in q:
        if top_zone:
            answer_parts.append(
                f"The most recurring zone is {top_zone} with {zone_counts[top_zone]} events "
                f"out of {len(events)} total."
            )
        else:
            answer_parts.append("No zone data available yet.")

    if "severe" in q or "highest" in q or "worst" in q:
        if highest:
            answer_parts.append(
                f"The most severe live event is at {highest.get('road_segment_id', 'N/A')} "
                f"({highest.get('zone', 'N/A')}) — severity {highest.get('severity', 'N/A')}, "
                f"PICQ delta {highest.get('picq_delta', 'N/A')}."
            )
        else:
            answer_parts.append("No events to evaluate severity.")

    if "last 500" in q or "recent" in q or "summary" in q:
        part = f"Analyzing the latest {len(events)} events in memory: "
        part += f"{analytics['critical_alerts']} critical, "
        part += f"average severity {analytics['avg_severity_5m']}, "
        part += f"highest PICQ delta {analytics['highest_picq_delta']}."
        if top_zone:
            part += f" Top zone: {top_zone}."
        answer_parts.append(part)

    if not answer_parts:
        if highest:
            answer_parts.append(
                f"Current live state: {len(events)} events analyzed. "
                f"Top segment: {highest.get('road_segment_id', 'N/A')} "
                f"with severity {highest.get('severity', 'N/A')}. "
                f"{analytics['critical_alerts']} critical alerts active."
            )
        else:
            answer_parts.append(
                f"Current live state: {len(events)} events in memory. "
                f"No significant patterns detected yet."
            )

    return {
        "status": "ready",
        "answer": "\n\n".join(answer_parts),
        "evidence": evidence
    }
