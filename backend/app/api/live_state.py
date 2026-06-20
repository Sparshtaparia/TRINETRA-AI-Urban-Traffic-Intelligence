from collections import deque
from datetime import datetime, timezone
import uuid

LIVE_EVENT_LIMIT = 500
FRONTEND_EVENT_LIMIT = 20

live_state = {
    "status": "disconnected",
    "source_type": None,
    "mode": None,
    "session_id": None,
    "started_at": None,
    "last_event_at": None,
    "events_received": 0,
    "cursor": 0,
    "events": deque(maxlen=LIVE_EVENT_LIMIT),
    "analytics_cache": {},
    "error": None,
    "source_file": None,
    "poll_interval": 2,
    "events_per_tick": 3,
    "all_normalized_rows": [],
    "last_row_index": 0,
    "mapping": {}
}

def reset_live_state():
    live_state.update({
        "status": "disconnected",
        "source_type": None,
        "mode": None,
        "session_id": None,
        "started_at": None,
        "last_event_at": None,
        "events_received": 0,
        "cursor": 0,
        "events": deque(maxlen=LIVE_EVENT_LIMIT),
        "analytics_cache": {},
        "error": None,
        "source_file": None,
        "poll_interval": 2,
        "events_per_tick": 3,
        "all_normalized_rows": [],
        "last_row_index": 0,
        "mapping": {}
    })

def start_session(source_type: str, mode: str):
    live_state["session_id"] = str(uuid.uuid4())
    live_state["status"] = "connected"
    live_state["source_type"] = source_type
    live_state["mode"] = mode
    live_state["started_at"] = datetime.now(timezone.utc).isoformat()
    live_state["events"].clear()
    live_state["events_received"] = 0
    live_state["cursor"] = 0
    live_state["analytics_cache"] = {}
    live_state["error"] = None
    live_state["last_event_at"] = None

def append_event(event: dict):
    live_state["events"].append(event)
    live_state["events_received"] += 1
    live_state["last_event_at"] = datetime.now(timezone.utc).isoformat()
    live_state["analytics_cache"] = {}

def get_recent_events(limit: int = FRONTEND_EVENT_LIMIT):
    events = list(live_state["events"])
    return events[-limit:]

def get_all_events():
    return list(live_state["events"])

def get_label():
    if live_state["status"] != "connected":
        return "DISCONNECTED"
    m = live_state.get("mode")
    if m == "replay":
        return "CONNECTED · CSV REPLAY MODE"
    elif m == "append":
        return "CONNECTED · CSV APPEND POLLING"
    elif m == "websocket":
        return "CONNECTED · WEBSOCKET STREAM"
    elif m == "demo":
        return "CONNECTED · DEMO STREAM"
    return "CONNECTED"

def compute_analytics():
    if live_state["analytics_cache"]:
        return live_state["analytics_cache"]

    events = get_all_events()
    active = len(events)

    critical_alerts = sum(
        1 for e in events
        if e.get("severity", 0) >= 0.80 or e.get("picq_delta", 0) >= 15
    )

    highest_picq_delta = max([e.get("picq_delta", 0) for e in events], default=0)
    avg_severity = sum([e.get("severity", 0) for e in events]) / active if active > 0 else 0

    severity_sum = sum(e.get("severity", 0) for e in events)
    weighted_picq = sum(min(e.get("picq_delta", 0) / 20.0, 1.0) for e in events)
    confidence_sum = sum(e.get("confidence", 0) for e in events)

    zone_counts = {}
    segment_priority = {}
    for e in events:
        z = e.get("zone", "unknown")
        zone_counts[z] = zone_counts.get(z, 0) + 1
        seg = e.get("road_segment_id") or e.get("segment_id")
        if seg:
            priority = (
                0.50 * e.get("severity", 0)
                + 0.30 * min(e.get("picq_delta", 0) / 20.0, 1.0)
                + 0.20 * e.get("confidence", 0)
            )
            if seg not in segment_priority or priority > segment_priority[seg][0]:
                segment_priority[seg] = (priority, e.get("severity", 0), e.get("picq_delta", 0), e.get("confidence", 0))

    top_zone = max(zone_counts, key=zone_counts.get) if zone_counts else None
    top_segment = max(segment_priority, key=lambda s: segment_priority[s][0]) if segment_priority else None

    dispatch_segment = None
    if segment_priority and top_segment:
        dispatch_segment = top_segment

    analytics = {
        "events_received_total": live_state["events_received"],
        "events_in_memory": active,
        "active_events_last_5_min": active,
        "events_per_second": round(
            live_state["events_per_tick"] / live_state["poll_interval"], 2
        ) if live_state["poll_interval"] > 0 and live_state["mode"] in ("replay", "demo") else 0,
        "critical_alerts": critical_alerts,
        "highest_picq_delta": highest_picq_delta,
        "avg_severity_5m": round(avg_severity, 2),
        "top_zone": top_zone,
        "top_segment": top_segment,
        "recommended_dispatch_segment": dispatch_segment,
        "data_latency_ms": 0,
        "model_confidence": round(confidence_sum / active, 2) if active > 0 else 0,
        "feature_drift_status": "stable" if active > 0 else "unknown",
    }

    live_state["analytics_cache"] = analytics
    return analytics
