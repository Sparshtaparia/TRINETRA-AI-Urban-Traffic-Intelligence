"use client";

import { useEffect, useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, Radio, User, Search, BarChart2, ShieldAlert, Trophy, ClipboardCheck, BrainCircuit, Microscope, BookOpen, Sparkles, CheckCircle, MapPin } from "lucide-react";
import Link from "next/link";
import { OverviewTab } from "@/components/dashboard/OverviewTab";
import { RankingTab } from "@/components/dashboard/RankingTab";
import { AuditTab } from "@/components/dashboard/AuditTab";
import { HiddenImpactZonesTab } from "@/components/dashboard/HiddenImpactZonesTab";
import { AskTrinetraTab } from "@/components/dashboard/AskTrinetraTab";
import { ResearchAnalyticsTab } from "@/components/dashboard/ResearchAnalyticsTab";
import { StaticMapView } from "@/components/dashboard/StaticMapView";
import { API_BASE } from "../../../lib/api";

const TABS = [
  { value: "overview",           label: "Overview",            icon: BarChart2 },
  { value: "map-view",           label: "Interactive Map",     icon: MapPin },
  { value: "research-analytics", label: "Research Analytics",  icon: Microscope },
  { value: "hidden-impact-zones",label: "Hidden Impact Zones", icon: ShieldAlert },
  { value: "enforcement-ranking",label: "Enforcement Ranking", icon: Trophy },
  { value: "audit-verification", label: "Audit Verification",  icon: ClipboardCheck },
  { value: "ask-trinetra",       label: "Ask TRINETRA",        icon: BrainCircuit },
];

export default function StaticDashboard() {
  const [activeTab, setActiveTab] = useState("overview");
  const [summary, setSummary] = useState<any>(null);

  useEffect(() => {
    fetch(API_BASE + "/api/analytics/summary")
      .then(r => r.json())
      .then(r => { if (r.status === "success") setSummary(r.data); })
      .catch(console.error);
  }, []);

  return (
    <div className="h-screen bg-neutral-950 text-neutral-50 flex flex-col">
      {/* Top Navigation */}
      <header className="h-16 border-b border-neutral-800 px-6 flex items-center justify-between bg-neutral-900/80 backdrop-blur-sm sticky top-0 z-30">
        <div className="flex items-center gap-4">
          <Link
            href="/setup"
            className="p-2 hover:bg-neutral-800 rounded-lg transition-colors text-neutral-400 hover:text-white"
            title="Back to Setup"
          >
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <div className="flex items-center gap-2 border-l border-neutral-800 pl-4">
            <Radio className="w-5 h-5 text-[#39FF14]" />
            <span className="font-bold tracking-tight">TRINETRA-P</span>
            <Badge variant="outline" className="ml-2 bg-blue-500/10 text-blue-400 border-blue-500/30 text-xs">Historical Mode</Badge>
          </div>
        </div>

        {/* Nav links */}
        <div className="hidden xl:flex items-center gap-5 text-xs font-medium">
          <Link href="/methodology" className="text-neutral-500 hover:text-white transition-colors flex items-center gap-1.5">
            <BookOpen className="w-3.5 h-3.5" /> Methodology
          </Link>
          <Link href="/features" className="text-neutral-500 hover:text-white transition-colors flex items-center gap-1.5">
            <Sparkles className="w-3.5 h-3.5" /> Features
          </Link>
          <Link href="/audit" className="text-neutral-500 hover:text-white transition-colors flex items-center gap-1.5">
            <CheckCircle className="w-3.5 h-3.5" /> Audit
          </Link>
        </div>

        {/* Live KPI strip */}
        {summary && (
          <div className="hidden lg:flex items-center gap-6 text-xs font-mono">
            <div className="text-neutral-400">
              Segments: <span className="text-white font-bold">{summary.analyzed_segments?.toLocaleString()}</span>
            </div>
            <div className="text-neutral-400">
              Avg PICQ: <span className="text-blue-400 font-bold">{summary.average_picq?.toFixed(1)}</span>
            </div>
            <div className="text-neutral-400">
              Q1 Dispatch: <span className="text-[#39FF14] font-bold">{summary.q1_count?.toLocaleString()}</span>
            </div>
            <div className="text-neutral-400">
              RRE Critical: <span className="text-red-400 font-bold">{summary.critical_rre_zones?.toLocaleString()}</span>
            </div>
            <div className="text-neutral-400">
              Top Seg: <span className="text-orange-400 font-bold">{summary.top_enforcement_segment}</span>
            </div>
          </div>
        )}

        <div className="flex items-center gap-3">
          <div className="relative">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-neutral-500" />
            <input
              type="text"
              placeholder="Search segments..."
              className="bg-neutral-900 border border-neutral-800 rounded-full pl-9 pr-4 py-1.5 text-sm focus:outline-none focus:border-neutral-600 w-52"
            />
          </div>
          <div className="w-8 h-8 rounded-full bg-neutral-800 flex items-center justify-center">
            <User className="w-4 h-4" />
          </div>
        </div>
      </header>

      {/* Main */}
      <main className="flex-1 flex flex-col p-6 min-h-0 overflow-y-auto">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1 flex flex-col">
          {/* Tab Bar */}
          <div className="border-b border-neutral-800 mb-6 pb-0 overflow-x-auto">
            <TabsList className="bg-transparent h-auto p-0 flex gap-0">
              {TABS.map(tab => {
                const Icon = tab.icon;
                return (
                  <TabsTrigger
                    key={tab.value}
                    value={tab.value}
                    className="flex items-center gap-2 px-4 py-3 text-sm rounded-none border-b-2 border-transparent data-[state=active]:border-[#39FF14] data-[state=active]:text-white text-neutral-400 hover:text-neutral-200 transition-colors whitespace-nowrap bg-transparent"
                  >
                    <Icon className="w-4 h-4" />
                    {tab.label}
                    {tab.value === "research-analytics" && (
                      <span className="ml-1 text-[10px] px-1.5 py-0.5 rounded bg-[#39FF14]/15 text-[#39FF14] font-mono leading-none">26 plots</span>
                    )}
                  </TabsTrigger>
                );
              })}
            </TabsList>
          </div>

          {/* Tab Content */}
          <div className="flex-1 flex flex-col min-h-0">
            <TabsContent value="overview" className="mt-0 border-0 p-0 flex flex-col flex-1 overflow-y-auto min-h-0">
              <OverviewTab />
            </TabsContent>
            <TabsContent value="map-view" className="mt-0 border-0 p-0 flex flex-col flex-1 h-full min-h-0 data-[state=active]:flex">
              <StaticMapView isActive={activeTab === "map-view"} />
            </TabsContent>
            <TabsContent value="research-analytics" className="mt-0 border-0 p-0 flex flex-col flex-1 overflow-y-auto min-h-0">
              <ResearchAnalyticsTab />
            </TabsContent>
            <TabsContent value="hidden-impact-zones" className="mt-0 border-0 p-0 flex flex-col flex-1 overflow-y-auto min-h-0">
              <HiddenImpactZonesTab />
            </TabsContent>
            <TabsContent value="enforcement-ranking" className="mt-0 border-0 p-0 flex flex-col flex-1 overflow-y-auto min-h-0">
              <RankingTab />
            </TabsContent>
            <TabsContent value="audit-verification" className="mt-0 border-0 p-0 flex flex-col flex-1 overflow-y-auto min-h-0">
              <AuditTab />
            </TabsContent>
            <TabsContent value="ask-trinetra" className="mt-0 border-0 p-0 flex flex-col flex-1 min-h-0">
              <AskTrinetraTab />
            </TabsContent>
          </div>
        </Tabs>
      </main>
    </div>
  );
}
