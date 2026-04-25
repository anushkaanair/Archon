import { useEffect, useState } from 'react';
import { BarChart3, Zap, TrendingUp, Loader2, DollarSign, Star } from 'lucide-react';
import { motion } from 'framer-motion';
import { useAuth } from '../context/AuthContext';

interface BlueprintItem {
  blueprint_id: string;
  model_count: number;
  total_monthly_cost_usd: number;
  total_p95_ms: number;
  eval_score: number | null;
  created_at: string | null;
}

interface Stats {
  total_blueprints: number;
  avg_eval_score: number | null;
  total_estimated_monthly_cost_usd: number;
  models_evaluated: number;
}

function Bar({ value, max, label, sub }: { value: number; max: number; label: string; sub: string }) {
  const pct = max > 0 ? Math.max((value / max) * 100, 3) : 3;
  return (
    <div className="flex items-center gap-3">
      <div className="w-20 flex-shrink-0 text-right">
        <p className="text-[11px] text-white/45 truncate">{label}</p>
      </div>
      <div className="flex-1 h-5 rounded-lg overflow-hidden" style={{ background: 'rgba(255,255,255,0.04)' }}>
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${pct}%` }}
          transition={{ duration: 0.7, ease: 'easeOut' }}
          className="h-full rounded-lg"
          style={{ background: 'linear-gradient(90deg, #5B00E8, #C4A0FF)', boxShadow: '0 0 8px rgba(91,0,232,0.4)' }}
        />
      </div>
      <span className="w-14 text-right text-[11px] font-mono text-white/40 flex-shrink-0">{sub}</span>
    </div>
  );
}

export default function Analytics() {
  const { token } = useAuth();
  const headers = { Authorization: `Bearer ${token || ''}` };

  const [stats, setStats]     = useState<Stats | null>(null);
  const [blueprints, setBps]  = useState<BlueprintItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      fetch('/v1/dashboard/stats', { headers }).then(r => r.json()),
      fetch('/v1/blueprints?limit=20', { headers }).then(r => r.json()),
    ]).then(([s, b]) => { setStats(s); setBps(b.items || []); setLoading(false); })
      .catch(() => setLoading(false));
  }, []);

  const costBars  = blueprints.slice(0, 6);
  const maxCost   = Math.max(...costBars.map(b => b.total_monthly_cost_usd ?? 0), 1);

  const withLatency = blueprints.filter(b => b.total_p95_ms > 0);
  const fast  = withLatency.filter(b => b.total_p95_ms < 1000).length;
  const mid   = withLatency.filter(b => b.total_p95_ms >= 1000 && b.total_p95_ms < 3000).length;
  const slow  = withLatency.filter(b => b.total_p95_ms >= 3000).length;
  const latTotal = withLatency.length || 1;

  const scored     = blueprints.filter(b => b.eval_score != null);
  const highConf   = scored.filter(b => b.eval_score! >= 0.7).length;
  const midConf    = scored.filter(b => b.eval_score! >= 0.4 && b.eval_score! < 0.7).length;
  const lowConf    = scored.filter(b => b.eval_score! < 0.4).length;
  const scoreTotal = scored.length || 1;

  const avgCost = blueprints.length > 0
    ? blueprints.reduce((s, b) => s + (b.total_monthly_cost_usd ?? 0), 0) / blueprints.length
    : 0;

  return (
    <div className="space-y-8 animate-in">

      {/* ── Header ── */}
      <div className="relative rounded-2xl overflow-hidden px-8 py-8 bg-grid-dark"
        style={{ background: 'rgba(59,130,246,0.03)', border: '0.5px solid rgba(59,130,246,0.12)' }}>
        <div className="absolute top-0 right-1/4 w-80 h-32 pointer-events-none"
          style={{ background: 'radial-gradient(ellipse, rgba(91,0,232,0.18) 0%, transparent 70%)' }} />
        <div className="relative">
          <div className="flex items-center gap-2 mb-3">
            <div className="w-7 h-7 rounded-lg flex items-center justify-center"
              style={{ background: 'rgba(59,130,246,0.15)', border: '0.5px solid rgba(59,130,246,0.25)' }}>
              <BarChart3 className="w-3.5 h-3.5 text-blue-400" />
            </div>
            <span className="text-[10px] font-bold uppercase tracking-[0.15em] text-blue-400/70">Insights</span>
          </div>
          <h1 className="font-display text-[28px] font-extrabold tracking-tight text-white mb-2">Analytics</h1>
          <p className="text-[13px] text-white/40">Cost, latency, and quality trends across your blueprints.</p>
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="w-6 h-6 text-archon-mist animate-spin" />
        </div>
      ) : (
        <>
          {/* ── Summary cards ── */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
            {[
              { label: 'Total Blueprints',     value: String(stats?.total_blueprints ?? 0), icon: BarChart3,  color: '#8B3DFF' },
              { label: 'Models Evaluated',     value: String(stats?.models_evaluated ?? 0), icon: TrendingUp, color: '#3B82F6' },
              { label: 'Avg Cost / Blueprint', value: `$${avgCost.toFixed(2)}`,              icon: DollarSign, color: '#00A854' },
              { label: 'Avg Quality Score',    value: stats?.avg_eval_score != null ? stats.avg_eval_score.toFixed(3) : 'N/A', icon: Star, color: '#D97706' },
            ].map(({ label, value, icon: Icon, color }) => (
              <div key={label} className="rounded-2xl p-4 flex items-center gap-3 transition-all"
                style={{ background: 'rgba(255,255,255,0.02)', border: '0.5px solid rgba(255,255,255,0.07)' }}
                onMouseEnter={e => { (e.currentTarget as HTMLElement).style.borderColor = `${color}30`; }}
                onMouseLeave={e => { (e.currentTarget as HTMLElement).style.borderColor = 'rgba(255,255,255,0.07)'; }}
              >
                <div className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0"
                  style={{ background: `${color}15`, border: `0.5px solid ${color}30` }}>
                  <Icon className="w-4 h-4" style={{ color }} strokeWidth={1.75} />
                </div>
                <div className="min-w-0">
                  <p className="text-[10px] text-white/30 uppercase tracking-wider truncate mb-0.5">{label}</p>
                  <p className="text-[18px] font-bold text-white leading-none">{value}</p>
                </div>
              </div>
            ))}
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

            {/* ── Cost per blueprint ── */}
            <div className="rounded-2xl p-6"
              style={{ background: 'rgba(255,255,255,0.018)', border: '0.5px solid rgba(255,255,255,0.07)' }}>
              <div className="flex items-center gap-2 mb-5">
                <div className="w-7 h-7 rounded-lg flex items-center justify-center"
                  style={{ background: 'rgba(0,168,84,0.12)', border: '0.5px solid rgba(0,168,84,0.2)' }}>
                  <DollarSign className="w-3.5 h-3.5 text-emerald-400" strokeWidth={1.5} />
                </div>
                <h2 className="text-[14px] font-semibold text-white">Cost by Blueprint</h2>
                <span className="text-[11px] text-white/25 ml-auto">6 most recent</span>
              </div>
              {costBars.length === 0 ? (
                <p className="text-[13px] text-white/25 py-6 text-center">No blueprints yet.</p>
              ) : (
                <div className="space-y-3">
                  {costBars.map((b, i) => (
                    <Bar key={b.blueprint_id} value={b.total_monthly_cost_usd ?? 0} max={maxCost}
                      label={`Blueprint ${i + 1}`}
                      sub={b.total_monthly_cost_usd > 0 ? `$${b.total_monthly_cost_usd.toFixed(2)}` : '—'} />
                  ))}
                </div>
              )}
            </div>

            {/* ── Latency + Score ── */}
            <div className="space-y-4">

              {/* Latency distribution */}
              <div className="rounded-2xl p-5"
                style={{ background: 'rgba(255,255,255,0.018)', border: '0.5px solid rgba(255,255,255,0.07)' }}>
                <div className="flex items-center gap-2 mb-4">
                  <div className="w-7 h-7 rounded-lg flex items-center justify-center"
                    style={{ background: 'rgba(59,130,246,0.12)', border: '0.5px solid rgba(59,130,246,0.2)' }}>
                    <Zap className="w-3.5 h-3.5 text-blue-400" strokeWidth={1.5} />
                  </div>
                  <h2 className="text-[14px] font-semibold text-white">P95 Latency</h2>
                </div>
                {withLatency.length === 0 ? (
                  <p className="text-[12px] text-white/25">No latency data yet.</p>
                ) : (
                  <div className="space-y-3">
                    {[
                      { label: 'Fast  <1s',  count: fast, color: '#00A854' },
                      { label: 'Mid  1–3s',  count: mid,  color: '#3B82F6' },
                      { label: 'Slow  >3s',  count: slow, color: '#D97706' },
                    ].map(({ label, count, color }) => {
                      const pct = Math.round((count / latTotal) * 100);
                      return (
                        <div key={label}>
                          <div className="flex justify-between text-[11px] mb-1.5">
                            <span style={{ color: `${color}cc` }}>{label}</span>
                            <span className="text-white/40 font-mono">{pct}%</span>
                          </div>
                          <div className="w-full rounded-full h-1.5" style={{ background: 'rgba(255,255,255,0.06)' }}>
                            <motion.div initial={{ width: 0 }} animate={{ width: `${pct}%` }} transition={{ duration: 0.7 }}
                              className="h-1.5 rounded-full" style={{ background: color, boxShadow: `0 0 6px ${color}60` }} />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* Score distribution */}
              <div className="rounded-2xl p-5"
                style={{ background: 'rgba(255,255,255,0.018)', border: '0.5px solid rgba(255,255,255,0.07)' }}>
                <div className="flex items-center gap-2 mb-4">
                  <div className="w-7 h-7 rounded-lg flex items-center justify-center"
                    style={{ background: 'rgba(217,119,6,0.12)', border: '0.5px solid rgba(217,119,6,0.2)' }}>
                    <Star className="w-3.5 h-3.5 text-amber-400" strokeWidth={1.5} />
                  </div>
                  <h2 className="text-[14px] font-semibold text-white">RAGAs Score Distribution</h2>
                </div>
                {scored.length === 0 ? (
                  <p className="text-[12px] text-white/25">No scored blueprints yet. Add an LLM API key to enable evaluation.</p>
                ) : (
                  <div className="space-y-3">
                    {[
                      { label: 'High  ≥0.7',   count: highConf, color: '#00A854' },
                      { label: 'Mid  0.4–0.7', count: midConf,  color: '#D97706' },
                      { label: 'Low  <0.4',    count: lowConf,  color: '#EF4444' },
                    ].map(({ label, count, color }) => {
                      const pct = Math.round((count / scoreTotal) * 100);
                      return (
                        <div key={label}>
                          <div className="flex justify-between text-[11px] mb-1.5">
                            <span style={{ color: `${color}cc` }}>{label}</span>
                            <span className="text-white/40 font-mono">{count} blueprint{count !== 1 ? 's' : ''}</span>
                          </div>
                          <div className="w-full rounded-full h-1.5" style={{ background: 'rgba(255,255,255,0.06)' }}>
                            <motion.div initial={{ width: 0 }} animate={{ width: `${pct}%` }} transition={{ duration: 0.7 }}
                              className="h-1.5 rounded-full" style={{ background: color, boxShadow: `0 0 6px ${color}60` }} />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* ── Breakdown table ── */}
          {blueprints.length > 0 && (
            <div className="rounded-2xl overflow-hidden"
              style={{ background: 'rgba(255,255,255,0.018)', border: '0.5px solid rgba(255,255,255,0.07)' }}>
              <div className="px-5 py-4" style={{ borderBottom: '0.5px solid rgba(255,255,255,0.06)' }}>
                <h2 className="text-[14px] font-semibold text-white">Per-Blueprint Breakdown</h2>
              </div>
              <div>
                <div className="grid grid-cols-4 px-5 py-2.5 text-[10px] font-semibold uppercase tracking-wider text-white/25"
                  style={{ borderBottom: '0.5px solid rgba(255,255,255,0.05)', background: 'rgba(255,255,255,0.01)' }}>
                  <span>#</span><span>Monthly Cost</span><span>P95 Latency</span><span className="text-right">Score</span>
                </div>
                {blueprints.slice(0, 8).map((bp, i) => (
                  <div key={bp.blueprint_id} className="grid grid-cols-4 px-5 py-3 text-[12px] hover:bg-white/[0.015] transition-colors"
                    style={{ borderTop: '0.5px solid rgba(255,255,255,0.04)' }}>
                    <div className="text-white/40 font-mono">#{i + 1}</div>
                    <div>
                      {bp.total_monthly_cost_usd > 0
                        ? <span style={{ color: '#00A854' }}>${bp.total_monthly_cost_usd.toFixed(2)}/mo</span>
                        : <span className="text-white/20">—</span>}
                    </div>
                    <div className="text-white/40">
                      {bp.total_p95_ms > 0 ? `${bp.total_p95_ms}ms` : '—'}
                    </div>
                    <div className="text-right">
                      {bp.eval_score != null
                        ? <span className={`font-mono ${bp.eval_score >= 0.7 ? 'text-emerald-400' : bp.eval_score >= 0.4 ? 'text-amber-400' : 'text-red-400'}`}>
                            {bp.eval_score.toFixed(3)}
                          </span>
                        : <span className="text-white/20 text-[11px]">not scored</span>}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
