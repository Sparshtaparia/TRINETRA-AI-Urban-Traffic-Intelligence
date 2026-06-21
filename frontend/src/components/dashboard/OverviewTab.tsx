"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useEffect, useState } from "react";
import {
  Activity, AlertTriangle, CheckCircle2, EyeOff, LayoutGrid, Loader2,
  BrainCircuit, Zap, ShieldAlert, TrendingUp, AlertCircle, Lightbulb, Sparkles
} from "lucide-react";
import { sessionCache } from "@/lib/cache";
import { API_BASE } from "../../lib/api";

interface PipelineStep {
  index: number; total: number; step: string; status: string;
  input_rows: number; output_rows: number; notes: string; time_seconds: number;
}
interface PipelineStatus {
  cleaning_steps: PipelineStep[]; cleaning_complete: boolean;
  model_ready: boolean; full_pipeline_done: boolean;
  total_rows: number; total_cleaning_steps: number;
}
interface AiAnalysis {
  executive_summary: string;
  key_findings: { title: string; detail: string; impact: "high" | "medium" | "low" }[];
  quick_wins: string[];
  risk_flags: string[];
  policy_recommendation: string;
  data_confidence: string;
}

const IMPACT_STYLES = {
  high:   "border-red-500/40 bg-red-500/5 text-red-400",
  medium: "border-yellow-500/40 bg-yellow-500/5 text-yellow-400",
  low:    "border-blue-500/40 bg-blue-500/5 text-blue-400",
};

export function OverviewTab() {
  const [data, setData] = useState<any>(null);
  const [pipelineStatus, setPipelineStatus] = useState<PipelineStatus | null>(null);
  const [visibleStepIndex, setVisibleStepIndex] = useState(0);
  const [isAnimating, setIsAnimating] = useState(true);
  const [aiAnalysis, setAiAnalysis] = useState<AiAnalysis | null>(null);
  const [aiLoading, setAiLoading] = useState(false);
  const [aiError, setAiError] = useState<string | null>(null);

  useEffect(() => {
    fetch(API_BASE + "/api/analytics/pipeline-status")
      .then(res => res.json())
      .then(res => {
        if (res.status === "success") { setPipelineStatus(res); setVisibleStepIndex(0); }
      })
      .catch(() => setIsAnimating(false));

    // If we've already loaded it in memory, skip
    const cachedData = sessionCache.get('overview_data');
    if (cachedData) {
      setData(cachedData);
      setIsAnimating(false);
    } else {
      fetch(API_BASE + "/api/analytics/summary")
        .then(res => res.json())
        .then(res => { 
          if (res.status === "success") {
            setData(res.data);
            sessionCache.set('overview_data', res.data);
          }
        })
        .catch(console.error);
    }

    const fallback = setTimeout(() => setIsAnimating(false), 8000);
    return () => clearTimeout(fallback);
  }, []);

  // Animate pipeline steps
  useEffect(() => {
    if (!pipelineStatus || !isAnimating) return;
    const steps = pipelineStatus.cleaning_steps;
    if (steps.length === 0) { setIsAnimating(false); return; }
    if (visibleStepIndex < steps.length) {
      const t = setTimeout(() => setVisibleStepIndex(i => i + 1), 300);
      return () => clearTimeout(t);
    } else {
      const t = setTimeout(() => setIsAnimating(false), 700);
      return () => clearTimeout(t);
    }
  }, [pipelineStatus, visibleStepIndex, isAnimating]);

  const [cooldown, setCooldown] = useState(false);

  // Fetch AI analysis manually
  const handleRunAI = () => {
    if (aiLoading || aiAnalysis || cooldown) return;
    
    // Rate Limiter
    setCooldown(true);
    setTimeout(() => setCooldown(false), 15000); // 15 seconds cooldown

    setAiLoading(true);
    fetch(API_BASE + "/api/analytics/ai-summary")
      .then(res => res.json())
      .then(res => {
        if (res.status === "success") setAiAnalysis(res.analysis);
        else setAiError(res.error ?? "AI analysis unavailable");
      })
      .catch(() => setAiError("Could not reach AI endpoint"))
      .finally(() => setAiLoading(false));
  };

  // ── Pipeline Animation Screen ──────────────────────────────────────────────
  if (isAnimating) {
    const steps = pipelineStatus?.cleaning_steps ?? [];
    const shown = steps.slice(0, visibleStepIndex);
    const current = steps[visibleStepIndex];
    const phaseDone = pipelineStatus?.full_pipeline_done;

    return (
      <div className="space-y-4 py-6">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-5 h-5 border-2 border-[#39FF14] border-t-transparent rounded-full animate-spin" />
          <span className="font-mono text-sm text-[#39FF14] tracking-wider">
            {phaseDone ? "Pipeline Complete — Rendering Intelligence..."
              : pipelineStatus ? `Running TRINETRA-P Pipeline · ${pipelineStatus.total_rows.toLocaleString()} rows`
              : "Initializing TRINETRA-P Pipeline... (Waking up server, please wait up to 30s)"}
          </span>
        </div>
        <div className="space-y-2">
          {shown.map((step, i) => (
            <div key={i} className="flex items-center gap-3 p-3 rounded-lg bg-neutral-900 border border-neutral-800">
              <CheckCircle2 className="w-4 h-4 text-[#39FF14] flex-shrink-0" />
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between gap-2">
                  <span className="text-sm font-medium text-white">Step {step.index}/{step.total}: {step.step}</span>
                  <span className="text-xs text-neutral-500 font-mono flex-shrink-0">{step.output_rows.toLocaleString()} rows · {step.time_seconds.toFixed(2)}s</span>
                </div>
                <p className="text-xs text-neutral-400 truncate mt-0.5">{step.notes}</p>
              </div>
              <span className="text-xs font-mono px-1.5 py-0.5 rounded bg-[#39FF14]/10 text-[#39FF14] flex-shrink-0">{step.status}</span>
            </div>
          ))}
          {current && (
            <div className="flex items-center gap-3 p-3 rounded-lg bg-neutral-900 border border-[#39FF14]/40 animate-pulse">
              <Loader2 className="w-4 h-4 text-[#39FF14] flex-shrink-0 animate-spin" />
              <div className="flex-1 min-w-0">
                <span className="text-sm font-medium text-[#39FF14]">Step {current.index}/{current.total}: {current.step}</span>
                <p className="text-xs text-neutral-400 mt-0.5">Processing {current.input_rows.toLocaleString()} rows...</p>
              </div>
              <span className="text-xs font-mono px-1.5 py-0.5 rounded bg-yellow-500/10 text-yellow-400 flex-shrink-0">RUNNING</span>
            </div>
          )}
          {visibleStepIndex >= steps.length && steps.length > 0 && (
            <div className={`flex items-center gap-3 p-3 rounded-lg bg-neutral-900 border transition-colors ${phaseDone ? "border-[#39FF14]/40" : "border-blue-500/40 animate-pulse"}`}>
              {phaseDone ? <CheckCircle2 className="w-4 h-4 text-[#39FF14]" /> : <Loader2 className="w-4 h-4 text-blue-400 animate-spin" />}
              <div className="flex-1">
                <span className="text-sm font-medium text-white">TRINETRA-P Model Pipeline — PICQ · RRE · Quadrant Engine</span>
                <p className="text-xs text-neutral-400 mt-0.5">{phaseDone ? "Intelligence artifacts generated and ready." : "Computing PICQ scores, RRE zones, clustering..."}</p>
              </div>
              <span className={`text-xs font-mono px-1.5 py-0.5 rounded flex-shrink-0 ${phaseDone ? "bg-[#39FF14]/10 text-[#39FF14]" : "bg-blue-500/10 text-blue-400"}`}>{phaseDone ? "PASS" : "RUNNING"}</span>
            </div>
          )}
        </div>
        {pipelineStatus && (
          <div className="mt-4">
            <div className="flex justify-between text-xs text-neutral-500 mb-1">
              <span>{Math.min(visibleStepIndex, steps.length)} / {steps.length + 1} pipeline stages</span>
              <span>{Math.round((Math.min(visibleStepIndex, steps.length + 1) / (steps.length + 1)) * 100)}%</span>
            </div>
            <div className="w-full h-1.5 bg-neutral-800 rounded-full overflow-hidden">
              <div className="h-full bg-[#39FF14] rounded-full transition-all duration-500"
                style={{ width: `${Math.round((Math.min(visibleStepIndex, steps.length + 1) / (steps.length + 1)) * 100)}%` }} />
            </div>
          </div>
        )}
      </div>
    );
  }

  // ── Dashboard Screen ────────────────────────────────────────────────────────
  return (
    <div className="space-y-8 pb-10">

      {/* KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="bg-neutral-900 border-neutral-800">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-neutral-400">Records & Segments</CardTitle>
            <LayoutGrid className="h-4 w-4 text-neutral-500" />
          </CardHeader>
          <CardContent>
            {data ? (
              <>
                <div className="flex items-baseline justify-between">
                  <span className="text-2xl font-bold text-white">{data.raw_parking_records?.toLocaleString()}</span>
                  <span className="text-xs text-neutral-500">Raw Records</span>
                </div>
                <div className="flex justify-between items-center mt-2 pt-2 border-t border-neutral-800">
                  <div className="text-sm text-neutral-300">
                    <span className="text-white font-semibold">{data.analyzed_segments?.toLocaleString()}</span> Segments
                  </div>
                  <div className="text-xs text-neutral-500">
                    Avg {data.avg_records_per_segment?.toFixed(1)}/seg
                  </div>
                </div>
              </>
            ) : <div className="h-[72px] w-full bg-neutral-800 rounded animate-pulse" />}
          </CardContent>
        </Card>

        <Card className="bg-neutral-900 border-neutral-800">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-neutral-400">Average PICQ</CardTitle>
            <Activity className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            {data ? <><div className="text-3xl font-bold text-blue-400">{data.average_picq?.toFixed(2)}</div><p className="text-xs text-neutral-500 mt-1">Peak: {data.peak_picq?.toFixed(1)}</p></>
                  : <div className="h-9 w-20 bg-neutral-800 rounded animate-pulse" />}
          </CardContent>
        </Card>

        <Card className="bg-neutral-900 border-neutral-800">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-neutral-400">Critical RRE Zones</CardTitle>
            <AlertTriangle className="h-4 w-4 text-red-500" />
          </CardHeader>
          <CardContent>
            {data ? <><div className="text-3xl font-bold text-red-400">{data.critical_rre_zones?.toLocaleString()}</div><p className="text-xs text-neutral-500 mt-1">RRE ≥ 60 normalized recovery score</p></>
                  : <div className="h-9 w-16 bg-neutral-800 rounded animate-pulse" />}
          </CardContent>
        </Card>

        <Card className="bg-neutral-900 border-neutral-800">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-neutral-400">Top 10% Recovery Priority</CardTitle>
            <AlertTriangle className="h-4 w-4 text-orange-500" />
          </CardHeader>
          <CardContent>
            {data ? <><div className="text-3xl font-bold text-orange-400">{data.top_10_recovery_priority_zones?.toLocaleString()}</div><p className="text-xs text-neutral-500 mt-1">RRE ≥ 90th percentile</p></>
                  : <div className="h-9 w-16 bg-neutral-800 rounded animate-pulse" />}
          </CardContent>
        </Card>
      </div>

      {/* Quadrant Breakdown row */}
      {data && (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          {[
            { q: "Q1", label: "Immediate Dispatch", count: data.q1_count, color: "border-red-500/30 bg-red-500/5 text-red-400" },
            { q: "Q2", label: "Hidden Impact Zones", count: data.q2_count, color: "border-yellow-500/30 bg-yellow-500/5 text-yellow-400" },
            { q: "Q3", label: "Suppressed Heatmap", count: data.q3_count, color: "border-cyan-500/30 bg-cyan-500/5 text-cyan-400" },
            { q: "Q4", label: "Routine Monitor", count: data.q4_count, color: "border-neutral-600/30 bg-neutral-800/30 text-neutral-400" },
          ].map(({ q, label, count, color }) => (
            <div key={q} className={`rounded-xl border p-4 ${color}`}>
              <div className="text-2xl font-bold">{count?.toLocaleString() ?? "—"}</div>
              <div className="text-xs font-mono mt-1">{q}: {label}</div>
              <div className="text-xs opacity-60 mt-0.5">
                {data.total_analyzed_segments ? `${((count / data.total_analyzed_segments) * 100).toFixed(1)}% of total` : ""}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* AI Analysis Section */}
      <div className="rounded-xl border border-[#39FF14]/20 bg-[#39FF14]/3 overflow-hidden">
        <div className="flex items-center gap-3 px-5 py-4 border-b border-[#39FF14]/15 bg-[#39FF14]/5">
          <BrainCircuit className="w-5 h-5 text-[#39FF14]" />
          <div>
            <h3 className="font-bold text-white text-sm">TRINETRA AI — Intelligence Analysis</h3>
            <p className="text-xs text-neutral-400">Gemini 2.5 Flash analyzing dashboard metrics, 13 audit checks, and quadrant distribution in real-time</p>
          </div>
          {aiLoading ? (
            <div className="ml-auto flex items-center gap-2 text-xs text-[#39FF14]">
              <div className="w-3 h-3 border border-[#39FF14] border-t-transparent rounded-full animate-spin" />
              Analyzing...
            </div>
          ) : !aiAnalysis && (
            <div className="ml-auto flex flex-col items-end gap-1">
              <button
                onClick={handleRunAI}
                disabled={aiLoading || aiAnalysis || cooldown}
                className="flex items-center gap-2 text-xs font-semibold bg-[#39FF14]/10 hover:bg-[#39FF14]/20 text-[#39FF14] border border-[#39FF14]/30 px-3 py-1.5 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Sparkles className="w-3.5 h-3.5" />
                {cooldown ? "Wait 15s..." : "Run AI Analysis"}
              </button>
              <span className="text-[10px] text-neutral-500">Saves API tokens by running on-demand</span>
            </div>
          )}
        </div>

        <div className="p-5 space-y-6">
          {aiLoading && (
            <div className="space-y-3">
              <div className="h-4 w-full bg-neutral-800 rounded animate-pulse" />
              <div className="h-4 w-3/4 bg-neutral-800 rounded animate-pulse" />
              <div className="h-4 w-5/6 bg-neutral-800 rounded animate-pulse" />
            </div>
          )}

          {aiError && (
            <div className="flex items-center gap-2 text-red-400 text-sm">
              <AlertCircle className="w-4 h-4" /> {aiError}
            </div>
          )}

          {aiAnalysis && (
            <>
              {/* Executive Summary */}
              <div>
                <p className="text-sm text-neutral-200 leading-relaxed border-l-2 border-[#39FF14] pl-4">
                  {aiAnalysis.executive_summary}
                </p>
              </div>

              {/* Key Findings */}
              <div>
                <h4 className="text-xs font-mono text-neutral-500 uppercase tracking-widest mb-3">Key Findings</h4>
                <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-3">
                  {aiAnalysis.key_findings?.map((f, i) => (
                    <div key={i} className={`rounded-lg border p-3 ${IMPACT_STYLES[f.impact] ?? IMPACT_STYLES.medium}`}>
                      <div className="flex items-start justify-between gap-2 mb-1">
                        <span className="text-xs font-semibold leading-snug">{f.title}</span>
                        <Badge className={`text-[10px] px-1.5 py-0 flex-shrink-0 ${
                          f.impact === "high" ? "bg-red-500/20 text-red-400 border-red-500/30" :
                          f.impact === "medium" ? "bg-yellow-500/20 text-yellow-400 border-yellow-500/30" :
                          "bg-blue-500/20 text-blue-400 border-blue-500/30"
                        } border`}>{f.impact}</Badge>
                      </div>
                      <p className="text-xs opacity-75 leading-relaxed">{f.detail}</p>
                    </div>
                  ))}
                </div>
              </div>

              <div className="grid md:grid-cols-3 gap-4">
                {/* Quick Wins */}
                <div>
                  <h4 className="text-xs font-mono text-neutral-500 uppercase tracking-widest mb-3 flex items-center gap-1.5">
                    <Lightbulb className="w-3.5 h-3.5 text-yellow-400" /> Quick Wins
                  </h4>
                  <ul className="space-y-2">
                    {aiAnalysis.quick_wins?.map((w, i) => (
                      <li key={i} className="flex items-start gap-2 text-xs text-neutral-300">
                        <span className="text-[#39FF14] font-bold mt-0.5 flex-shrink-0">{i + 1}.</span> {w}
                      </li>
                    ))}
                  </ul>
                </div>

                {/* Risk Flags */}
                <div>
                  <h4 className="text-xs font-mono text-neutral-500 uppercase tracking-widest mb-3 flex items-center gap-1.5">
                    <ShieldAlert className="w-3.5 h-3.5 text-red-400" /> Risk Flags
                  </h4>
                  <ul className="space-y-2">
                    {aiAnalysis.risk_flags?.map((r, i) => (
                      <li key={i} className="flex items-start gap-2 text-xs text-neutral-300">
                        <span className="text-red-400 flex-shrink-0 mt-0.5">⚠</span> {r}
                      </li>
                    ))}
                  </ul>
                </div>

                {/* Policy Recommendation */}
                <div>
                  <h4 className="text-xs font-mono text-neutral-500 uppercase tracking-widest mb-3 flex items-center gap-1.5">
                    <TrendingUp className="w-3.5 h-3.5 text-[#39FF14]" /> Policy Recommendation
                  </h4>
                  <p className="text-xs text-neutral-300 leading-relaxed">{aiAnalysis.policy_recommendation}</p>
                  {aiAnalysis.data_confidence && (
                    <p className="text-xs text-neutral-500 mt-3 leading-relaxed italic">{aiAnalysis.data_confidence}</p>
                  )}
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
