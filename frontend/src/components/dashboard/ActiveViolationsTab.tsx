"use client";

import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { useLiveSession } from "@/lib/LiveSessionProvider";

export function ActiveViolationsTab() {
  const { snapshot, connected, loading } = useLiveSession();

  const events = snapshot?.events || [];

  const agg = new Map<string, { segment_id: string; count: number; severity: number; last_event: string; zone: string; picq_delta: number }>();
  events.forEach((evt: any) => {
    const seg = evt.segment_id || evt.road_segment_id;
    if (!seg) return;
    if (agg.has(seg)) {
      const existing = agg.get(seg)!;
      existing.count += 1;
      existing.severity = Math.max(existing.severity, evt.severity || 0);
      existing.picq_delta = Math.max(existing.picq_delta, evt.picq_delta || 0);
      const evtTime = new Date(evt.timestamp).getTime();
      const existingTime = new Date(existing.last_event).getTime();
      if (evtTime > existingTime) {
        existing.last_event = evt.timestamp;
      }
    } else {
      agg.set(seg, {
        segment_id: seg,
        count: 1,
        severity: evt.severity || 0,
        picq_delta: evt.picq_delta || 0,
        last_event: evt.timestamp,
        zone: evt.zone || "unknown"
      });
    }
  });

  const violations = Array.from(agg.values()).sort((a, b) => b.severity - a.severity);

  return (
    <div className="flex-1 flex flex-col bg-neutral-900 border border-neutral-800 rounded-lg overflow-hidden min-h-0">
      <div className="p-6 border-b border-neutral-800 flex justify-between items-center shrink-0">
        <div>
          <h3 className="text-lg font-semibold text-white">Active Segment Violations</h3>
          <p className="text-sm text-neutral-400">
            Aggregated from latest {events.length} events in memory.
          </p>
        </div>
        <Badge variant="outline" className="text-orange-400 border-orange-500/30 shrink-0">
          {connected ? "LIVE" : "Disconnected"}
        </Badge>
      </div>
      
      {loading && violations.length === 0 ? (
        <div className="flex-1 flex items-center justify-center text-neutral-500">
          Connecting to live stream...
        </div>
      ) : violations.length === 0 ? (
        <div className="flex-1 flex items-center justify-center text-neutral-500">
          {connected
            ? "Awaiting events from the live stream..."
            : "No active live stream. Start a source from setup."}
        </div>
      ) : (
        <div className="flex-1 overflow-y-auto min-h-0">
          <Table>
            <TableHeader className="bg-neutral-950 sticky top-0">
              <TableRow className="border-neutral-800 hover:bg-neutral-950">
                <TableHead>Segment ID</TableHead>
                <TableHead>Zone</TableHead>
                <TableHead>Violation Count</TableHead>
                <TableHead>Max Severity</TableHead>
                <TableHead>Max PICQ</TableHead>
                <TableHead>Last Updated</TableHead>
                <TableHead className="text-right">Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {violations.map((row) => (
                <TableRow key={row.segment_id} className="border-neutral-800 hover:bg-neutral-800/50">
                  <TableCell className="font-mono text-white font-medium">{row.segment_id}</TableCell>
                  <TableCell className="text-neutral-400 text-sm">{row.zone}</TableCell>
                  <TableCell className="text-neutral-300">{row.count} active</TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <div className="w-24 h-2 bg-neutral-800 rounded-full overflow-hidden">
                        <div 
                          className={`h-full ${row.severity > 0.8 ? 'bg-red-500' : row.severity > 0.5 ? 'bg-yellow-500' : 'bg-blue-500'}`} 
                          style={{ width: `${Math.min(row.severity * 100, 100)}%` }}
                        />
                      </div>
                      <span className="text-xs text-neutral-400">{row.severity.toFixed(2)}</span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <span className={`font-mono text-xs ${row.picq_delta >= 15 ? 'text-red-400' : 'text-[#39FF14]'}`}>
                      +{row.picq_delta.toFixed(1)}
                    </span>
                  </TableCell>
                  <TableCell className="text-neutral-400 text-sm">
                    {new Date(row.last_event).toLocaleTimeString()}
                  </TableCell>
                  <TableCell className="text-right">
                    <Badge variant="secondary" className={`${
                      row.severity > 0.8 ? "bg-red-500/10 text-red-400 border border-red-500/20" :
                      row.severity > 0.5 ? "bg-yellow-500/10 text-yellow-400 border border-yellow-500/20" :
                      "bg-blue-500/10 text-blue-400 border border-blue-500/20"
                    }`}>
                      {row.severity > 0.8 ? "Critical" : row.severity > 0.5 ? "Warning" : "Monitoring"}
                    </Badge>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  );
}
