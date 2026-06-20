"use client";

import { useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, Radio, User, Search, Activity, ShieldAlert, Zap, BrainCircuit, BookOpen, Sparkles, CheckCircle } from "lucide-react";
import Link from "next/link";
import { LiveCommandCenterTab } from "@/components/dashboard/LiveCommandCenterTab";
import { ActiveViolationsTab } from "@/components/dashboard/ActiveViolationsTab";
import { LiveMapView } from "@/components/dashboard/LiveMapView";
import { LiveAskTrinetraTab } from "@/components/dashboard/LiveAskTrinetraTab";
import { LiveSessionProvider, useLiveSession } from "@/lib/LiveSessionProvider";

const TABS = [
  { value: "live-command",       label: "Command Center",     icon: Activity },
  { value: "live-map",           label: "Live Map",           icon: Zap },
  { value: "active-violations",  label: "Active Violations",  icon: ShieldAlert },
  { value: "ask-trinetra",       label: "Ask TRINETRA",       icon: BrainCircuit },
];

function LiveDashboardInner() {
  const [activeTab, setActiveTab] = useState("live-command");
  const { snapshot, connected } = useLiveSession();

  const label = snapshot?.label || "DISCONNECTED";

  return (
    <div className="h-screen max-h-screen overflow-hidden bg-neutral-950 text-neutral-50 flex flex-col">
      {/* Top Navigation */}
      <header className="h-16 border-b border-neutral-800 px-6 flex items-center justify-between bg-neutral-900/80 backdrop-blur-sm shrink-0">
        <div className="flex items-center gap-4">
          <Link
            href="/setup"
            className="p-2 hover:bg-neutral-800 rounded-lg transition-colors text-neutral-400 hover:text-white"
            title="Back to Setup"
          >
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <div className="flex items-center gap-2 border-l border-neutral-800 pl-4">
            <Radio className={`w-5 h-5 ${snapshot?.status === "connected" || snapshot?.status === "paused" ? "text-[#39FF14]" : "text-neutral-600"}`} />
            <span className="font-bold tracking-tight">TRINETRA-P</span>
            {(snapshot?.status === "connected" || snapshot?.status === "paused") && snapshot?.source_type && (
              <Badge variant="outline" className="ml-2 text-xs border-neutral-700 text-neutral-400 font-mono">
                {label}
              </Badge>
            )}
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
        {snapshot?.analytics && (
          <div className="hidden lg:flex items-center gap-6 text-xs font-mono">
            <div className="text-neutral-400">
              Events: <span className="text-white font-bold">{snapshot.events_received ?? 0}</span>
            </div>
            <div className="text-neutral-400">
              Active: <span className="text-blue-400 font-bold">{snapshot.analytics.active_events_last_5_min}</span>
            </div>
            <div className="text-neutral-400">
              Critical: <span className="text-red-400 font-bold">{snapshot.analytics.critical_alerts}</span>
            </div>
            <div className="text-neutral-400">
              Dispatch: <span className="text-orange-400 font-bold">{snapshot.analytics.recommended_dispatch_segment}</span>
            </div>
            <div className="text-neutral-400">
              Window: <span className="text-[#39FF14] font-bold">{snapshot.analytics_window_size ?? 500}</span>
            </div>
          </div>
        )}

        <div className="flex items-center gap-3">
          <div className="relative">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-neutral-500" />
            <input
              type="text"
              placeholder="Search events..."
              className="bg-neutral-900 border border-neutral-800 rounded-full pl-9 pr-4 py-1.5 text-sm focus:outline-none focus:border-neutral-600 w-44"
            />
          </div>
          {!connected && (
            <button
              onClick={() => window.location.href = "/setup"}
              className="text-xs bg-orange-500/10 text-orange-400 border border-orange-500/30 rounded-full px-3 py-1.5 hover:bg-orange-500/20 transition-colors"
            >
              Setup Stream
            </button>
          )}
          <div className="w-8 h-8 rounded-full bg-neutral-800 flex items-center justify-center">
            <User className="w-4 h-4" />
          </div>
        </div>
      </header>

      {/* Main */}
      <main className="flex-1 flex flex-col p-6 min-h-0">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1 flex flex-col min-h-0">
          <div className="border-b border-neutral-800 mb-6 pb-0 shrink-0">
            <TabsList className="bg-transparent h-auto p-0 flex gap-0">
              {TABS.map(tab => {
                const Icon = tab.icon;
                return (
                  <TabsTrigger
                    key={tab.value}
                    value={tab.value}
                    className="flex items-center gap-2 px-4 py-3 text-sm rounded-none border-b-2 border-transparent data-[state=active]:border-orange-500 data-[state=active]:text-white text-neutral-400 hover:text-neutral-200 transition-colors whitespace-nowrap bg-transparent"
                  >
                    <Icon className="w-4 h-4" />
                    {tab.label}
                  </TabsTrigger>
                );
              })}
            </TabsList>
          </div>

          <div className="flex-1 flex flex-col min-h-0">
            <TabsContent value="live-command" className="mt-0 border-0 p-0 flex flex-col flex-1 overflow-y-auto min-h-0">
              <LiveCommandCenterTab />
            </TabsContent>
            <TabsContent value="live-map" className="mt-0 border-0 p-0 flex flex-col flex-1 h-full min-h-0 data-[state=active]:flex">
              {activeTab === "live-map" && <LiveMapView />}
            </TabsContent>
            <TabsContent value="active-violations" className="mt-0 border-0 p-0 flex flex-col flex-1 overflow-y-auto min-h-0">
              <ActiveViolationsTab />
            </TabsContent>
            <TabsContent value="ask-trinetra" className="mt-0 border-0 p-0 flex flex-col flex-1 min-h-0">
              <LiveAskTrinetraTab />
            </TabsContent>
          </div>
        </Tabs>
      </main>
    </div>
  );
}

export default function LiveDashboard() {
  return (
    <LiveSessionProvider>
      <LiveDashboardInner />
    </LiveSessionProvider>
  );
}
