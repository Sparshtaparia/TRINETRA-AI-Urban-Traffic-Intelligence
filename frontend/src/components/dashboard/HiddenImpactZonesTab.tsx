"use client";

import { useEffect, useState } from "react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { sessionCache } from "@/lib/cache";
import { API_BASE } from "../../lib/api";

export function HiddenImpactZonesTab() {
  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const cached = sessionCache.get('hidden_zones_data');
    if (cached) {
      setData(cached);
      setLoading(false);
      return;
    }

    fetch(API_BASE + "/api/analytics/hidden-impact-zones")
      .then(res => res.json())
      .then(res => {
        if (res.status === "success") {
          setData(res.data);
          sessionCache.set('hidden_zones_data', res.data);
        }
        setLoading(false);
      })
      .catch((err) => {
        console.error(err);
        setLoading(false);
      });
  }, []);

  if (loading) return <div className="text-neutral-500 animate-pulse">Loading hidden impact zones...</div>;
  if (!data.length) return <div className="text-neutral-500">No Q2 zones detected in this dataset.</div>;

  return (
    <div className="bg-neutral-900 border border-neutral-800 rounded-lg overflow-hidden">
      <div className="p-6 border-b border-neutral-800 flex justify-between items-start">
        <div>
          <h3 className="text-lg font-semibold text-white">Q2: Hidden Impact Zones</h3>
          <p className="text-sm text-neutral-400">Segments with low/medium violation count but high congestion impact (missed by standard heatmaps).</p>
        </div>
      </div>
      
      {/* Mathematical Analysis Graph */}
      <div className="p-6 border-b border-neutral-800 bg-neutral-950 flex justify-center">
        <img 
          src={"/figures/14_top_hidden_impact_zones.png"} 
          alt="Hidden Impact Zones Mathematical Analysis" 
          className="max-h-[400px] object-contain rounded border border-neutral-800 shadow-xl"
        />
      </div>
      <Table>
        <TableHeader className="bg-neutral-950">
          <TableRow className="border-neutral-800 hover:bg-neutral-950">
            <TableHead>Segment ID</TableHead>
            <TableHead>PICQ</TableHead>
            <TableHead>RRE (%)</TableHead>
            <TableHead>Violations</TableHead>
            <TableHead>Confidence</TableHead>
            <TableHead className="text-right">Rec. Action</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {data.map((row, idx) => (
            <TableRow key={row.segment_id || idx} className="border-neutral-800 hover:bg-neutral-800/50">
              <TableCell className="font-mono text-white">{row.segment_id}</TableCell>
              <TableCell className="font-bold text-yellow-400">{row.picq_score?.toFixed(1) || "-"}</TableCell>
              <TableCell className="text-[#39FF14]">{row.rre_score?.toFixed(1) || "-"}%</TableCell>
              <TableCell className="text-neutral-400">{row.violations || "-"}</TableCell>
              <TableCell>
                <Badge variant="outline" className="border-blue-500/50 text-blue-400 bg-blue-500/10">High</Badge>
              </TableCell>
              <TableCell className="text-right text-sm">Targeted Tow Dispatch</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
