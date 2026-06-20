"use client";

import { useState, useRef, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Send, Bot, User, Radio, Loader2, Sparkles, Lightbulb, TrendingUp, ShieldAlert, BarChart3, HelpCircle } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { API_BASE } from "../../lib/api";

type Message = { role: "user" | "assistant"; content: string };

const SUGGESTED_PROMPTS = [
  { icon: Lightbulb, label: "Explain Q2 Hidden Impact Zones", query: "Explain Q2 Hidden Impact Zones in detail" },
  { icon: TrendingUp, label: "Why average PICQ matters", query: "Why is average PICQ score important for enforcement?" },
  { icon: ShieldAlert, label: "Verify dashboard metrics", query: "Verify the dashboard metrics are mathematically consistent" },
  { icon: BarChart3, label: "Top enforcement segment", query: "Which segment needs the most urgent enforcement action?" },
  { icon: HelpCircle, label: "How PICQ is calculated", query: "Explain step by step how PICQ score is calculated" },
];

const STORAGE_KEY = "trinetra_chat_history";

function loadHistory(): Message[] {
  try {
    const stored = sessionStorage.getItem(STORAGE_KEY);
    if (stored) return JSON.parse(stored);
  } catch {}
  return [
    { role: "assistant", content: "I am **TRINETRA AI**, your parking intelligence analyst. I can explain the PICQ methodology, analyze dashboard metrics, verify data integrity, and recommend enforcement strategies. How can I assist?" }
  ];
}

export function AskTrinetraTab() {
  const [query, setQuery] = useState("");
  const [messages, setMessages] = useState<Message[]>(loadHistory);
  const [loading, setLoading] = useState(false);
  const chatEndRef = useRef<HTMLDivElement>(null);

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
      const res = await fetch(API_BASE + "/api/analytics/ask-trinetra", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          query: userMsg,
          history: messages.slice(-5)
        })
      });
      const data = await res.json();

      if (data.status === "success") {
        setMessages(prev => [...prev, { role: "assistant", content: data.reply }]);
      } else {
        setMessages(prev => [...prev, { role: "assistant", content: `**Error:** ${data.error}` }]);
      }
    } catch {
      setMessages(prev => [...prev, { role: "assistant", content: "**Connection Error:** Unable to reach the backend. Please ensure the server is running and refresh." }]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col h-full min-h-0">
      <Card className="flex-1 flex flex-col bg-neutral-900 border-neutral-800 overflow-hidden min-h-0">

        {/* Chat Header — fixed top */}
        <div className="h-14 border-b border-neutral-800 flex items-center px-5 gap-3 bg-neutral-950 shrink-0">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-[#39FF14]/20 to-black border border-[#39FF14]/30 flex items-center justify-center">
            <Radio className="w-4 h-4 text-[#39FF14]" />
          </div>
          <div className="flex-1">
            <div className="text-sm font-bold text-white flex items-center gap-2">
              TRINETRA AI Assistant
              <span className="w-1.5 h-1.5 rounded-full bg-[#39FF14] animate-pulse" />
            </div>
            <div className="text-[11px] text-neutral-500">Intelligence Mode &middot; {messages.length} messages</div>
          </div>
          <Badge variant="outline" className="bg-[#39FF14]/5 text-[#39FF14] border-[#39FF14]/20 text-[10px]">
            <Sparkles className="w-3 h-3 mr-1" /> AI Ready
          </Badge>
        </div>

        {/* Chat Messages — scrollable area */}
        <div className="flex-1 overflow-y-auto min-h-0 scroll-smooth">
          <div className="p-5 space-y-5 max-w-3xl mx-auto w-full">
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
                  Analyzing intelligence data...
                </div>
              </div>
            )}

            <div ref={chatEndRef} />
          </div>
        </div>

        {/* Input Area — fixed bottom */}
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
              placeholder="Ask about Q2 zones, PICQ scores, or enforcement strategy..."
              className="bg-neutral-900 border-neutral-800 text-white focus-visible:ring-[#39FF14]/50 placeholder:text-neutral-600"
            />
            <Button onClick={handleSend} disabled={!query.trim() || loading} className="bg-[#39FF14] text-black hover:bg-[#39FF14]/80 shrink-0 h-10 w-10 p-0" title="Send">
              <Send className="w-4 h-4" />
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
