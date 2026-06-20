"use client";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { ArrowRight, Radio, Activity, BarChart3, GitBranch, ShieldAlert, Cpu, Database, MapIcon, BrainCircuit, Gauge, Zap, Globe, Upload, Play, Square, LineChart, Clock, Server, FileText, AlertTriangle, PieChart, Trophy } from "lucide-react";
import Link from "next/link";
import { motion } from "framer-motion";
import { useRouter } from "next/navigation";

const features = [
  {
    category: "Historical Analytics",
    icon: BarChart3,
    color: "text-blue-500",
    bg: "bg-blue-500/10",
    border: "border-blue-500/30",
    items: [
      { icon: Database, label: "Bulk Data Ingestion", desc: "Process 298K+ parking violation records through the PICQ engine. Supports CSV upload and automated pipeline processing." },
      { icon: LineChart, label: "Segment-Level Analytics", desc: "7,814 road segments analyzed with per-segment PICQ, RRE, POP, and enforcement scores. Sortable and filterable." },
      { icon: PieChart, label: "Quadrant Visualization", desc: "Q1–Q4 quadrant breakdown with count distributions. Instantly identify critical enforcement zones vs hidden impact zones." },
      { icon: BarChart3, label: "26 Statistical Plots", desc: "Comprehensive Research Analytics tab with distribution histograms, scatter plots, box plots, and correlation matrices." },
      { icon: ShieldAlert, label: "Hidden Impact Zone Detection", desc: "Q2 segments (low violations, high impact) that standard heatmaps miss. Critical for strategic enforcement planning." },
      { icon: Trophy, label: "Enforcement Ranking", desc: "Segments ranked by composite enforcement score with severity bars and Q1/Q badges. Top segment identified for dispatch." },
    ],
  },
  {
    category: "Live Operations",
    icon: Zap,
    color: "text-orange-500",
    bg: "bg-orange-500/10",
    border: "border-orange-500/30",
    items: [
      { icon: Upload, label: "CSV Upload & Validate", desc: "Upload parking violation CSVs with automatic schema validation, column mapping, and format checking before replay begins." },
      { icon: Play, label: "CSV Replay Mode", desc: "Replay historical CSV data as a live stream with configurable playback speed. Cursor-based reads simulate real-time ingestion." },
      { icon: FileText, label: "File Polling Mode", desc: "Monitor a CSV file for new appended rows and stream them live. Ideal for integration with live data collection systems." },
      { icon: Globe, label: "Demo Stream Generator", desc: "Built-in demo mode generates synthetic parking events with realistic severity, PICQ deltas, and segment IDs for testing." },
      { icon: Activity, label: "Live Command Center", desc: "Real-time dashboard with connection status, active events counter, critical alerts, dispatch recommendations, and live incident stream." },
      { icon: MapIcon, label: "Live Map Integration", desc: "MapMyIndia SDK integration with real-time coordinate overlay. Shows severity-coded markers for active events with location data." },
      { icon: BrainCircuit, label: "Live Ask TRINETRA", desc: "Rule-based live query engine. Ask about current stream status, recommended dispatch segments, critical alerts, and zone activity." },
      { icon: ShieldAlert, label: "Active Violations Table", desc: "Real-time aggregation of violations by segment with severity bars, PICQ deltas, zone info, and criticality badges." },
    ],
  },
  {
    category: "Intelligence & Verification",
    icon: BrainCircuit,
    color: "text-[#39FF14]",
    bg: "bg-[#39FF14]/10",
    border: "border-[#39FF14]/30",
    items: [
      { icon: Cpu, label: "PICQ Intelligence Engine", desc: "Four-stage mathematical pipeline: POP → CSI → PICL → PICQ. Transparent formula with no hidden weights or black-box scoring." },
      { icon: GitBranch, label: "Session Memory (Deque 500)", desc: "Live state stores latest 500 events in a deque buffer. Analytics computed from full buffer, not truncated display window." },
      { icon: Clock, label: "Multi-Mode Live Session", desc: "Start/stop stream lifecycle. Events persist until explicitly stopped or source changed. Tab switches never reset session data." },
      { icon: Server, label: "HTTP Polling Architecture", desc: "No WebSocket dependency. Frontend polls REST endpoints at 2s intervals. CSV replay advances cursor server-side on each poll." },
      { icon: FileText, label: "AI-Generated B2G Reports", desc: "Gemini-powered executive summaries with key findings, risk flags, quick wins, policy recommendations, and data confidence scoring." },
      { icon: AlertTriangle, label: "Audit & Verification Framework", desc: "15+ mathematical integrity checks: quadrant sum validation, cross-equation verification, null handling, and boundary testing." },
    ],
  },
];

export default function FeaturesPage() {
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
            <Link href="/methodology" className="hover:text-black transition-colors">Methodology</Link>
            <Link href="/features" className="text-black">Features</Link>
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
              <Zap className="w-4 h-4 text-[#39FF14]" />
              Platform Capabilities
            </div>
            <h1 className="text-5xl md:text-7xl font-black tracking-tighter leading-[1.05] mb-6">
              Every Feature, <span className="text-transparent bg-clip-text bg-gradient-to-r from-neutral-400 to-neutral-800">Explained</span>
            </h1>
            <p className="text-xl text-neutral-600 max-w-3xl mx-auto leading-relaxed">
              TRINETRA-P ships with dual-mode architecture — Historical Analytics for strategic planning and Live Operations 
              for real-time response — backed by a transparent intelligence engine.
            </p>
          </motion.div>
        </div>
      </section>

      {/* Feature Categories */}
      {features.map((cat, ci) => (
        <section key={cat.category} className={`py-20 px-6 ${ci % 2 === 1 ? 'bg-white border-t border-black/5' : ''}`}>
          <div className="max-w-6xl mx-auto">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="flex items-center gap-4 mb-12"
            >
              <div className={`w-14 h-14 rounded-2xl ${cat.bg} ${cat.border} border flex items-center justify-center`}>
                <cat.icon className={`w-7 h-7 ${cat.color}`} />
              </div>
              <div>
                <h2 className="text-3xl font-bold tracking-tight">{cat.category}</h2>
                <p className="text-neutral-500">
                  {cat.items.length} features in this category
                </p>
              </div>
            </motion.div>

            <div className="grid md:grid-cols-2 gap-6">
              {cat.items.map((feature, fi) => (
                <motion.div
                  key={fi}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: fi * 0.05 }}
                >
                  <Card className="p-6 border-black/5 shadow-lg shadow-black/5 bg-[#FDFBF7] h-full hover:shadow-xl hover:shadow-black/10 transition-all group">
                    <div className="flex items-start gap-4">
                      <div className={`w-10 h-10 rounded-xl ${cat.bg} border ${cat.border} flex items-center justify-center shrink-0 group-hover:scale-110 transition-transform`}>
                        <feature.icon className={`w-5 h-5 ${cat.color}`} />
                      </div>
                      <div>
                        <h3 className="font-bold text-lg mb-1">{feature.label}</h3>
                        <p className="text-neutral-600 text-sm leading-relaxed">{feature.desc}</p>
                      </div>
                    </div>
                  </Card>
                </motion.div>
              ))}
            </div>
          </div>
        </section>
      ))}

      {/* CTA */}
      <section className="bg-black text-white py-24 text-center px-6 relative overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_bottom,_var(--tw-gradient-stops))] from-neutral-900 via-black to-black" />
        <div className="relative z-10 max-w-3xl mx-auto">
          <h2 className="text-5xl font-bold tracking-tight mb-6">Ready to explore?</h2>
          <p className="text-xl text-neutral-400 mb-10">Launch the platform and see TRINETRA-P in action.</p>
          <Button 
            onClick={() => router.push("/setup")}
            size="lg" 
            className="bg-[#39FF14] text-black hover:bg-[#32e011] rounded-full px-12 h-16 text-lg font-bold shadow-[0_0_40px_rgba(57,255,20,0.4)] transition-all hover:scale-105"
          >
            Launch Platform Now
          </Button>
        </div>
      </section>
    </div>
  );
}
