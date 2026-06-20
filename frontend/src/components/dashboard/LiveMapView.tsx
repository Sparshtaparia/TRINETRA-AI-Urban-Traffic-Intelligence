"use client";

import { useState, useEffect, useRef } from "react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { MapPin, AlertCircle, Loader2 } from "lucide-react";
import { useLiveSession } from "@/lib/LiveSessionProvider";
import { API_BASE } from "../../lib/api";

type MapState =
  | "loading"
  | "loading_sdk"
  | "missing_key"
  | "sdk_failed"
  | "no_coordinates"
  | "ready"
  | "error";

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

export function LiveMapView({ isActive = true }: { isActive?: boolean }) {
  const { connected, paused } = useLiveSession();
  const [coordEvents, setCoordEvents] = useState<CoordEvent[]>([]);
  const [mapState, setMapState] = useState<MapState>("loading");
  const [mapError, setMapError] = useState<string | null>(null);
  const [mapSdkLoaded, setMapSdkLoaded] = useState(false);

  const mapRef = useRef<any>(null);
  const markersRef = useRef<any[]>([]);
  const isInitializing = useRef(false);

  // Handle map resize when tab becomes active
  useEffect(() => {
    if (isActive && mapRef.current) {
      setTimeout(() => {
        try {
          if (typeof mapRef.current.resize === 'function') {
            mapRef.current.resize();
          }
          window.dispatchEvent(new Event('resize'));
        } catch (e) {}
      }, 100);
    }
  }, [isActive]);

  // Check for MapMyIndia SDK key
  const mapSdkKey = process.env.NEXT_PUBLIC_MAPMYINDIA_MAP_SDK_KEY || null;

  useEffect(() => {
    if (!mapSdkKey) {
      setMapState("missing_key");
      return;
    }

    if (isInitializing.current) return;
    isInitializing.current = true;
    setMapState("loading_sdk");

    const initMap = () => {
      try {
        // @ts-ignore
        if (!window.mappls) {
          throw new Error("window.mappls is not available after SDK load");
        }

        if (mapRef.current) {
          setMapSdkLoaded(true);
          return;
        }

        // @ts-ignore
        const newMap = new window.mappls.Map("mapmyindia-container", {
          center: [12.9716, 77.5946],
          zoom: 11,
        });

        mapRef.current = newMap;
        setMapSdkLoaded(true);

        // Only mark ready if coordinate data already exists
        setMapState((prev) => {
          if (coordEvents.length > 0) return "ready";
          return prev === "loading_sdk" ? "no_coordinates" : prev;
        });
      } catch (err: any) {
        console.error("Mappls init failed:", err);
        setMapError(err?.message || "Mappls SDK initialized but map creation failed.");
        setMapState("sdk_failed");
        setMapSdkLoaded(false);
      }
    };

    // If SDK is already loaded
    // @ts-ignore
    if (window.mappls) {
      initMap();
      return;
    }

    const existingScript = document.getElementById("mappls-script") as HTMLScriptElement | null;

    if (existingScript) {
      existingScript.addEventListener("load", initMap);
      existingScript.addEventListener("error", () => {
        setMapError("Mappls SDK script failed to load.");
        setMapState("sdk_failed");
      });
      return;
    }

    const script = document.createElement("script");
    script.id = "mappls-script";
    script.src = `https://apis.mappls.com/advancedmaps/api/${mapSdkKey}/map_sdk?layer=vector&v=3.0`;
    script.async = true;
    script.defer = true;

    const timeout = window.setTimeout(() => {
      // @ts-ignore
      if (!window.mappls) {
        setMapError("Mappls SDK load timed out. Check key, enabled Web Maps SDK, CORS/domain, or network.");
        setMapState("sdk_failed");
        setMapSdkLoaded(false);
      }
    }, 10000);

    script.onload = () => {
      window.clearTimeout(timeout);

      // Sometimes SDK global appears slightly after onload
      setTimeout(initMap, 300);
    };

    script.onerror = () => {
      window.clearTimeout(timeout);
      setMapError("Mappls SDK script failed to load. Check SDK key and asset approval.");
      setMapState("sdk_failed");
      setMapSdkLoaded(false);
    };

    document.head.appendChild(script);

    return () => {
      window.clearTimeout(timeout);
    };
  }, [mapSdkKey]);

  // Fetch coordinate events
  useEffect(() => {
    if (!connected && !paused) return;

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
            setMapState(mapSdkLoaded ? "ready" : "loading_sdk");
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
  }, [connected, paused, mapSdkLoaded]);

  // Render markers
  useEffect(() => {
    if (!mapSdkLoaded || !mapRef.current) return;
    
    try {
      // Clear old markers
      markersRef.current.forEach(m => {
        if (m && typeof m.remove === 'function') m.remove();
      });
      markersRef.current = [];

      // Render new markers
      coordEvents.forEach(evt => {
        // @ts-ignore
        if (window.mappls && window.mappls.Marker) {
          // @ts-ignore
          const marker = new window.mappls.Marker({
            map: mapRef.current,
            position: { lat: evt.latitude, lng: evt.longitude },
            popupHtml: `<div style="padding: 4px; color: black; font-family: sans-serif;">
                          <strong>${evt.road_segment_id}</strong><br/>
                          Severity: <span style="color: red;">${evt.severity.toFixed(2)}</span><br/>
                          ${evt.zone}
                        </div>`
          });
          markersRef.current.push(marker);
        }
      });
    } catch (e) {
      console.error("Failed to render markers", e);
    }
  }, [coordEvents, mapSdkLoaded]);

  const renderOverlay = () => {
    switch (mapState) {
      case "loading":
        return (
          <div className="flex flex-col items-center justify-center py-24 text-neutral-500 gap-3">
            <Loader2 className="w-10 h-10 animate-spin text-neutral-700" />
            <p className="font-medium">Loading map data...</p>
          </div>
        );

      case "loading_sdk":
        return (
          <div className="flex flex-col items-center justify-center py-24 text-neutral-500 gap-3">
            <Loader2 className="w-10 h-10 animate-spin text-neutral-600" />
            <p className="font-medium">Initializing MapMyIndia SDK...</p>
            <p className="text-sm text-neutral-500 text-center max-w-md">
              Loading Mappls Web SDK. If this stays for more than 10 seconds, check SDK key, Web Maps SDK activation, and allowed domains.
            </p>
          </div>
        );

      case "sdk_failed":
        return (
          <div className="flex flex-col items-center justify-center py-24 text-neutral-500 gap-3">
            <AlertCircle className="w-10 h-10 text-red-500" />
            <p className="font-medium text-red-400">MapMyIndia SDK failed.</p>
            <p className="text-sm text-neutral-500 text-center max-w-md">
              {mapError || "Could not initialize Mappls SDK."}
            </p>
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
        return null;
    }
  };

  return (
    <div className="flex-1 flex flex-col min-h-0">
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

      <Card className="flex-1 flex flex-col bg-neutral-900 border-neutral-800 overflow-hidden min-h-0 p-1 relative">
        {/* Map Container is always in the DOM so Mappls SDK can attach to it on mount */}
        <div 
          id="mapmyindia-container" 
          className="w-full h-full absolute inset-0 z-0" 
          style={{ opacity: mapState === "ready" && mapSdkLoaded ? 1 : 0 }}
        />

        {/* Overlay covers the map until ready */}
        {(mapState !== "ready" || !mapSdkLoaded) && (
          <div className="absolute inset-0 z-10 bg-neutral-900 flex flex-col items-center justify-center">
            {renderOverlay()}
          </div>
        )}
      </Card>
    </div>
  );
}
