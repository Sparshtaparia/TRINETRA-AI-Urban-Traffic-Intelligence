"use client";

import { useState, useRef, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Send, Bot, User, Radio, Activity, Loader2, Sparkles, ShieldAlert, TrendingUp, Zap, HelpCircle, MapPin } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { useLiveSession } from "@/lib/LiveSessionProvider";
import { API_BASE } from "../../lib/api";

const SUGGESTED_PROMPTS = [
  { icon: Activity, label: "Summarize live stream", query: "Summarize the current live stream" },
  { icon: Zap, label: "Which segment needs dispatch?", query: "Which segment needs dispatch now?" },
  { icon: ShieldAlert, label: "Show critical alerts", query: "Show critical alerts" },
  { icon: MapPin, label: "Which zone is most active?", query: "Which zone is most active?" },
  { icon: TrendingUp, label: "What changed recently?", query: "What changed in the last 5 minutes?" },
  { icon: HelpCircle, label: "Why this dispatch?", query: "Why is dispatch recommended?" },
];

const STORAGE_KEY = "trinetra_live_chat_history";

export function LiveAskTrinetraTab() {
  const [query, setQuery] = useState("");
  const [messages, setMessages] = useState<{ role: "user" | "assistant"; content: string }[]>(() => {
    try {
      const stored = sessionStorage.getItem(STORAGE_KEY);
      if (stored) return JSON.parse(stored);
    } catch {}
    return [];
  });
  const [loading, setLoading] = useState(false);
  const chatEndRef = useRef<HTMLDivElement>(null);
  const { snapshot } = useLiveSession();

  const hasEvents = (snapshot?.events?.length ?? 0) > 0;
  const analytics = snapshot?.analytics;

  useEffect(() => {
    try {
      sessionStorage.setItem(STORAGE_KEY, JSON.stringify(messages));
    } catch {}
  }, [messages]);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading]);

  const handleSend = async () => {
    if (!query.trim() || loading) return;

    const userMsg = query;
    setMessages(prev => [...prev, { role: "user", content: userMsg }]);
    setQuery("");
    setLoading(true);

    try {
      const res = await fetch(API_BASE + "/api/live/ask-trinetra", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ question: userMsg, history: messages.slice(-5) })
      });
      const data = await res.json();

      if (data.status === "ready") {
        setMessages(prev => [...prev, { role: "assistant", content: data.answer }]);
      } else {
        setMessages(prev => [...prev, { role: "assistant", content: `**Error:** ${data.message || "Unknown error"}` }]);
      }
    } catch {
      setMessages(prev => [...prev, { role: "assistant", content: "**Connection Error:** Unable to reach the backend. Please ensure the server is running." }]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col h-full min-h-0">
      <Card className="flex-1 flex flex-col bg-neutral-900 border-neutral-800 overflow-hidden min-h-0">

        <div className="h-14 border-b border-neutral-800 flex items-center px-5 gap-3 bg-neutral-950 shrink-0">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-[#39FF14]/20 to-black border border-[#39FF14]/30 flex items-center justify-center">
            <Radio className="w-4 h-4 text-[#39FF14]" />
          </div>
          <div className="flex-1">
            <div className="text-sm font-bold text-white flex items-center gap-2">
              TRINETRA Live Intelligence
              <span className={`w-1.5 h-1.5 rounded-full ${hasEvents ? 'bg-[#39FF14] animate-pulse' : 'bg-neutral-600'}`} />
            </div>
            <div className="text-[11px] text-neutral-500">
              {hasEvents
                ? `Analyzing ${snapshot?.events_received ?? 0} live events`
                : "No live events yet"}
            </div>
          </div>
          {analytics && hasEvents && (
            <Badge variant="outline" className="bg-[#39FF14]/5 text-[#39FF14] border-[#39FF14]/20 text-[10px]">
              <ShieldAlert className="w-3 h-3 mr-1" /> {analytics.critical_alerts} critical
            </Badge>
          )}
        </div>

        <div className="flex-1 overflow-y-auto min-h-0 scroll-smooth">
          <div className="p-5 space-y-5 max-w-3xl mx-auto w-full">
            {messages.length === 0 && !hasEvents && (
              <div className="text-neutral-500 text-center py-16">
                <Activity className="w-12 h-12 mx-auto mb-4 text-neutral-700" />
                <p className="text-sm">Start a live stream or CSV replay first so I can answer using live TRINETRA intelligence.</p>
              </div>
            )}
            {messages.length === 0 && hasEvents && (
              <div className="text-neutral-500 text-center py-8">
                <Sparkles className="w-8 h-8 mx-auto mb-3 text-[#39FF14]/50" />
                <p className="text-sm">Ask me anything about the current live stream. I have {snapshot?.events_received} events loaded.</p>
              </div>
            )}
            {messages.map((msg, idx) => (
              <div key={idx} className={`flex gap-3 items-start ${msg.role === "user" ? "flex-row-reverse" : ""}`}>
                <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 mt-0.5 ${
                  msg.role === "assistant"
                    ? "bg-gradient-to-br from-neutral-800 to-neutral-900 border border-neutral-700"
                    : "bg-blue-600"
                }`}>
                  {msg.role === "assistant"
                    ? <Bot className="w-4 h-4 text-[#39FF14]" />
                    : <User className="w-4 h-4 text-white" />}
                </div>
                <div className={`px-4 py-3 rounded-2xl text-sm leading-relaxed whitespace-pre-wrap ${
                  msg.role === "assistant"
                    ? "bg-neutral-950 border border-neutral-800 text-neutral-200 max-w-[85%]"
                    : "bg-blue-600 text-white max-w-[75%]"
                }`}>
                  {msg.content}
                </div>
              </div>
            ))}

            {loading && (
              <div className="flex gap-3 items-start">
                <div className="w-8 h-8 rounded-full flex items-center justify-center shrink-0 bg-gradient-to-br from-neutral-800 to-neutral-900 border border-neutral-700">
                  <Bot className="w-4 h-4 text-[#39FF14]" />
                </div>
                <div className="px-4 py-3 rounded-2xl bg-neutral-950 border border-neutral-800 text-neutral-400 text-sm flex items-center gap-2">
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Analyzing live stream...
                </div>
              </div>
            )}

            <div ref={chatEndRef} />
          </div>
        </div>

        <div className="p-4 bg-neutral-950 border-t border-neutral-800 shrink-0">
          <div className="max-w-3xl mx-auto flex gap-2">
            <Input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  handleSend();
                }
              }}
              placeholder="Ask about the live stream..."
              className="bg-neutral-900 border-neutral-800 text-white focus-visible:ring-[#39FF14]/50 placeholder:text-neutral-600"
            />
            <Button onClick={handleSend} disabled={!query.trim() || loading} className="bg-[#39FF14] text-black hover:bg-[#39FF14]/80 shrink-0 h-10 w-10 p-0" title="Send">
              {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
            </Button>
          </div>
          {messages.length <= 1 && (
            <div className="max-w-3xl mx-auto mt-3 flex flex-wrap gap-2">
              {SUGGESTED_PROMPTS.map((p, i) => (
                <Badge
                  key={i}
                  variant="outline"
                  className="cursor-pointer hover:bg-neutral-800 text-[11px] text-neutral-400 border-neutral-800 py-1.5 px-3 transition-colors flex items-center gap-1.5"
                  onClick={() => setQuery(p.query)}
                >
                  <p.icon className="w-3 h-3" /> {p.label}
                </Badge>
              ))}
            </div>
          )}
        </div>

      </Card>
    </div>
  );
}
