"use client";

import { useState, useEffect, useRef } from "react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { MapPin, AlertCircle, Loader2 } from "lucide-react";
import { API_BASE } from "../../lib/api";

type MapState =
  | "loading"
  | "loading_sdk"
  | "missing_key"
  | "sdk_failed"
  | "no_coordinates"
  | "ready"
  | "error";

interface SegmentEvent {
  segment_id: string;
  zone: string;
  avg_latitude: number;
  avg_longitude: number;
  rre_score: number;
  picq_score: number;
  recommended_action: string;
}

export function StaticMapView() {
  const [mapState, setMapState] = useState<MapState>("loading");
  const [mapError, setMapError] = useState<string | null>(null);
  const [segments, setSegments] = useState<SegmentEvent[]>([]);
  const [mapSdkLoaded, setMapSdkLoaded] = useState(false);

  const mapRef = useRef<any>(null);
  const markersRef = useRef<any[]>([]);
  const isInitializing = useRef(false);

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
        const newMap = new window.mappls.Map("static-mapmyindia-container", {
          center: [12.9716, 77.5946],
          zoom: 11,
        });

        mapRef.current = newMap;
        setMapSdkLoaded(true);

        setMapState((prev) => {
          if (segments.length > 0) return "ready";
          return prev === "loading_sdk" ? "no_coordinates" : prev;
        });
      } catch (err: any) {
        console.error("Mappls init failed:", err);
        setMapError(err?.message || "Mappls SDK initialized but map creation failed.");
        setMapState("sdk_failed");
        setMapSdkLoaded(false);
      }
    };

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
        setMapError("Mappls SDK load timed out.");
        setMapState("sdk_failed");
        setMapSdkLoaded(false);
      }
    }, 10000);

    script.onload = () => {
      window.clearTimeout(timeout);
      setTimeout(initMap, 300);
    };

    script.onerror = () => {
      window.clearTimeout(timeout);
      setMapError("Mappls SDK script failed to load.");
      setMapState("sdk_failed");
      setMapSdkLoaded(false);
    };

    document.head.appendChild(script);

    return () => {
      window.clearTimeout(timeout);
    };
  }, [mapSdkKey, segments]);

  useEffect(() => {
    const fetchMapEvents = async () => {
      try {
        const res = await fetch(`${API_BASE}/api/analytics/map-segments`);
        const data = await res.json();
        if (data.status === "success") {
          let valid = (data.data || []).filter(
            (e: any) => e.avg_latitude && e.avg_longitude && e.avg_latitude !== 0 && e.avg_longitude !== 0
          );
          
          // Sort by rre score to show highest priority first
          valid.sort((a: any, b: any) => b.rre_score - a.rre_score);
          
          // Limit to top 500 segments to avoid crashing the map
          valid = valid.slice(0, 500);

          setSegments(valid);
          if (valid.length === 0) {
            setMapState("no_coordinates");
          } else {
            setMapState(mapSdkLoaded ? "ready" : "loading_sdk");
          }
          setMapError(null);
        } else {
          setMapState("no_coordinates");
          setMapError(data.error || null);
        }
      } catch (err) {
        setMapState("error");
        setMapError("Failed to fetch map events from backend.");
      }
    };

    fetchMapEvents();
  }, [mapSdkLoaded]);

  useEffect(() => {
    if (!mapSdkLoaded || !mapRef.current) return;
    
    try {
      markersRef.current.forEach(m => {
        if (m && typeof m.remove === 'function') m.remove();
      });
      markersRef.current = [];

      segments.forEach(evt => {
        // @ts-ignore
        if (window.mappls && window.mappls.Marker) {
          // @ts-ignore
          const marker = new window.mappls.Marker({
            map: mapRef.current,
            position: { lat: evt.avg_latitude, lng: evt.avg_longitude },
            popupHtml: `<div style="padding: 4px; color: black; font-family: sans-serif;">
                          <strong>${evt.segment_id}</strong><br/>
                          RRE: <span style="color: red;">${evt.rre_score.toFixed(2)}</span><br/>
                          ${evt.zone}
                        </div>`,
          });
          markersRef.current.push(marker);
        }
      });
    } catch (err) {
      console.error("Marker render error:", err);
    }
  }, [segments, mapSdkLoaded]);

  return (
    <Card className="flex flex-col h-full bg-neutral-900 border-neutral-800 rounded-xl overflow-hidden relative">
      <div className="absolute top-4 left-4 z-20 flex items-center gap-3">
        <Badge className="bg-blue-500/20 text-blue-400 border border-blue-500/30 flex items-center gap-1.5 px-3 py-1 shadow-lg backdrop-blur-md">
          <MapPin className="w-3.5 h-3.5" /> Static Map (Top 500 High RRE Segments)
        </Badge>
        {mapState === "ready" && (
          <Badge variant="outline" className="bg-neutral-900/80 border-neutral-700 text-neutral-300 backdrop-blur-md">
            Showing {segments.length} priority points
          </Badge>
        )}
      </div>

      <div className="flex-1 w-full relative bg-neutral-950 min-h-[500px]">
        <div id="static-mapmyindia-container" className="w-full h-full min-h-[500px]" style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 }} />
        
        {mapState !== "ready" && (
          <div className="absolute inset-0 z-10 flex flex-col items-center justify-center bg-neutral-950/80 backdrop-blur-sm border border-neutral-800 rounded-xl m-2">
            {mapState === "loading" && (
              <>
                <Loader2 className="w-8 h-8 text-neutral-500 animate-spin mb-4" />
                <p className="text-neutral-400 font-medium">Fetching Map Segments...</p>
              </>
            )}
            
            {mapState === "loading_sdk" && (
              <>
                <Loader2 className="w-8 h-8 text-neutral-500 animate-spin mb-4" />
                <p className="text-neutral-400 font-medium">Initializing MapMyIndia SDK...</p>
              </>
            )}

            {mapState === "missing_key" && (
              <>
                <AlertCircle className="w-10 h-10 text-red-500 mb-4" />
                <h3 className="text-red-400 font-bold text-lg mb-2">Map SDK Key Missing</h3>
                <p className="text-neutral-400 max-w-sm text-center text-sm">
                  Add <code>NEXT_PUBLIC_MAPMYINDIA_MAP_SDK_KEY</code> to your .env.local to view the map.
                </p>
              </>
            )}

            {mapState === "sdk_failed" && (
              <>
                <AlertCircle className="w-10 h-10 text-red-500 mb-4" />
                <h3 className="text-red-400 font-bold text-lg mb-2">SDK Load Error</h3>
                <p className="text-neutral-400 max-w-md text-center text-sm">{mapError}</p>
              </>
            )}

            {mapState === "no_coordinates" && (
              <>
                <AlertCircle className="w-10 h-10 text-yellow-500 mb-4" />
                <h3 className="text-yellow-400 font-bold text-lg mb-2">No Map Data Available</h3>
                <p className="text-neutral-400 max-w-sm text-center text-sm">
                  Run the analytics pipeline to generate coordinate map points.
                </p>
              </>
            )}
          </div>
        )}
      </div>
    </Card>
  );
}
