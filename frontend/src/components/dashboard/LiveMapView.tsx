"use client";

import { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { MapPin, AlertCircle, Loader2 } from "lucide-react";
import { useLiveSession } from "@/lib/LiveSessionProvider";
import { API_BASE } from "../../lib/api";

type MapState = "loading" | "missing_key" | "no_coordinates" | "ready" | "error";

interface CoordEvent {
  event_id: string;
  road_segment_id: string;
  segment_id: string;
  zone: string;
  latitude: number;
  longitude: number;
  severity: number;
  picq_delta: number;
  recommended_action: string;
  timestamp: string;
}

export function LiveMapView() {
  const [mapState, setMapState] = useState<MapState>("loading");
  const [mapError, setMapError] = useState<string | null>(null);
  const [coordEvents, setCoordEvents] = useState<CoordEvent[]>([]);
  const [mapSdkLoaded, setMapSdkLoaded] = useState(false);
  const { connected } = useLiveSession();

  // Check for MapMyIndia SDK key
  const mapSdkKey = process.env.NEXT_PUBLIC_MAPMYINDIA_MAP_SDK_KEY || null;

  useEffect(() => {
    if (!mapSdkKey) {
      setMapState("missing_key");
      return;
    }
    setMapState("loading");
  }, [mapSdkKey]);

  // Fetch coordinate events
  useEffect(() => {
    if (!connected) return;

    const fetchMapEvents = async () => {
      try {
        const res = await fetch(`${API_BASE}/api/live/map-events`);
        const data = await res.json();
        if (data.status === "ok") {
          const valid = (data.events || []).filter(
            (e: any) => e.latitude && e.longitude && e.latitude !== 0 && e.longitude !== 0
          );
          setCoordEvents(valid);
          if (valid.length === 0) {
            setMapState("no_coordinates");
          } else {
            setMapState("ready");
          }
          setMapError(null);
        } else {
          setMapState("no_coordinates");
          setMapError(data.message || null);
        }
      } catch (err) {
        setMapState("error");
        setMapError("Failed to fetch map events from backend.");
      }
    };

    fetchMapEvents();
    const interval = setInterval(fetchMapEvents, 3000);
    return () => clearInterval(interval);
  }, [connected]);

  const renderState = () => {
    switch (mapState) {
      case "loading":
        return (
          <div className="flex flex-col items-center justify-center py-24 text-neutral-500 gap-3">
            <Loader2 className="w-10 h-10 animate-spin text-neutral-700" />
            <p className="font-medium">Loading map data...</p>
          </div>
        );

      case "missing_key":
        return (
          <div className="flex flex-col items-center justify-center py-24 text-neutral-500 gap-3">
            <AlertCircle className="w-10 h-10 text-yellow-500" />
            <p className="font-medium text-yellow-400">Map SDK key missing.</p>
            <p className="text-sm text-neutral-500 text-center max-w-md">
              Add <code className="font-mono bg-neutral-900 px-1.5 py-0.5 rounded">NEXT_PUBLIC_MAPMYINDIA_MAP_SDK_KEY</code>{" "}
              in frontend <code className="font-mono bg-neutral-900 px-1.5 py-0.5 rounded">.env.local</code>.
            </p>
          </div>
        );

      case "no_coordinates":
        return (
          <div className="flex flex-col items-center justify-center py-24 text-neutral-500 gap-3">
            <MapPin className="w-10 h-10 text-neutral-700" />
            <p className="font-medium">No coordinate events available.</p>
            <p className="text-sm text-neutral-500 text-center max-w-md">
              {mapError || "Live Map requires latitude/longitude. Current stream has no coordinate events."}
            </p>
          </div>
        );

      case "error":
        return (
          <div className="flex flex-col items-center justify-center py-24 text-neutral-500 gap-3">
            <AlertCircle className="w-10 h-10 text-red-500" />
            <p className="font-medium text-red-400">Map endpoint failed.</p>
            <p className="text-sm text-neutral-500">{mapError || "Could not load map data."}</p>
          </div>
        );

      case "ready":
        return (
          <div className="flex-1 flex flex-col min-h-0">
            {/* Map placeholder — replace with actual MapMyIndia SDK when key is present */}
            <div className="flex-1 bg-neutral-950 rounded-lg border border-neutral-800 relative overflow-hidden">
              {mapSdkLoaded ? (
                <div id="mapmyindia-container" className="w-full h-full" />
              ) : (
                <div className="absolute inset-0 flex flex-col items-center justify-center text-neutral-500 p-8">
                  <MapPin className="w-12 h-12 text-neutral-700 mb-4" />
                  <p className="text-lg font-medium mb-2">{coordEvents.length} Coordinate Points</p>
                  <p className="text-sm text-neutral-600 text-center max-w-lg mb-6">
                    MapMyIndia SDK loading... Place <code className="font-mono bg-neutral-900 px-1.5 py-0.5 rounded">mapmyindia-gl</code>{" "}
                    in package.json to render the interactive map.
                  </p>
                  {/* Fallback: show coordinate list */}
                  <div className="w-full max-w-lg max-h-64 overflow-y-auto space-y-2">
                    {coordEvents.slice(-20).map((evt) => (
                      <div key={evt.event_id} className="flex items-center justify-between p-2 rounded bg-neutral-900 text-xs">
                        <span className="font-mono text-neutral-300">{evt.event_id}</span>
                        <span className="text-neutral-400">{evt.road_segment_id}</span>
                        <span className="text-neutral-500">{evt.zone}</span>
                        <span className={evt.severity >= 0.8 ? "text-red-400" : "text-neutral-400"}>
                          {evt.severity.toFixed(2)}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        );
    }
  };

  return (
    <div className="flex-1 flex flex-col min-h-0">
      {/* Header */}
      <div className="flex items-center justify-between mb-4 shrink-0">
        <h2 className="text-2xl font-bold text-white flex items-center gap-2">
          <MapPin className="w-6 h-6 text-orange-500" /> Live Map
        </h2>
        <div className="flex items-center gap-2">
          <Badge variant="outline" className="text-neutral-500 border-neutral-700">
            {coordEvents.length} points
          </Badge>
          <Badge variant="outline" className="text-neutral-500 border-neutral-700">
            Latest 100
          </Badge>
        </div>
      </div>

      <Card className="flex-1 flex flex-col bg-neutral-900 border-neutral-800 overflow-hidden min-h-0">
        {renderState()}
      </Card>
    </div>
  );
}
