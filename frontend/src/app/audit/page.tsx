"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, ArrowRight, Radio, CheckCircle2, XCircle, AlertTriangle, Activity, BarChart3, Hash, Database, GitBranch, ShieldAlert, Cpu, Sigma, FileText, Users } from "lucide-react";
import Link from "next/link";
import { motion } from "framer-motion";
import { useRouter } from "next/navigation";
import { API_BASE } from "../../lib/api";

interface AuditMetric {
  metric_name: string;
  formula: string;
  computed_value: number | string;
  status: "PASS" | "FAIL";
  notes: string;
}

export default function AuditPage() {
  const router = useRouter();
  const [auditData, setAuditData] = useState<AuditMetric[]>([]);
  const [summary, setSummary] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      fetch(`${API_BASE}/api/analytics/audit-verification`).then(r => r.json()),
      fetch(`${API_BASE}/api/analytics/summary`).then(r => r.json()),
    ]).then(([auditRes, summaryRes]) => {
      if (auditRes.status === "success") setAuditData(auditRes.data);
      if (summaryRes.status === "success") setSummary(summaryRes.data);
    }).catch(console.error)
    .finally(() => setLoading(false));
  }, []);

  const passCount = auditData.filter(m => m.status === "PASS").length;
  const failCount = auditData.filter(m => m.status === "FAIL").length;

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
          <div className="hidden md:flex items-center gap-8 text-sm font-medium text-neutral-900">
            <Link href="/" className="hover:text-black transition-colors">Home</Link>
            <Link href="/methodology" className="hover:text-black transition-colors">Methodology</Link>
            <Link href="/features" className="hover:text-black transition-colors">Features</Link>
            <Link href="/audit" className="text-black">Audit</Link>
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
      <section className="pt-36 pb-16 px-6 relative overflow-hidden">
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:40px_40px] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_0%,#000_70%,transparent_100%)] pointer-events-none" />
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[800px] h-[600px] bg-[#39FF14]/10 rounded-full blur-[100px] pointer-events-none" />
        
        <div className="max-w-4xl mx-auto text-center relative z-10">
          <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.8, ease: "easeOut" }}>
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white border border-black/5 shadow-sm text-sm font-semibold tracking-wide mb-8">
              <CheckCircle2 className="w-4 h-4 text-[#39FF14]" />
              Integrity Verification
            </div>
            <h1 className="text-5xl md:text-7xl font-black tracking-tighter leading-[1.05] mb-6">
              Audit & Verification
            </h1>
            <p className="text-xl text-neutral-900 max-w-3xl mx-auto leading-relaxed">
              Every computed metric in TRINETRA-P is independently verified. No black boxes — 
              cross-equation validation, null-safe operations, and mathematical integrity checks.
            </p>
          </motion.div>
        </div>
      </section>

      {/* Stats Banner */}
      <div className="px-6 pb-16">
        <div className="max-w-6xl mx-auto">
          {loading ? (
            <div className="text-center text-neutral-900 py-12">Loading audit data...</div>
          ) : (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="grid md:grid-cols-5 gap-4"
            >
              <Card className="p-6 border-black/5 shadow-lg shadow-black/5 bg-white text-center text-black">
                <div className="text-3xl font-black text-black">{auditData.length}</div>
                <div className="text-sm text-neutral-900 mt-1">Total Checks</div>
              </Card>
              <Card className="p-6 border-black/5 shadow-lg shadow-black/5 bg-white text-center text-black">
                <div className="text-3xl font-black text-[#39FF14]">{passCount}</div>
                <div className="text-sm text-neutral-900 mt-1">Passed</div>
              </Card>
              <Card className="p-6 border-black/5 shadow-lg shadow-black/5 bg-white text-center text-black">
                <div className="text-3xl font-black text-red-500">{failCount}</div>
                <div className="text-sm text-neutral-900 mt-1">Failed</div>
              </Card>
              <Card className="p-6 border-black/5 shadow-lg shadow-black/5 bg-white text-center text-black">
                <div className="text-3xl font-black text-black">{summary?.analyzed_segments?.toLocaleString()}</div>
                <div className="text-sm text-neutral-900 mt-1">Segments</div>
              </Card>
              <Card className="p-6 border-black/5 shadow-lg shadow-black/5 bg-white text-center text-black">
                <div className="text-3xl font-black text-black">{summary?.raw_parking_records?.toLocaleString()}</div>
                <div className="text-sm text-neutral-900 mt-1">Records</div>
              </Card>
            </motion.div>
          )}
        </div>
      </div>

      {/* Audit Table */}
      <section className="pb-24 px-6">
        <div className="max-w-6xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
          >
            <Card className="border-black/5 shadow-lg shadow-black/5 bg-white overflow-hidden text-black">
              <div className="p-6 border-b border-black/5 bg-[#FDFBF7]">
                <h2 className="text-2xl font-bold tracking-tight">Verification Checks</h2>
                <p className="text-neutral-900 text-sm mt-1">
                  {passCount} of {auditData.length} checks passed — {failCount === 0 ? "100% integrity rate" : `${failCount} checks require attention`}
                </p>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-black/5 bg-black/[0.02]">
                      <th className="text-left p-4 font-semibold text-neutral-900">Metric</th>
                      <th className="text-left p-4 font-semibold text-neutral-900">Formula</th>
                      <th className="text-right p-4 font-semibold text-neutral-900">Value</th>
                      <th className="text-center p-4 font-semibold text-neutral-900 w-24">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {auditData.map((metric, i) => (
                      <motion.tr
                        key={i}
                        initial={{ opacity: 0 }}
                        whileInView={{ opacity: 1 }}
                        viewport={{ once: true }}
                        transition={{ delay: i * 0.02 }}
                        className={`border-b border-black/5 hover:bg-black/[0.02] transition-colors ${metric.status === "FAIL" ? 'bg-red-500/5' : ''}`}
                      >
                        <td className="p-4 font-medium">
                          <div className="flex items-center gap-2">
                            {metric.status === "PASS" ? (
                              <CheckCircle2 className="w-4 h-4 text-[#39FF14] shrink-0" />
                            ) : (
                              <XCircle className="w-4 h-4 text-red-500 shrink-0" />
                            )}
                            <span>{metric.metric_name}</span>
                          </div>
                          {metric.notes && (
                            <div className="text-xs text-neutral-500 mt-0.5 ml-6">{metric.notes}</div>
                          )}
                        </td>
                        <td className="p-4 font-mono text-xs text-neutral-500">{metric.formula}</td>
                        <td className="p-4 text-right font-mono font-bold">{String(metric.computed_value)}</td>
                        <td className="p-4 text-center">
                          <Badge variant="outline" className={`font-semibold ${
                            metric.status === "PASS" 
                              ? "bg-[#39FF14]/10 text-[#39FF14] border-[#39FF14]/30" 
                              : "bg-red-500/10 text-red-500 border-red-500/30"
                          }`}>
                            {metric.status}
                          </Badge>
                        </td>
                      </motion.tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </Card>
          </motion.div>
        </div>
      </section>

      {/* Pipeline Verification */}
      {summary && (
        <section className="pb-24 px-6">
          <div className="max-w-6xl mx-auto">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
            >
              <h2 className="text-3xl font-bold tracking-tight mb-6">Data Integrity Summary</h2>
              <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
                <Card className="p-6 border-black/5 shadow-lg shadow-black/5 bg-white text-black">
                  <div className="flex items-center gap-3 mb-2">
                    <Database className="w-5 h-5 text-blue-500" />
                    <div className="text-sm font-semibold text-neutral-900">Input Coverage</div>
                  </div>
                  <div className="text-2xl font-black">{summary.raw_parking_records?.toLocaleString()}</div>
                  <div className="text-sm text-neutral-900">records → {summary.analyzed_segments?.toLocaleString()} segments</div>
                </Card>
                <Card className="p-6 border-black/5 shadow-lg shadow-black/5 bg-white text-black">
                  <div className="flex items-center gap-3 mb-2">
                    <Sigma className="w-5 h-5 text-purple-500" />
                    <div className="text-sm font-semibold text-neutral-900">Avg Records / Segment</div>
                  </div>
                  <div className="text-2xl font-black">{summary.avg_records_per_segment?.toFixed(2)}</div>
                  <div className="text-sm text-neutral-900">violations per segment</div>
                </Card>
                <Card className="p-6 border-black/5 shadow-lg shadow-black/5 bg-white text-black">
                  <div className="flex items-center gap-3 mb-2">
                    <ShieldAlert className="w-5 h-5 text-red-500" />
                    <div className="text-sm font-semibold text-neutral-900">Critical RRE Zones</div>
                  </div>
                  <div className="text-2xl font-black text-red-500">{summary.critical_rre_zones}</div>
                  <div className="text-sm text-neutral-900">RRE &ge; {summary.critical_rre_threshold}</div>
                </Card>
                <Card className="p-6 border-black/5 shadow-lg shadow-black/5 bg-white text-black">
                  <div className="flex items-center gap-3 mb-2">
                    <Users className="w-5 h-5 text-[#39FF14]" />
                    <div className="text-sm font-semibold text-neutral-900">Data Confidence</div>
                  </div>
                  <div className="text-2xl font-black">{summary.average_data_confidence?.toFixed(1)}<span className="text-lg text-neutral-900">%</span></div>
                  <div className="text-sm text-neutral-900">average across all segments</div>
                </Card>
              </div>
            </motion.div>
          </div>
        </section>
      )}

      {/* Quadrant Verification */}
      {summary && (
        <section className="pb-24 px-6 bg-white border-t border-black/5 py-20">
          <div className="max-w-6xl mx-auto">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
            >
              <h2 className="text-3xl font-bold tracking-tight mb-2">Quadrant Cross-Validation</h2>
              <p className="text-neutral-900 mb-8">
                Verifying that quadrant counts satisfy mathematical invariants.
              </p>
              <div className="grid md:grid-cols-2 gap-6">
                <Card className="p-6 border-black/5 shadow-lg shadow-black/5 bg-[#FDFBF7] text-black">
                  <h3 className="font-bold text-lg mb-4">Q1 + Q2 + Q3 + Q4 = Total Segments</h3>
                  <div className="flex items-center gap-4">
                    <div className="bg-white border border-black/5 rounded-xl p-4 flex-1 text-center">
                      <div className="text-xs text-neutral-900 mb-1">Sum</div>
                      <div className="text-3xl font-black">{summary.q1_count + summary.q2_count + summary.q3_count + summary.q4_count}</div>
                    </div>
                    <div className="text-2xl text-neutral-900 font-bold">=</div>
                    <div className="bg-white border border-black/5 rounded-xl p-4 flex-1 text-center">
                      <div className="text-xs text-neutral-900 mb-1">Expected</div>
                      <div className="text-3xl font-black">{summary.analyzed_segments}</div>
                    </div>
                  </div>
                  {(summary.q1_count + summary.q2_count + summary.q3_count + summary.q4_count) === summary.analyzed_segments ? (
                    <div className="flex items-center gap-2 mt-4 text-[#39FF14] font-semibold text-sm">
                      <CheckCircle2 className="w-4 h-4" /> Verified — partition is complete
                    </div>
                  ) : (
                    <div className="flex items-center gap-2 mt-4 text-red-500 font-semibold text-sm">
                      <XCircle className="w-4 h-4" /> Mismatch detected
                    </div>
                  )}
                </Card>

                <Card className="p-6 border-black/5 shadow-lg shadow-black/5 bg-[#FDFBF7] text-black">
                  <h3 className="font-bold text-lg mb-4">Q1 + Q3 = High Violation Count</h3>
                  <div className="flex items-center gap-4">
                    <div className="bg-white border border-black/5 rounded-xl p-4 flex-1 text-center">
                      <div className="text-xs text-neutral-900 mb-1">Q1 + Q3</div>
                      <div className="text-3xl font-black">{summary.q1_count + summary.q3_count}</div>
                    </div>
                    <div className="text-2xl text-neutral-900 font-bold">=</div>
                    <div className="bg-white border border-black/5 rounded-xl p-4 flex-1 text-center">
                      <div className="text-xs text-neutral-900 mb-1">High Violation</div>
                      <div className="text-3xl font-black">{summary.high_violation_count}</div>
                    </div>
                  </div>
                  {(summary.q1_count + summary.q3_count) === summary.high_violation_count ? (
                    <div className="flex items-center gap-2 mt-4 text-[#39FF14] font-semibold text-sm">
                      <CheckCircle2 className="w-4 h-4" /> Verified — violation split is consistent
                    </div>
                  ) : (
                    <div className="flex items-center gap-2 mt-4 text-red-500 font-semibold text-sm">
                      <XCircle className="w-4 h-4" /> Mismatch detected
                    </div>
                  )}
                </Card>

                <Card className="p-6 border-black/5 shadow-lg shadow-black/5 bg-[#FDFBF7] text-black">
                  <h3 className="font-bold text-lg mb-4">Q1 + Q2 = High Impact Count</h3>
                  <div className="flex items-center gap-4">
                    <div className="bg-white border border-black/5 rounded-xl p-4 flex-1 text-center">
                      <div className="text-xs text-neutral-900 mb-1">Q1 + Q2</div>
                      <div className="text-3xl font-black">{summary.q1_count + summary.q2_count}</div>
                    </div>
                    <div className="text-2xl text-neutral-900 font-bold">=</div>
                    <div className="bg-white border border-black/5 rounded-xl p-4 flex-1 text-center">
                      <div className="text-xs text-neutral-900 mb-1">High Impact</div>
                      <div className="text-3xl font-black">{summary.high_impact_count}</div>
                    </div>
                  </div>
                  {(summary.q1_count + summary.q2_count) === summary.high_impact_count ? (
                    <div className="flex items-center gap-2 mt-4 text-[#39FF14] font-semibold text-sm">
                      <CheckCircle2 className="w-4 h-4" /> Verified — impact split is consistent
                    </div>
                  ) : (
                    <div className="flex items-center gap-2 mt-4 text-red-500 font-semibold text-sm">
                      <XCircle className="w-4 h-4" /> Mismatch detected
                    </div>
                  )}
                </Card>

                <Card className="p-6 border-black/5 shadow-lg shadow-black/5 bg-[#FDFBF7] text-black">
                  <h3 className="font-bold text-lg mb-4">High Violation &ge; High Impact</h3>
                  <div className="flex items-center gap-4">
                    <div className="bg-white border border-black/5 rounded-xl p-4 flex-1 text-center">
                      <div className="text-xs text-neutral-900 mb-1">High Violation</div>
                      <div className="text-3xl font-black">{summary.high_violation_count}</div>
                    </div>
                    <div className="text-2xl text-neutral-900 font-bold">&ge;</div>
                    <div className="bg-white border border-black/5 rounded-xl p-4 flex-1 text-center">
                      <div className="text-xs text-neutral-900 mb-1">High Impact</div>
                      <div className="text-3xl font-black">{summary.high_impact_count}</div>
                    </div>
                  </div>
                  {summary.high_violation_count >= summary.high_impact_count ? (
                    <div className="flex items-center gap-2 mt-4 text-[#39FF14] font-semibold text-sm">
                      <CheckCircle2 className="w-4 h-4" /> Verified — high violation &ge; high impact (mathematically sound)
                    </div>
                  ) : (
                    <div className="flex items-center gap-2 mt-4 text-red-500 font-semibold text-sm">
                      <XCircle className="w-4 h-4" /> Unexpected inequality
                    </div>
                  )}
                </Card>
              </div>
            </motion.div>
          </div>
        </section>
      )}

      {/* CTA */}
      <section className="bg-black text-white py-24 text-center px-6 relative overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_bottom,_var(--tw-gradient-stops))] from-neutral-900 via-black to-black" />
        <div className="relative z-10 max-w-3xl mx-auto">
          <h2 className="text-5xl font-bold tracking-tight mb-6">Trust, but verify</h2>
          <p className="text-xl text-neutral-400 mb-10">Deploy with confidence. Every formula, every computation is open for inspection.</p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Button 
              onClick={() => router.push("/methodology")}
              size="lg" 
              className="bg-[#39FF14] text-black hover:bg-[#32e011] rounded-full px-10 h-16 text-lg font-bold shadow-[0_0_40px_rgba(57,255,20,0.4)] transition-all hover:scale-105"
            >
              View Methodology <ArrowRight className="ml-2 w-6 h-6" />
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
