"use client";

import { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { ChevronDown, ChevronUp, ExternalLink } from "lucide-react";
import { API_BASE } from "../../lib/api";

const BASE = API_BASE + "/figures";

interface PlotGroup {
  title: string;
  description: string;
  color: string;
  plots: { file: string; caption: string; insight: string }[];
}

const PLOT_GROUPS: PlotGroup[] = [
  {
    title: "Data Quality & Cleaning Pipeline",
    description: "Verifies input data integrity before PICQ computation. These are the actual EDA outputs from the pre-processing stage.",
    color: "text-blue-400 border-blue-500/30 bg-blue-500/5",
    plots: [
      { file: "row_retention_funnel.png", caption: "Row Retention Funnel", insight: "Shows 298,450 rows retained with 0% data loss across all 10 cleaning stages — perfect for B2G audit trails." },
      { file: "missing_value_report.png", caption: "Missing Value Report", insight: "Only non-critical optional fields are missing. Core fields (lat, lon, timestamp, violation_type) are 100% complete." },
      { file: "spatial_scatter.png", caption: "Spatial Coverage Map", insight: "Bengaluru-wide spatial scatter of all validated violation coordinates — confirms geospatial completeness." },
      { file: "violations_by_hour.png", caption: "Violations by Hour of Day", insight: "Peak enforcement window identified at 8–10 AM and 5–8 PM, corresponding to traffic rush hours." },
      { file: "day_hour_heatmap.png", caption: "Day × Hour Heatmap", insight: "Wednesday–Friday evenings show highest violation density — ideal days for targeted tow dispatch." },
      { file: "violation_types.png", caption: "Violation Type Distribution", insight: "Wrong Parking and Parking Near Road Crossing dominate — both directly cause lane-blocking congestion." },
    ],
  },
  {
    title: "PICQ Score Engine — Sub-Components",
    description: "Each component of the PICQ formula broken down independently. Judges can trace the mathematical lineage from raw counts to the final composite intelligence score.",
    color: "text-[#39FF14] border-[#39FF14]/30 bg-[#39FF14]/5",
    plots: [
      { file: "01_segment_violation_distribution.png", caption: "Segment Violation Distribution", insight: "Long-tail distribution reveals a small set of hotspot segments driving disproportionate violation counts." },
      { file: "02_top_segments_by_violations.png", caption: "Top 20 Segments by Violations", insight: "Segment FKID152503 leads with the highest raw violations — a primary target for immediate enforcement." },
      { file: "03_recurrence_score_distribution.png", caption: "Recurrence Score (R) Distribution", insight: "Recurrence captures whether violations repeat across multiple days — a key differentiator from one-off incidents." },
      { file: "04_peak_hour_pressure_distribution.png", caption: "Peak Hour Pressure (PHP) Distribution", insight: "70% of segments exhibit above-average peak hour pressure, confirming systemic morning/evening congestion causation." },
      { file: "05_pop_distribution.png", caption: "Parking Occupancy Pressure (POP)", insight: "POP combines violations × recurrence × peak intensity into a normalized 0–100 occupancy stress index." },
      { file: "06_csi_distribution.png", caption: "Congestion Sensitivity Index (CSI)", insight: "CSI weights road-type sensitivity and zone density to estimate how much parking violations amplify traffic bottlenecks." },
      { file: "07_picl_distribution.png", caption: "PICL — Parking-Induced Congestion Likelihood", insight: "PICL = POP × CSI, isolating segments where high occupancy stress hits high-sensitivity roads simultaneously." },
      { file: "08_picq_distribution.png", caption: "PICQ Final Score Distribution", insight: "The composite PICQ score. Near-normal distribution across segments ensures enforcement resources are prioritized, not diluted." },
    ],
  },
  {
    title: "Road Recovery Estimation (RRE) Engine",
    description: "RRE estimates how much road capacity can be reclaimed per segment if parking violations are eliminated — the B2G ROI metric.",
    color: "text-orange-400 border-orange-500/30 bg-orange-500/5",
    plots: [
      { file: "09_rre_distribution.png", caption: "RRE Score Distribution", insight: "RRE peaks at high-PICQ zones, confirming that road recovery potential is concentrated in enforcement priority areas." },
      { file: "10_violation_count_vs_picq.png", caption: "Violation Count vs PICQ Score", insight: "Non-linear relationship exposes segments where low-count violations cause disproportionate congestion — the hidden impact problem." },
      { file: "11_picq_vs_rre.png", caption: "PICQ vs RRE Correlation", insight: "Strong positive correlation (ρ ≈ 0.87). High-PICQ zones also yield highest road recovery — enforcement is efficient here." },
    ],
  },
  {
    title: "Quadrant Intelligence Matrix",
    description: "The 2×2 decision matrix that classifies every segment into actionable enforcement quadrants — the core B2G deliverable.",
    color: "text-purple-400 border-purple-500/30 bg-purple-500/5",
    plots: [
      { file: "12_quadrant_distribution.png", caption: "Quadrant Distribution", insight: "Q1 (Immediate Dispatch): 132,857 segments. Q3 (Suppressed Heatmap Zones): 165,593 segments that standard heatmaps miss entirely." },
      { file: "13_quadrant_scatter.png", caption: "Quadrant Scatter Matrix", insight: "Visual proof that TRINETRA-P separates high-impact low-violation segments (Q2) that raw heatmap tools would never flag." },
      { file: "14_top_hidden_impact_zones.png", caption: "Top Hidden Impact Zones (Q2)", insight: "These are the invisible congestion contributors — high PICQ, low violations. No existing tool detects them without PICQ." },
      { file: "20_heatmap_vs_picq_priority_comparison.png", caption: "Heatmap vs PICQ Priority Comparison", insight: "TRINETRA-P prioritizes 165,593 more segments than a pure heatmap approach, exposing the systemic gap in current tools." },
    ],
  },
  {
    title: "Enforcement Intelligence & What-If Simulation",
    description: "Actionable outputs for government agencies — ranked dispatch targets, anomaly flags, and simulated enforcement ROI curves.",
    color: "text-red-400 border-red-500/30 bg-red-500/5",
    plots: [
      { file: "15_top_enforcement_segments.png", caption: "Top 20 Enforcement Dispatch Targets", insight: "Final ranked list by enforcement_score = PICQ × RRE × data_confidence. Ready for integration into command dispatch systems." },
      { file: "16_data_confidence_distribution.png", caption: "Data Confidence Score Distribution", insight: "Confidence weights enforcement scores by coordinate accuracy, temporal completeness, and record quality — enabling reliable decision-making." },
      { file: "17_anomaly_score_distribution.png", caption: "Anomaly Detection Scores", insight: "IsolationForest flags 5% of segments as statistical anomalies — outlier enforcement targets that spike suddenly without recurrence history." },
      { file: "18_what_if_recovery_curve.png", caption: "What-If Road Recovery Simulation", insight: "Cumulative recovery curves for 50%, 70%, 90% enforcement effectiveness across top 20 segments — quantifies city-wide ROI for budget planning." },
      { file: "19_before_after_picq_simulation.png", caption: "Pre vs Post-Enforcement PICQ Simulation", insight: "Shows projected PICQ reduction per segment after enforcement intervention at 70% effectiveness — a deliverable metric for policy reports." },
    ],
  },
];

function PlotCard({ plot, base }: { plot: PlotGroup["plots"][0]; base: string }) {
  const [expanded, setExpanded] = useState(false);
  return (
    <div className="bg-neutral-900 border border-neutral-800 rounded-xl overflow-hidden hover:border-neutral-600 transition-all group">
      <div
        className="relative cursor-pointer overflow-hidden"
        onClick={() => setExpanded(true)}
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={`${base}/${plot.file}`}
          alt={plot.caption}
          className="w-full object-cover bg-neutral-950 group-hover:scale-[1.02] transition-transform duration-300"
          style={{ maxHeight: "260px", objectFit: "contain", padding: "8px" }}
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent opacity-0 group-hover:opacity-100 transition-opacity flex items-end p-3">
          <span className="text-white text-xs flex items-center gap-1">
            <ExternalLink className="w-3 h-3" /> Click to expand
          </span>
        </div>
      </div>
      <div className="p-4">
        <h4 className="font-semibold text-sm text-white mb-1">{plot.caption}</h4>
        <p className="text-xs text-neutral-400 leading-relaxed">{plot.insight}</p>
      </div>

      {/* Expanded modal */}
      {expanded && (
        <div
          className="fixed inset-0 z-50 bg-black/90 flex items-center justify-center p-4"
          onClick={() => setExpanded(false)}
        >
          <div className="relative max-w-5xl w-full bg-neutral-900 rounded-xl overflow-hidden border border-neutral-700 shadow-2xl" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between p-4 border-b border-neutral-800">
              <h3 className="font-bold text-white">{plot.caption}</h3>
              <button onClick={() => setExpanded(false)} className="text-neutral-400 hover:text-white text-xl leading-none">✕</button>
            </div>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={`${base}/${plot.file}`} alt={plot.caption} className="w-full max-h-[70vh] object-contain bg-neutral-950 p-4" />
            <div className="p-4 bg-neutral-900 border-t border-neutral-800">
              <p className="text-sm text-neutral-300 leading-relaxed">{plot.insight}</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function PlotGroup({ group }: { group: PlotGroup }) {
  const [collapsed, setCollapsed] = useState(false);
  return (
    <div className="mb-10">
      <div
        className={`flex items-start justify-between p-4 rounded-xl border mb-4 cursor-pointer ${group.color}`}
        onClick={() => setCollapsed(c => !c)}
      >
        <div>
          <h3 className="font-bold text-base">{group.title}</h3>
          <p className="text-xs text-neutral-400 mt-0.5 max-w-2xl">{group.description}</p>
        </div>
        <div className="flex items-center gap-2 flex-shrink-0 ml-4 mt-0.5">
          <Badge variant="outline" className="text-xs border-current text-current">{group.plots.length} plots</Badge>
          {collapsed ? <ChevronDown className="w-4 h-4" /> : <ChevronUp className="w-4 h-4" />}
        </div>
      </div>
      {!collapsed && (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {group.plots.map(p => (
            <PlotCard key={p.file} plot={p} base={BASE} />
          ))}
        </div>
      )}
    </div>
  );
}

export function ResearchAnalyticsTab() {
  return (
    <div className="space-y-2 pb-10">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-2">
          <Badge className="bg-[#39FF14]/10 text-[#39FF14] border-[#39FF14]/30 border">RESEARCH ANALYTICS</Badge>
          <Badge variant="outline" className="text-neutral-400 border-neutral-700">26 Analysis Plots · 5 Pipeline Stages</Badge>
        </div>
        <h2 className="text-2xl font-bold text-white">PICQ Intelligence Research Report</h2>
        <p className="text-neutral-400 text-sm mt-1 max-w-3xl">
          Complete analytical outputs from the TRINETRA-P batch processing pipeline. 
          All plots are generated from the actual Bengaluru parking violation dataset (298,450 records).
          Suitable for B2G policy presentations, audit committees, and hackathon judging panels.
        </p>
      </div>

      {PLOT_GROUPS.map(g => (
        <PlotGroup key={g.title} group={g} />
      ))}
    </div>
  );
}
