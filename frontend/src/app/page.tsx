"use client";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { motion } from "framer-motion";
import { ArrowRight, Activity, Radio, Database, Map as MapIcon, ShieldAlert, Cpu } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";

export default function LandingPage() {
  const router = useRouter();

  return (
    <div className="min-h-screen bg-[#FDFBF7] text-neutral-900 font-sans selection:bg-[#39FF14]/30 selection:text-neutral-900">
      
      {/* Navbar */}
      <nav className="fixed top-0 w-full z-50 bg-[#FDFBF7]/80 backdrop-blur-md border-b border-black/5">
        <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-black rounded-xl flex items-center justify-center shadow-lg shadow-black/10">
              <Radio className="w-5 h-5 text-[#39FF14]" />
            </div>
            <span className="font-extrabold text-2xl tracking-tight">TRINETRA<span className="text-[#39FF14]">-P</span></span>
          </div>
          <div className="hidden md:flex items-center gap-8 text-sm font-semibold text-neutral-700">
            <Link href="/methodology" className="hover:text-black transition-colors">Methodology</Link>
            <Link href="/features" className="hover:text-black transition-colors">Features</Link>
            <Link href="/audit" className="hover:text-black transition-colors">Audit Verification</Link>
          </div>
          <div className="flex items-center gap-4">
            <Button 
              onClick={() => router.push("/setup")}
              className="bg-black text-white hover:bg-neutral-800 rounded-full px-6 h-11 font-medium shadow-xl shadow-black/10 transition-all hover:scale-105"
            >
              Launch Platform
            </Button>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <main className="pt-32 pb-20 px-6 relative overflow-hidden flex flex-col items-center">
        
        {/* Abstract Background Grid & Glows */}
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:40px_40px] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_0%,#000_70%,transparent_100%)] pointer-events-none" />
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[800px] h-[600px] bg-[#39FF14]/10 rounded-full blur-[100px] pointer-events-none" />

        <motion.div 
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, ease: "easeOut" }}
          className="max-w-5xl mx-auto text-center z-10 relative mt-12"
        >
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white border border-black/5 shadow-sm text-sm font-semibold tracking-wide mb-8">
            <span className="relative flex h-2.5 w-2.5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#39FF14] opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-[#2ecc13]"></span>
            </span>
            Parking-Induced Congestion Intelligence
          </div>
          
          <h1 className="text-6xl md:text-8xl font-black tracking-tighter leading-[1.05] mb-8">
            AI-Powered Parking Intelligence <br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-neutral-400 to-neutral-800">
              for Urban Traffic Enforcement.
            </span>
          </h1>
          
          <p className="text-xl md:text-2xl text-neutral-600 max-w-3xl mx-auto mb-12 leading-relaxed font-medium">
            TRINETRA-P transforms parking violation records and live streams into explainable intelligence, helping traffic enforcement act where it recovers the most road capacity.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Button 
              onClick={() => router.push("/setup")}
              size="lg" 
              className="w-full sm:w-auto bg-[#39FF14] text-black hover:bg-[#32e011] rounded-full px-10 h-16 text-lg font-bold shadow-[0_0_40px_rgba(57,255,20,0.4)] transition-all hover:scale-105"
            >
              Start Intelligence Engine <ArrowRight className="ml-2 w-6 h-6" />
            </Button>
            <Button 
              size="lg" 
              variant="outline" 
              className="w-full sm:w-auto rounded-full px-10 h-16 text-lg font-semibold bg-white/50 backdrop-blur-md border-black/10 hover:bg-white"
            >
              View Methodology
            </Button>
          </div>
        </motion.div>

        {/* Dynamic Command Center Mockup */}
        <motion.div
          initial={{ opacity: 0, y: 60 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1, delay: 0.3, ease: "easeOut" }}
          className="mt-24 w-full max-w-6xl z-10"
        >
          <div className="rounded-3xl bg-neutral-950 border border-neutral-800 shadow-[0_40px_100px_-20px_rgba(0,0,0,0.5)] overflow-hidden flex flex-col">
            <div className="h-14 border-b border-neutral-800/50 flex items-center px-6 gap-3 bg-neutral-900/80 backdrop-blur-sm">
              <div className="flex gap-2">
                <div className="w-3.5 h-3.5 rounded-full bg-red-500" />
                <div className="w-3.5 h-3.5 rounded-full bg-yellow-500" />
                <div className="w-3.5 h-3.5 rounded-full bg-green-500" />
              </div>
              <div className="ml-4 text-xs font-mono text-neutral-500 flex items-center gap-2 bg-neutral-950 px-3 py-1 rounded-md border border-neutral-800">
                <Radio className="w-3 h-3 text-[#39FF14] animate-pulse" />
                trinetra-p.platform / live-ops
              </div>
            </div>
            
            <div className="flex flex-col md:flex-row h-[500px] bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-neutral-900 to-neutral-950">
              
              {/* Sidebar Mock */}
              <div className="hidden md:flex w-64 border-r border-neutral-800 p-6 flex-col gap-4">
                <div className="text-neutral-500 text-xs font-bold uppercase tracking-wider mb-2">Modules</div>
                {[
                  { icon: Activity, label: "Live Command", active: true },
                  { icon: MapIcon, label: "Map Intelligence" },
                  { icon: Database, label: "Historical Data" },
                  { icon: ShieldAlert, label: "Audit Verify" }
                ].map((item, i) => (
                  <div key={i} className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium cursor-pointer transition-colors ${item.active ? 'bg-[#39FF14]/10 text-[#39FF14]' : 'text-neutral-400 hover:text-white hover:bg-neutral-800/50'}`}>
                    <item.icon className="w-5 h-5" />
                    {item.label}
                  </div>
                ))}
              </div>

              {/* Console Mock */}
              <div className="flex-1 p-8 relative overflow-hidden font-mono text-sm">
                <div className="absolute top-0 right-0 p-8 flex gap-4 z-10">
                  <div className="bg-neutral-900/80 backdrop-blur-md border border-neutral-800 rounded-xl p-4 w-40 text-center">
                    <div className="text-neutral-500 text-xs mb-1">AVG PICQ</div>
                    <div className="text-3xl font-bold text-white">84<span className="text-neutral-600">/100</span></div>
                  </div>
                  <div className="bg-neutral-900/80 backdrop-blur-md border border-neutral-800 rounded-xl p-4 w-40 text-center">
                    <div className="text-neutral-500 text-xs mb-1">RECOVERABLE</div>
                    <div className="text-3xl font-bold text-[#39FF14]">17.2%</div>
                  </div>
                </div>

                <div className="space-y-6 pt-4 text-neutral-300 max-w-lg relative z-10">
                  <div className="flex text-[#39FF14] items-center gap-2 font-bold text-base">
                    <span>{">"} INITIALIZING PICQ ENGINE</span>
                    <span className="w-2 h-5 bg-[#39FF14] animate-pulse" />
                  </div>
                  
                  <div className="space-y-4 text-[13px] opacity-90">
                    <motion.div initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 1 }}>
                      <span className="text-neutral-500">10:42:01</span> <span className="text-neutral-400">Received bulk violation payload...</span>
                    </motion.div>
                    <motion.div initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 1.5 }}>
                      <span className="text-neutral-500">10:42:03</span> Calculating POP and CSI metrics...
                    </motion.div>
                    <motion.div initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 2 }}>
                      <span className="text-neutral-500">10:42:05</span> <span className="text-white bg-neutral-800 px-2 py-0.5 rounded">SEG-1042</span> PICQ updated from <span className="text-neutral-500 line-through">61</span> to <span className="text-red-400 font-bold">84</span>
                    </motion.div>
                    <motion.div initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 2.5 }} className="border-l-2 border-yellow-500 pl-4 py-1 bg-yellow-500/5">
                      <span className="text-yellow-400 font-bold tracking-wide">Q2 HIDDEN IMPACT ZONE DETECTED</span>
                      <br />
                      <span className="text-neutral-400">High congestion impact despite low violation volume.</span>
                    </motion.div>
                    <motion.div initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 3.5 }}>
                      <span className="text-neutral-500">10:42:10</span> <span className="text-[#39FF14]">ACTION RECOMMENDED: Dispatching Tow Unit 2 (ETA 8 min)</span>
                    </motion.div>
                  </div>
                </div>
                
                {/* Decorative Map Lines */}
                <div className="absolute -bottom-20 -right-20 w-96 h-96 opacity-10 pointer-events-none">
                  <svg viewBox="0 0 100 100" className="w-full h-full stroke-white fill-none" strokeWidth="0.5">
                    <path d="M10,90 Q30,50 50,80 T90,10" />
                    <path d="M20,100 Q40,60 60,90 T100,20" />
                    <circle cx="50" cy="80" r="2" fill="white" />
                    <circle cx="90" cy="10" r="2" fill="white" />
                  </svg>
                </div>
              </div>
            </div>
          </div>
        </motion.div>
      </main>

      {/* Feature Section */}
      <section id="features" className="py-24 bg-white border-t border-black/5 px-6">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold tracking-tight mb-4">Why Standard Heatmaps Fail</h2>
            <p className="text-xl text-neutral-500 max-w-2xl mx-auto">
              Traditional heatmaps show you where violations happen. TRINETRA-P shows you where violations damage the city's mobility.
            </p>
          </div>
          
          <div className="grid md:grid-cols-3 gap-8">
            <Card className="p-8 border-black/5 shadow-lg shadow-black/5 bg-[#FDFBF7]">
              <div className="w-12 h-12 bg-black text-white rounded-xl flex items-center justify-center mb-6">
                <ShieldAlert className="w-6 h-6 text-[#39FF14]" />
              </div>
              <h3 className="text-xl font-bold mb-3">Discover Hidden Impact Zones</h3>
              <p className="text-neutral-600 leading-relaxed">
                Identify "Q2" road segments where surprisingly low numbers of parking violations create devastating bottleneck congestion.
              </p>
            </Card>
            
            <Card className="p-8 border-black/5 shadow-lg shadow-black/5 bg-[#FDFBF7]">
              <div className="w-12 h-12 bg-black text-white rounded-xl flex items-center justify-center mb-6">
                <Cpu className="w-6 h-6 text-[#39FF14]" />
              </div>
              <h3 className="text-xl font-bold mb-3">Explainable PICQ Engine</h3>
              <p className="text-neutral-600 leading-relaxed">
                Every score is mathematically derived from Parking Obstruction Pressure (POP) and Capacity Sensitivity (CSI). Full transparency, zero black boxes.
              </p>
            </Card>

            <Card className="p-8 border-black/5 shadow-lg shadow-black/5 bg-[#FDFBF7]">
              <div className="w-12 h-12 bg-black text-white rounded-xl flex items-center justify-center mb-6">
                <Activity className="w-6 h-6 text-[#39FF14]" />
              </div>
              <h3 className="text-xl font-bold mb-3">Dual-Mode Architecture</h3>
              <p className="text-neutral-600 leading-relaxed">
                Use Historical Mode to plan city-wide enforcement patrols, and switch to Live Operations for real-time tow-truck dispatching.
              </p>
            </Card>
          </div>
        </div>
      </section>

      {/* Footer CTA */}
      <footer className="bg-black text-white py-24 text-center px-6 relative overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_bottom,_var(--tw-gradient-stops))] from-neutral-900 via-black to-black" />
        <div className="relative z-10 max-w-3xl mx-auto">
          <h2 className="text-5xl font-bold tracking-tight mb-6">Ready to recover road capacity?</h2>
          <p className="text-xl text-neutral-400 mb-10">Deploy TRINETRA-P in your command center today.</p>
          <Button 
            onClick={() => router.push("/setup")}
            size="lg" 
            className="bg-[#39FF14] text-black hover:bg-[#32e011] rounded-full px-12 h-16 text-lg font-bold"
          >
            Launch Platform Now
          </Button>
        </div>
      </footer>

    </div>
  );
}
