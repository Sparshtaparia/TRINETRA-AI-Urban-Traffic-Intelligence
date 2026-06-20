"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Database, Activity, ArrowRight, ArrowLeft } from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import { HistoricalConfigModal } from "@/components/setup/HistoricalConfigModal";
import { LiveConfigModal } from "@/components/setup/LiveConfigModal";

export default function SetupPage() {
  const [showHistoricalModal, setShowHistoricalModal] = useState(false);
  const [showLiveModal, setShowLiveModal] = useState(false);

  return (
    <div className="h-screen max-h-screen overflow-y-auto bg-neutral-950 text-neutral-50 flex flex-col p-6 lg:p-12">
      <Link href="/" className="inline-flex items-center text-sm text-neutral-400 hover:text-white mb-12 w-fit transition-colors">
        <ArrowLeft className="w-4 h-4 mr-2" /> Back to Home
      </Link>

      <div className="max-w-4xl mx-auto w-full space-y-12">
        <div className="space-y-4">
          <Badge variant="outline" className="text-[#39FF14] border-[#39FF14]/30 bg-[#39FF14]/10">PICQ ENGINE SETUP</Badge>
          <h1 className="text-4xl font-bold tracking-tight">Configure Intelligence Source</h1>
          <p className="text-xl text-neutral-400 max-w-2xl">
            Select how TRINETRA-P should receive parking-violation intelligence: historical batch data for planning or live streams for real-time operations.
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-6">
          {/* Historical Card */}
          <Card 
            className="bg-neutral-900 border-neutral-800 hover:border-neutral-600 transition-all cursor-pointer group flex flex-col"
            onClick={() => setShowHistoricalModal(true)}
          >
            <CardHeader>
              <div className="flex justify-between items-start mb-4">
                <div className="w-12 h-12 bg-blue-500/10 rounded-lg flex items-center justify-center">
                  <Database className="w-6 h-6 text-blue-400" />
                </div>
                <Badge variant="secondary" className="bg-neutral-800 text-neutral-300">Batch Mode</Badge>
              </div>
              <CardTitle className="text-2xl group-hover:text-blue-400 transition-colors">Historical Intelligence</CardTitle>
            </CardHeader>
            <CardContent className="flex-1 flex flex-col justify-between">
              <CardDescription className="text-neutral-400 text-base mb-6">
                Analyze stored or uploaded parking datasets to discover persistent violation pressure, Hidden Impact Zones, road recovery estimates, and enforcement plans.
              </CardDescription>
              <div className="text-sm font-medium text-blue-400 flex items-center mt-auto">
                Configure Source <ArrowRight className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform" />
              </div>
            </CardContent>
          </Card>

          {/* Live Card */}
          <Card 
            className="bg-neutral-900 border-neutral-800 hover:border-neutral-600 transition-all cursor-pointer group flex flex-col border-[#39FF14]/20 hover:border-[#39FF14]/50"
            onClick={() => setShowLiveModal(true)}
          >
            <CardHeader>
              <div className="flex justify-between items-start mb-4">
                <div className="w-12 h-12 bg-orange-500/10 rounded-lg flex items-center justify-center">
                  <Activity className="w-6 h-6 text-[#39FF14]" />
                </div>
                <Badge variant="secondary" className="bg-[#39FF14]/10 text-[#39FF14] border-[#39FF14]/20">Streaming Mode</Badge>
              </div>
              <CardTitle className="text-2xl group-hover:text-[#39FF14] transition-colors">Real-Time Operations</CardTitle>
            </CardHeader>
            <CardContent className="flex-1 flex flex-col justify-between">
              <CardDescription className="text-neutral-400 text-base mb-6">
                Connect polling, API, WebSocket, or CCTV/YOLO Kafka events to update PICQ live, trigger alerts, and recommend dispatch actions.
              </CardDescription>
              <div className="text-sm font-medium text-[#39FF14] flex items-center mt-auto">
                Configure Source <ArrowRight className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Pipeline Info */}
        <div className="mt-16 pt-16 border-t border-neutral-800/50 text-center space-y-8">
          <div className="inline-flex items-center gap-4 text-sm font-mono text-neutral-500 bg-neutral-900 px-6 py-3 rounded-full border border-neutral-800">
            <span>Data Source</span>
            <ArrowRight className="w-4 h-4" />
            <span>Event Normalizer</span>
            <ArrowRight className="w-4 h-4" />
            <span className="text-[#39FF14]">PICQ Engine</span>
            <ArrowRight className="w-4 h-4" />
            <span>Enforcement Intelligence</span>
          </div>

          <div className="grid md:grid-cols-2 gap-4 max-w-2xl mx-auto text-sm text-neutral-400">
            <div>
              <span className="block text-white mb-1">Historical Mode answers:</span>
              Where should the city plan enforcement?
            </div>
            <div>
              <span className="block text-white mb-1">Live Mode answers:</span>
              Where should the next unit go now?
            </div>
          </div>
        </div>
      </div>

      <HistoricalConfigModal open={showHistoricalModal} onOpenChange={setShowHistoricalModal} />
      <LiveConfigModal open={showLiveModal} onOpenChange={setShowLiveModal} />
    </div>
  );
}
