"use client";

import { createContext, useContext, useState, useEffect, useRef, type ReactNode } from "react";
import { API_BASE } from "./api";

export interface LiveAnalytics {
  events_received_total: number;
  events_in_memory: number;
  active_events_last_5_min: number;
  events_per_second: number;
  critical_alerts: number;
  highest_picq_delta: number;
  avg_severity_5m: number;
  top_zone: string | null;
  top_segment: string | null;
  recommended_dispatch_segment: string | null;
  data_latency_ms: number;
  model_confidence: number;
  feature_drift_status: string;
}

export interface LiveEvent {
  event_id: string;
  timestamp: string;
  road_segment_id: string;
  segment_id: string;
  zone: string;
  latitude: number;
  longitude: number;
  violation_type: string;
  vehicle_type: string;
  severity: number;
  picq_delta: number;
  confidence: number;
  source: string;
  recommended_action: string;
  raw_payload: Record<string, unknown>;
}

export interface LiveSnapshot {
  status: string;
  session_id: string | null;
  source_type: string | null;
  mode: string | null;
  label: string;
  events_received: number;
  analytics_window_size: number;
  frontend_event_limit: number;
  events: LiveEvent[];
  new_events_count: number;
  analytics: LiveAnalytics;
  message: string;
}

interface LiveSessionState {
  snapshot: LiveSnapshot | null;
  connected: boolean;
  loading: boolean;
  error: string | null;
  stopStream: () => Promise<void>;
}

const LiveSessionContext = createContext<LiveSessionState>({
  snapshot: null,
  connected: false,
  loading: false,
  error: null,
  stopStream: async () => {}
});

export function useLiveSession() {
  return useContext(LiveSessionContext);
}

export function LiveSessionProvider({ children }: { children: ReactNode }) {
  const [snapshot, setSnapshot] = useState<LiveSnapshot | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const activeRef = useRef(true);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const connected = snapshot?.status === "connected";

  const doFetch = async () => {
    if (!activeRef.current) return;
    try {
      setLoading(true);
      setError(null);
      const res = await fetch(`${API_BASE}/api/live/events`);
      if (!res.ok) {
        if (activeRef.current) setSnapshot(null);
        return;
      }
      const data = await res.json();
      if (activeRef.current) setSnapshot(data as LiveSnapshot);
    } catch (err) {
      if (activeRef.current) {
        setError(err instanceof Error ? err.message : "Failed to fetch live data");
      }
    } finally {
      if (activeRef.current) setLoading(false);
    }
  };

  const stopStream = async () => {
    activeRef.current = false;
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
    try {
      await fetch(`${API_BASE}/api/live/stop`, { method: "POST" });
    } catch (e) {
      console.error("Stop stream error:", e);
    }
    localStorage.removeItem("live_source_type");
    setSnapshot(null);
  };

  useEffect(() => {
    activeRef.current = true;
    const type = localStorage.getItem("live_source_type");
    if (!type) return;

    doFetch();
    intervalRef.current = setInterval(doFetch, 2000);

    return () => {
      activeRef.current = false;
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };
  }, []);

  return (
    <LiveSessionContext.Provider value={{ snapshot, connected, loading, error, stopStream }}>
      {children}
    </LiveSessionContext.Provider>
  );
}
