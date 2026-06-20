"use client";

import { useRef, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Activity, AlertTriangle, Radio, Truck, Square, Zap, Pause, Play } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useLiveSession } from "@/lib/LiveSessionProvider";

function NewEventDot() {
  return <span className="inline-block w-1.5 h-1.5 rounded-full bg-[#39FF14] animate-pulse ml-1.5" />;
}

export function LiveCommandCenterTab() {
  const { snapshot, connected, paused, loading, stopStream, pauseStream, resumeStream } = useLiveSession();
  const prevCountRef = useRef(0);
  const newCountRef = useRef(0);

  const statusLabel = snapshot?.label || "DISCONNECTED";
  const events = snapshot?.events || [];
  const analytics = snapshot?.analytics;
  const isWarning = snapshot?.message?.includes("no new rows") || false;

  const totalReceived = snapshot?.events_received ?? 0;
  const newEventsThisTick = snapshot?.new_events_count ?? 0;

  useEffect(() => {
    if (totalReceived > prevCountRef.current) {
      newCountRef.current = totalReceived - prevCountRef.current;
    } else if (totalReceived < prevCountRef.current) {
      newCountRef.current = totalReceived;
    }
    prevCountRef.current = totalReceived;
  }, [totalReceived]);

  const metrics = {
    activeEvents: analytics?.active_events_last_5_min ?? 0,
    eventsPerSec: analytics?.events_per_second ?? 0,
    criticalAlerts: analytics?.critical_alerts ?? 0,
    highestDelta: analytics?.highest_picq_delta ?? 0,
    dispatchSegment: analytics?.recommended_dispatch_segment ?? "Awaiting Events..."
  };

  return (
    <div className="flex-1 flex flex-col min-h-0 gap-6">

      {/* Header Row */}
      <div className="flex justify-between items-center shrink-0">
        <h2 className="text-2xl font-bold text-white flex items-center gap-2">
          <Activity className="w-6 h-6 text-[#39FF14]" /> Live Operations Command Center
          {connected && !paused && <NewEventDot />}
        </h2>
        <div className="flex items-center gap-3">
          {newEventsThisTick > 0 && (
            <Badge className="bg-[#39FF14]/15 text-[#39FF14] border border-[#39FF14]/30 text-xs animate-pulse">
              <Zap className="w-3 h-3 mr-1" /> {newEventsThisTick} new
            </Badge>
          )}
          {connected && (
            <div className="flex items-center gap-2">
              {paused ? (
                <Button variant="outline" size="sm" onClick={resumeStream} className="bg-blue-500/10 text-blue-400 hover:bg-blue-500/20 border-blue-500/30 shrink-0">
                  <Play className="w-4 h-4 mr-2" /> Resume
                </Button>
              ) : (
                <Button variant="outline" size="sm" onClick={pauseStream} className="bg-yellow-500/10 text-yellow-500 hover:bg-yellow-500/20 border-yellow-500/30 shrink-0">
                  <Pause className="w-4 h-4 mr-2" /> Pause
                </Button>
              )}
              <Button variant="destructive" size="sm" onClick={stopStream} className="bg-red-500/20 text-red-500 hover:bg-red-500/30 border border-red-500/50 shrink-0">
                <Square className="w-4 h-4 mr-2" /> Stop Stream
              </Button>
            </div>
          )}
        </div>
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 shrink-0">
        <Card className={`bg-neutral-900 border-neutral-800 ${connected ? "ring-1 ring-[#39FF14]/10" : ""}`}>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-neutral-400">Connection Status</CardTitle>
            <Radio className={`h-4 w-4 ${connected ? (isWarning ? "text-yellow-500" : "text-[#39FF14] animate-pulse") : "text-neutral-600"}`} />
          </CardHeader>
          <CardContent>
            <div className={`text-sm font-bold ${connected ? (isWarning ? "text-yellow-400" : "text-[#39FF14]") : "text-neutral-600"}`}>
              {statusLabel}
            </div>
            {snapshot?.session_id && (
              <div className="text-[10px] text-neutral-600 font-mono mt-1 truncate">
                Session: {snapshot.session_id.slice(0, 8)}...
              </div>
            )}
          </CardContent>
        </Card>

        <Card className={`bg-neutral-900 border-neutral-800 ${newEventsThisTick > 0 ? "ring-1 ring-blue-500/30" : ""}`}>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-neutral-400">Active Events</CardTitle>
            <Activity className={`h-4 w-4 text-blue-500 ${newEventsThisTick > 0 ? "animate-pulse" : ""}`} />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-white">{metrics.activeEvents}</div>
            <p className="text-xs text-neutral-500 mt-1">
              <span className={newEventsThisTick > 0 ? "text-[#39FF14]" : ""}>
                {metrics.eventsPerSec.toFixed(1)}
              </span> events/sec &middot; {totalReceived} total
            </p>
          </CardContent>
        </Card>

        <Card className="bg-neutral-900 border-neutral-800">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-neutral-400">Critical Alerts</CardTitle>
            <AlertTriangle className="h-4 w-4 text-red-500" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-red-400">{metrics.criticalAlerts}</div>
            <p className="text-xs text-neutral-500 mt-1">PICQ &gt; 15 or Severity &ge; 0.8</p>
          </CardContent>
        </Card>

        <Card className="bg-neutral-900 border-neutral-800">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-neutral-400">Recommended Dispatch</CardTitle>
            <Truck className="h-4 w-4 text-orange-500" />
          </CardHeader>
          <CardContent>
            <div className="text-xl font-bold text-orange-400 break-all">
              {metrics.dispatchSegment}
            </div>
            <p className="text-xs text-neutral-500 mt-1">Highest Live Priority</p>
          </CardContent>
        </Card>
      </div>

      {/* Incident Stream */}
      <Card className="flex-1 flex flex-col bg-neutral-900 border-neutral-800 overflow-hidden min-h-0 relative">
        {connected && (
          <div className="absolute inset-0 pointer-events-none opacity-[0.03]"
            style={{
              backgroundImage: `repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(57, 255, 20, 0.15) 2px, rgba(57, 255, 20, 0.15) 4px)`,
              backgroundSize: '100% 4px',
            }}
          />
        )}
        <div className="p-4 border-b border-neutral-800 flex justify-between items-center bg-neutral-950 shrink-0 relative z-10">
          <h3 className="font-semibold text-white flex items-center gap-2">
            <Activity className={`w-4 h-4 text-[#39FF14] ${connected ? "animate-pulse" : ""}`} /> Live Incident Stream
            {connected && <NewEventDot />}
          </h3>
          <div className="flex items-center gap-3">
            <Badge variant="outline" className="text-neutral-500 border-neutral-700">
              Showing {events.length} / {totalReceived} events
            </Badge>
            <Badge variant="outline" className="text-neutral-500 border-neutral-700">
              Window: last {snapshot?.analytics_window_size ?? 500}
            </Badge>
          </div>
        </div>
        <div className="flex-1 overflow-y-auto min-h-0">
          <div className="p-4 space-y-3">
            {loading && events.length === 0 ? (
              <div className="text-neutral-500 text-center py-8 font-mono text-sm">
                Connecting to live stream...
              </div>
            ) : events.length === 0 ? (
              <div className="text-neutral-500 text-center py-8 font-mono text-sm">
                {snapshot?.status === "connected"
                  ? "Awaiting events from the stream..."
                  : "No active live stream. Head to Setup to start a CSV replay."}
              </div>
            ) : (
              [...events].reverse().map((evt, idx) => (
                <div
                  key={evt.event_id || idx}
                  className={`flex items-center justify-between p-3 rounded-lg border border-neutral-800 bg-neutral-950/50 hover:bg-neutral-800/50 transition-all ${
                    idx < newEventsThisTick ? "animate-[fadeIn_0.4s_ease-out] border-[#39FF14]/20 bg-[#39FF14]/[0.02]" : ""
                  }`}
                >
                  <div className="flex items-center gap-4">
                    <div className="text-neutral-500 font-mono text-xs w-16 shrink-0">
                      {new Date(evt.timestamp).toLocaleTimeString([], { hour12: false })}
                    </div>
                    <Badge variant="outline" className="font-mono bg-neutral-900 border-neutral-700 w-24 text-center shrink-0">
                      {evt.event_id}
                    </Badge>
                    <div className="font-medium text-white w-24 truncate">{evt.segment_id || evt.road_segment_id}</div>
                    <Badge variant="secondary" className={`w-28 text-center shrink-0 ${
                      evt.severity >= 0.8 ? "bg-red-500/10 text-red-400" :
                      evt.severity >= 0.5 ? "bg-yellow-500/10 text-yellow-400" :
                      "bg-blue-500/10 text-blue-400"
                    }`}>
                      Severity: {evt.severity?.toFixed(2) || "0.00"}
                    </Badge>
                  </div>
                  <div className="flex items-center gap-6 shrink-0">
                    <div className="text-sm">
                      <span className="text-neutral-500 mr-2">PICQ</span>
                      <span className={`font-bold ${evt.picq_delta >= 15 ? 'text-red-400' : 'text-[#39FF14]'}`}>
                        +{evt.picq_delta}
                      </span>
                    </div>
                    <div className="text-sm font-medium w-32 text-right">
                      <span className={evt.severity >= 0.8 ? "text-orange-400" : "text-neutral-400"}>
                        {evt.recommended_action || (evt.severity >= 0.8 ? "Dispatch Tow" : "Monitor")}
                      </span>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </Card>

    </div>
  );
}
