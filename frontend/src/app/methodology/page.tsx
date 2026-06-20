"use client";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { ArrowLeft, ArrowRight, Radio, Activity, BarChart3, GitBranch, Layers, Sigma, Percent, Hash, PieChart, ShieldAlert, Cpu, Database, MapIcon, BrainCircuit, Gauge, Eye } from "lucide-react";
import Link from "next/link";
import { motion } from "framer-motion";
import { useRouter } from "next/navigation";

const formulas = [
  {
    step: 1,
    name: "Parking Obstruction Pressure (POP)",
    symbol: "POP",
    formula: "POP(s) = (V(s) / max(V)) × 100",
    desc: "Normalized violation pressure per segment. A segment with the highest violation count scores 100, all others scale proportionally.",
    icon: Percent,
  },
  {
    step: 2,
    name: "Capacity Sensitivity Index (CSI)",
    symbol: "CSI",
    formula: "CSI(s) = f(lanes, width, traffic_volume, proximity_to_junction)",
    desc: "Road-specific sensitivity to capacity loss. Segments near junctions, with fewer lanes, or high base traffic volume receive higher CSI values (range: 0.5–1.0).",
    icon: Gauge,
  },
  {
    step: 3,
    name: "Parking-Induced Capacity Loss (PICL)",
    symbol: "PICL",
    formula: "PICL(s) = POP(s) × CSI(s)",
    desc: "Multiplicative combination — a high-violation segment on a sensitive road produces exponentially greater capacity loss than either factor alone.",
    icon: Layers,
  },
  {
    step: 4,
    name: "PICQ Score (Final Normalization)",
    symbol: "PICQ",
    formula: "PICQ(s) = (PICL(s) / max(PICL)) × 100",
    desc: "The Parking Issue & Compliance Quotient. Normalized 0–100 scale where 100 represents the worst congestion impact from parking violations.",
    icon: Sigma,
  },
];

const quadrants = [
  { id: "Q1", label: "Critical Enforcement", count: 2263, pct: "29%", icon: ShieldAlert, color: "text-red-500", bg: "bg-red-500/10", border: "border-red-500/30", desc: "High violations, High impact — immediate dispatch zones. Both violation volume and congestion damage are above median." },
  { id: "Q2", label: "Hidden Impact Zones", count: 864, pct: "11%", icon: Activity, color: "text-yellow-500", bg: "bg-yellow-500/10", border: "border-yellow-500/30", desc: "Low violations, High impact — invisible to traditional heatmaps. Few violators but catastrophic road capacity damage." },
  { id: "Q3", label: "Suppressed Heatmap", count: 896, pct: "11%", icon: Eye, color: "text-blue-500", bg: "bg-blue-500/10", border: "border-blue-500/30", desc: "High violations, Low impact — visible on heatmaps but enforcement here yields minimal road recovery." },
  { id: "Q4", label: "Low Priority", count: 3791, pct: "49%", icon: Eye, color: "text-neutral-500", bg: "bg-neutral-500/10", border: "border-neutral-500/30", desc: "Low violations, Low impact — baseline monitoring only. Resources are better deployed elsewhere." },
];

const pipelineSteps = [
  { icon: Database, label: "Raw Ingestion", desc: "298,450 parking violation records ingested from CSV/API sources." },
  { icon: GitBranch, label: "Segment Aggregation", desc: "Records grouped by road segment ID into 7,814 unique segments." },
  { icon: Cpu, label: "PICQ Engine", desc: "POP, CSI, PICL, and PICQ calculated for every segment." },
  { icon: BarChart3, label: "Quadrant Classification", desc: "Median-split classification into Q1–Q4 quadrant system." },
  { icon: PieChart, label: "Scoring & Ranking", desc: "Enforcement Score (45% PICQ / 35% RRE / 20% POP) computed." },
  { icon: BrainCircuit, label: "AI Analysis & Report", desc: "Gemini-generated B2G report with executive summary & recommendations." },
];

export default function MethodologyPage() {
  const router = useRouter();

  return (
    <div className="min-h-screen bg-[#FDFBF7] text-neutral-900 font-sans selection:bg-[#39FF14]/30 selection:text-neutral-900">
      
      {/* Navbar */}
      <nav className="fixed top-0 w-full z-50 bg-[#FDFBF7]/80 backdrop-blur-md border-b border-black/5">
        <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link href="/" className="flex items-center gap-3">
              <div className="w-10 h-10 bg-black rounded-xl flex items-center justify-center shadow-lg shadow-black/10">
                <Radio className="w-5 h-5 text-[#39FF14]" />
              </div>
              <span className="font-extrabold text-2xl tracking-tight">TRINETRA<span className="text-[#39FF14]">-P</span></span>
            </Link>
          </div>
          <div className="hidden md:flex items-center gap-8 text-sm font-medium text-neutral-500">
            <Link href="/" className="hover:text-black transition-colors">Home</Link>
            <Link href="/methodology" className="text-black">Methodology</Link>
            <Link href="/features" className="hover:text-black transition-colors">Features</Link>
            <Link href="/audit" className="hover:text-black transition-colors">Audit</Link>
          </div>
          <Button 
            onClick={() => router.push("/setup")}
            className="bg-black text-white hover:bg-neutral-800 rounded-full px-6 h-11 font-medium shadow-xl shadow-black/10 transition-all hover:scale-105"
          >
            Launch Platform
          </Button>
        </div>
      </nav>

      {/* Hero */}
      <section className="pt-36 pb-20 px-6 relative overflow-hidden">
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:40px_40px] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_0%,#000_70%,transparent_100%)] pointer-events-none" />
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[800px] h-[600px] bg-[#39FF14]/10 rounded-full blur-[100px] pointer-events-none" />
        
        <div className="max-w-4xl mx-auto text-center relative z-10">
          <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.8, ease: "easeOut" }}>
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white border border-black/5 shadow-sm text-sm font-semibold tracking-wide mb-8">
              <Sigma className="w-4 h-4 text-[#39FF14]" />
              Mathematical Framework
            </div>
            <h1 className="text-5xl md:text-7xl font-black tracking-tighter leading-[1.05] mb-6">
              The PICQ Methodology
            </h1>
            <p className="text-xl text-neutral-700 max-w-3xl mx-auto leading-relaxed">
              Every score in TRINETRA-P is derived from a transparent, four-step mathematical pipeline. 
              No black boxes — you can verify every computation in our audit.
            </p>
          </motion.div>
        </div>
      </section>

      {/* Formula Pipeline */}
      <section className="pb-24 px-6">
        <div className="max-w-6xl mx-auto">
          <div className="relative">
            {/* Vertical line */}
            <div className="absolute left-8 top-0 bottom-0 w-0.5 bg-black/10 hidden md:block" />
            
            <div className="space-y-12">
              {formulas.map((f, i) => (
                <motion.div
                  key={f.step}
                  initial={{ opacity: 0, x: -20 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: i * 0.15, duration: 0.5 }}
                  className="relative pl-0 md:pl-20"
                >
                  <div className="hidden md:flex absolute left-0 top-0 w-16 h-16 bg-black rounded-2xl items-center justify-center shadow-lg shadow-black/10">
                    <f.icon className="w-7 h-7 text-[#39FF14]" />
                  </div>
                  <Card className="p-8 border-black/5 shadow-lg shadow-black/5 bg-white text-black hover:shadow-xl hover:shadow-black/10 transition-all">
                    <div className="flex items-center gap-3 mb-2">
                      <span className="text-xs font-bold text-neutral-600 uppercase tracking-wider">Step {f.step}</span>
                      <span className="w-px h-4 bg-black/10" />
                      <span className="text-xs font-bold text-neutral-700 bg-black/5 px-2 py-0.5 rounded-full font-mono">{f.symbol}</span>
                    </div>
                    <h3 className="text-2xl font-bold mb-3">{f.name}</h3>
                    <div className="bg-[#FDFBF7] border border-black/5 rounded-xl p-5 mb-4 font-mono text-center">
                      <code className="text-lg md:text-xl text-black font-bold">{f.formula}</code>
                    </div>
                    <p className="text-neutral-800 leading-relaxed">{f.desc}</p>
                  </Card>
                </motion.div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Final PICQ Composite */}
      <section className="py-20 bg-white border-t border-black/5 px-6">
        <div className="max-w-4xl mx-auto text-center">
          <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}>
            <h2 className="text-4xl font-bold tracking-tight mb-4">Enforcement Score</h2>
            <p className="text-xl text-neutral-700 max-w-2xl mx-auto mb-10">
              The final composite score used for segment ranking and dispatch prioritization.
            </p>
            <Card className="p-10 border-black/5 shadow-lg shadow-black/5 bg-[#FDFBF7] inline-block text-black">
              <div className="font-mono text-2xl md:text-3xl text-black font-bold mb-6">
                Enforcement = 0.45 × PICQ + 0.35 × RRE + 0.20 × POP
              </div>
              <div className="grid md:grid-cols-3 gap-6 text-left">
                <div className="bg-white border border-black/5 rounded-xl p-4">
                  <div className="text-3xl font-bold text-black">45<span className="text-lg text-neutral-600">%</span></div>
                  <div className="text-sm font-medium text-neutral-700 mt-1">PICQ Score</div>
                  <div className="text-xs text-neutral-600 mt-1">Congestion impact weight</div>
                </div>
                <div className="bg-white border border-black/5 rounded-xl p-4">
                  <div className="text-3xl font-bold text-black">35<span className="text-lg text-neutral-600">%</span></div>
                  <div className="text-sm font-medium text-neutral-700 mt-1">RRE Score</div>
                  <div className="text-xs text-neutral-600 mt-1">Revenue recovery weight</div>
                </div>
                <div className="bg-white border border-black/5 rounded-xl p-4">
                  <div className="text-3xl font-bold text-black">20<span className="text-lg text-neutral-600">%</span></div>
                  <div className="text-sm font-medium text-neutral-700 mt-1">POP Score</div>
                  <div className="text-xs text-neutral-600 mt-1">Violation pressure weight</div>
                </div>
              </div>
            </Card>
          </motion.div>
        </div>
      </section>

      {/* Quadrant Classification */}
      <section className="py-24 px-6">
        <div className="max-w-6xl mx-auto">
          <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className="text-center mb-16">
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white border border-black/5 shadow-sm text-sm font-semibold tracking-wide mb-6">
              <PieChart className="w-4 h-4 text-[#39FF14]" />
              Quadrant Classification
            </div>
            <h2 className="text-4xl font-bold tracking-tight mb-4">Beyond the Heatmap</h2>
            <p className="text-xl text-neutral-700 max-w-3xl mx-auto">
              Standard enforcement heatmaps only show violation volume. TRINETRA-P overlays congestion impact 
              to reveal four distinct segment types.
            </p>
          </motion.div>

          <div className="grid md:grid-cols-2 gap-6 mb-12">
            {quadrants.map((q, i) => (
              <motion.div
                key={q.id}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
              >
                <Card className={`p-6 border-2 ${q.border} ${q.bg} text-black shadow-lg shadow-black/5`}>
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center gap-3">
                      <div className={`w-10 h-10 rounded-xl ${q.bg} ${q.border} border flex items-center justify-center`}>
                        <q.icon className={`w-5 h-5 ${q.color}`} />
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <span className={`text-xl font-bold ${q.color}`}>{q.id}</span>
                          <span className="text-lg font-bold">{q.label}</span>
                        </div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-2xl font-black">{q.count}</div>
                      <div className="text-sm text-neutral-700">{q.pct} of segments</div>
                    </div>
                  </div>
                  <p className="text-neutral-800 text-sm leading-relaxed">{q.desc}</p>
                </Card>
              </motion.div>
            ))}
          </div>

          {/* Quadrant Matrix */}
          <Card className="p-8 border-black/5 shadow-lg shadow-black/5 bg-white text-black">
            <h3 className="text-xl font-bold mb-6 text-center">Impact × Violation Matrix</h3>
            <div className="grid grid-cols-3 gap-0.5 bg-black/10 rounded-xl overflow-hidden max-w-md mx-auto font-mono text-sm">
              <div className="p-4 bg-[#FDFBF7] font-semibold text-center text-neutral-700" />
              <div className="p-4 bg-[#FDFBF7] font-semibold text-center text-neutral-700">Low Impact</div>
              <div className="p-4 bg-[#FDFBF7] font-semibold text-center text-neutral-700">High Impact</div>
              
              <div className="p-4 bg-[#FDFBF7] font-semibold text-center text-neutral-700">High Volume</div>
              <div className="p-4 bg-blue-500/10 text-blue-600 font-bold text-center">Q3 (896)</div>
              <div className="p-4 bg-red-500/10 text-red-600 font-bold text-center">Q1 (2,263)</div>
              
              <div className="p-4 bg-[#FDFBF7] font-semibold text-center text-neutral-700">Low Volume</div>
              <div className="p-4 bg-neutral-500/10 text-neutral-500 font-bold text-center">Q4 (3,791)</div>
              <div className="p-4 bg-yellow-500/10 text-yellow-600 font-bold text-center">Q2 (864)</div>
            </div>
            <p className="text-center text-sm text-neutral-700 mt-4">
              Violation threshold: 8.0 &middot; Impact threshold (median PICQ): 8.56 &middot; 7,814 total segments
            </p>
          </Card>
        </div>
      </section>

      {/* Pipeline */}
      <section className="py-20 bg-white border-t border-black/5 px-6">
        <div className="max-w-6xl mx-auto">
          <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className="text-center mb-16">
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white border border-black/5 shadow-sm text-sm font-semibold tracking-wide mb-6">
              <GitBranch className="w-4 h-4 text-[#39FF14]" />
              Data Pipeline
            </div>
            <h2 className="text-4xl font-bold tracking-tight mb-4">End-to-End Architecture</h2>
            <p className="text-xl text-neutral-700 max-w-2xl mx-auto">
              From raw violation records to actionable enforcement intelligence in six pipeline stages.
            </p>
          </motion.div>

          <div className="relative">
            <div className="absolute left-1/2 top-0 bottom-0 w-0.5 bg-black/5 hidden md:block" />
            <div className="space-y-8">
              {pipelineSteps.map((step, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: i * 0.1 }}
                  className={`flex items-center gap-8 ${i % 2 === 0 ? 'md:flex-row' : 'md:flex-row-reverse'} flex-row`}
                >
                  <div className="hidden md:block flex-1" />
                  <div className="w-14 h-14 bg-black rounded-2xl flex items-center justify-center shadow-lg shadow-black/10 shrink-0 relative z-10">
                    <step.icon className="w-6 h-6 text-[#39FF14]" />
                  </div>
                  <Card className="flex-1 p-6 border-black/5 shadow-lg shadow-black/5 bg-white text-black">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-xs font-bold text-neutral-600 uppercase">Stage {i + 1}</span>
                      <span className="w-px h-3 bg-black/10" />
                      <span className="text-xs font-bold text-[#39FF14] bg-[#39FF14]/10 px-2 py-0.5 rounded-full">{step.label}</span>
                    </div>
                    <p className="text-neutral-800">{step.desc}</p>
                  </Card>
                </motion.div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="bg-black text-white py-24 text-center px-6 relative overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_bottom,_var(--tw-gradient-stops))] from-neutral-900 via-black to-black" />
        <div className="relative z-10 max-w-3xl mx-auto">
          <h2 className="text-5xl font-bold tracking-tight mb-6">Verify the math yourself</h2>
          <p className="text-xl text-neutral-400 mb-10">Every computed value is logged and auditable in our verification dashboard.</p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Button 
              onClick={() => router.push("/audit")}
              size="lg" 
              className="bg-[#39FF14] text-black hover:bg-[#32e011] rounded-full px-10 h-16 text-lg font-bold shadow-[0_0_40px_rgba(57,255,20,0.4)] transition-all hover:scale-105"
            >
              View Audit Report <ArrowRight className="ml-2 w-6 h-6" />
            </Button>
            <Button 
              onClick={() => router.push("/setup")}
              size="lg" 
              variant="outline" 
              className="rounded-full px-10 h-16 text-lg font-semibold bg-white/10 border-white/20 hover:bg-white/20 text-white"
            >
              Launch Platform
            </Button>
          </div>
        </div>
      </section>
    </div>
  );
}
