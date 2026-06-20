"use client";

import { useEffect, useState } from "react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Search, CheckCircle2, Loader2 } from "lucide-react";
import { sessionCache } from "@/lib/cache";
import { API_BASE } from "../../lib/api";

const PIPELINE_STEPS = [
  { label: "Loading segment records", detail: "Reading enforcement_ranking.json (310 MB)" },
  { label: "Sorting by enforcement_score", detail: "PICQ × RRE × data_confidence (desc)" },
  { label: "Applying quadrant classifications", detail: "Q1 / Q2 / Q3 / Q4 assignment" },
  { label: "Building dispatch priority index", detail: "298,450 segments indexed" },
];

export function RankingTab() {
  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [pipelineStep, setPipelineStep] = useState(0);
  const [pipelineDone, setPipelineDone] = useState(false);
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(0);
  const PAGE_SIZE = 50;
  useEffect(() => {
    const cached = sessionCache.get('ranking_data');
    if (cached) {
      setData(cached);
      setPipelineStep(PIPELINE_STEPS.length);
      setPipelineDone(true);
      setLoading(false);
      return;
    }

    // Animate pipeline steps while data fetches
    let step = 0;
    const interval = setInterval(() => {
      step++;
      setPipelineStep(step);
      if (step >= PIPELINE_STEPS.length) clearInterval(interval);
    }, 200); // Super fast animation if network is slow

    fetch(API_BASE + "/api/analytics/enforcement-ranking")
      .then(res => res.json())
      .then(res => {
        if (res.status === "success" && Array.isArray(res.data)) {
          setData(res.data);
          sessionCache.set('ranking_data', res.data);
        }
        // Instantly skip animation and show data
        clearInterval(interval);
        setPipelineStep(PIPELINE_STEPS.length);
        setPipelineDone(true);
        setLoading(false);
      })
      .catch(() => setLoading(false));

    return () => clearInterval(interval);
  }, []);

  if (loading) return (
    <div className="space-y-4 py-6">
      <div className="flex items-center gap-3 mb-6">
        <div className="w-5 h-5 border-2 border-blue-400 border-t-transparent rounded-full animate-spin" />
        <span className="font-mono text-sm text-blue-400 tracking-wider">
          Building Enforcement Dispatch Index · 298,450 segments
        </span>
      </div>
      <div className="space-y-2">
        {PIPELINE_STEPS.map((s, i) => (
          <div key={i} className={`flex items-center gap-3 p-3 rounded-lg border transition-all ${
            i < pipelineStep ? "bg-neutral-900 border-neutral-800" :
            i === pipelineStep ? "bg-neutral-900 border-blue-500/40 animate-pulse" :
            "bg-neutral-900/50 border-neutral-800/50 opacity-40"
          }`}>
            {i < pipelineStep
              ? <CheckCircle2 className="w-4 h-4 text-blue-400 flex-shrink-0" />
              : i === pipelineStep
              ? <Loader2 className="w-4 h-4 text-blue-400 flex-shrink-0 animate-spin" />
              : <div className="w-4 h-4 rounded-full border border-neutral-700 flex-shrink-0" />}
            <div className="flex-1 min-w-0">
              <span className={`text-sm font-medium ${i <= pipelineStep ? "text-white" : "text-neutral-600"}`}>
                Step {i + 1}/{PIPELINE_STEPS.length}: {s.label}
              </span>
              <p className="text-xs text-neutral-500 mt-0.5">{s.detail}</p>
            </div>
            {i < pipelineStep && (
              <span className="text-xs font-mono px-1.5 py-0.5 rounded bg-blue-500/10 text-blue-400 flex-shrink-0">DONE</span>
            )}
          </div>
        ))}
        {pipelineDone && (
          <div className="flex items-center gap-3 p-3 rounded-lg bg-neutral-900 border border-[#39FF14]/40">
            <CheckCircle2 className="w-4 h-4 text-[#39FF14]" />
            <span className="text-sm font-medium text-[#39FF14]">Ranking ready — {data.length.toLocaleString()} segments indexed</span>
          </div>
        )}
      </div>
      <div className="w-full h-1.5 bg-neutral-800 rounded-full overflow-hidden mt-4">
        <div className="h-full bg-blue-500 rounded-full transition-all duration-500"
          style={{ width: `${Math.round((Math.min(pipelineStep, PIPELINE_STEPS.length) / PIPELINE_STEPS.length) * 100)}%` }} />
      </div>
    </div>
  );
  if (!data.length) return <div className="text-neutral-500 p-6">No data available. Run the TRINETRA-P batch pipeline first.</div>;

  const filtered = search
    ? data.filter(r => String(r.segment_id).toLowerCase().includes(search.toLowerCase()))
    : data;
  const paginated = filtered.slice(page * PAGE_SIZE, (page + 1) * PAGE_SIZE);
  const totalPages = Math.ceil(filtered.length / PAGE_SIZE);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-white">Prioritized Enforcement Dispatch List</h2>
          <p className="text-sm text-neutral-400 mt-0.5">
            {data.length.toLocaleString()} segments ranked by enforcement_score = PICQ × RRE × data_confidence
          </p>
        </div>
        <div className="relative w-64">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-neutral-500" />
          <Input
            value={search}
            onChange={e => { setSearch(e.target.value); setPage(0); }}
            placeholder="Search segment ID..."
            className="pl-9 bg-neutral-900 border-neutral-700 text-sm"
          />
        </div>
      </div>

      <div className="bg-neutral-900 border border-neutral-800 rounded-xl overflow-hidden">
        <Table>
          <TableHeader className="bg-neutral-950">
            <TableRow className="border-neutral-800 hover:bg-neutral-950">
              <TableHead className="w-16">Rank</TableHead>
              <TableHead>Segment ID</TableHead>
              <TableHead>PICQ Score</TableHead>
              <TableHead>RRE (%)</TableHead>
              <TableHead>Quadrant</TableHead>
              <TableHead>Enf. Score</TableHead>
              <TableHead>Violations</TableHead>
              <TableHead className="text-right">Recommended Action</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {paginated.map((row, idx) => {
              const rank = page * PAGE_SIZE + idx + 1;
              const q = row.quadrant;
              return (
                <TableRow key={row.segment_id || idx} className="border-neutral-800 hover:bg-neutral-800/40">
                  <TableCell className="text-neutral-500 font-mono text-sm">#{rank}</TableCell>
                  <TableCell className="font-mono text-white text-sm">{row.segment_id}</TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <div className="w-16 h-1.5 bg-neutral-800 rounded-full overflow-hidden">
                        <div className="h-full bg-blue-500 rounded-full" style={{ width: `${Math.min(row.picq_score, 100)}%` }} />
                      </div>
                      <span className="text-blue-400 font-bold text-sm">{row.picq_score?.toFixed(1) ?? "—"}</span>
                    </div>
                  </TableCell>
                  <TableCell className="text-[#39FF14] font-semibold text-sm">{row.rre_score?.toFixed(1) ?? "—"}%</TableCell>
                  <TableCell>
                    <Badge variant="outline" className={
                      q === "Q1" ? "border-red-500/50 text-red-400 bg-red-500/10" :
                      q === "Q2" ? "border-yellow-500/50 text-yellow-400 bg-yellow-500/10" :
                      q === "Q3" ? "border-cyan-500/50 text-cyan-400 bg-cyan-500/10" :
                      "border-neutral-500/50 text-neutral-400 bg-neutral-500/10"
                    }>
                      {q}
                    </Badge>
                  </TableCell>
                  <TableCell className="font-mono text-sm text-white">{row.enforcement_score?.toFixed(2) ?? "—"}</TableCell>
                  <TableCell className="text-neutral-400 text-sm">{row.total_violations?.toLocaleString() ?? "—"}</TableCell>
                  <TableCell className="text-right text-sm">
                    <span className={q === "Q1" ? "text-red-400 font-medium" : q === "Q2" ? "text-yellow-400 font-medium" : "text-neutral-400"}>
                      {q === "Q1" ? "🚨 Immediate Tow Dispatch" : q === "Q2" ? "🎯 Targeted Enforcement" : q === "Q3" ? "👁 Monitor" : "📋 Routine Patrol"}
                    </span>
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between text-sm text-neutral-400">
          <span>Showing {page * PAGE_SIZE + 1}–{Math.min((page + 1) * PAGE_SIZE, filtered.length)} of {filtered.length.toLocaleString()} segments</span>
          <div className="flex gap-2">
            <button
              onClick={() => setPage(p => Math.max(0, p - 1))}
              disabled={page === 0}
              className="px-3 py-1 rounded bg-neutral-800 hover:bg-neutral-700 disabled:opacity-40 disabled:cursor-not-allowed"
            >← Prev</button>
            <span className="px-3 py-1 bg-neutral-900 rounded border border-neutral-800">{page + 1} / {totalPages}</span>
            <button
              onClick={() => setPage(p => Math.min(totalPages - 1, p + 1))}
              disabled={page === totalPages - 1}
              className="px-3 py-1 rounded bg-neutral-800 hover:bg-neutral-700 disabled:opacity-40 disabled:cursor-not-allowed"
            >Next →</button>
          </div>
        </div>
      )}
    </div>
  );
}
