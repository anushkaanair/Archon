import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  LayoutGrid, Cpu, DollarSign, Star, ArrowRight,
  AlertCircle, Download, Clock, TrendingUp, Zap,
  FileJson, ExternalLink,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';

// ─── Tiny sparkline component ──────────────────────────────────────────────────
function MiniBar({ value, max }: { value: number; max: number }) {
  const pct = max > 0 ? (value / max) * 100 : 0;
  return (
    <div className="w-12 h-1 rounded-full bg-white/[0.06] overflow-hidden">
      <div className="h-full rounded-full bg-archon-core/50" style={{ width: `${pct}%` }} />
    </div>
  );
}

// ─── Stat card ────────────────────────────────────────────────────────────────
function StatCard({ title, value, sub, icon: Icon, trend, loading, accent = 'purple' }: {
  title: string; value: string | number | null; sub?: string; icon: any;
  trend?: string; loading: boolean; accent?: 'purple' | 'green' | 'blue' | 'amber';
}) {
  const colors: Record<string, { bg: string; text: string; border: string }> = {
    purple: { bg: 'rgba(83,74,183,0.1)',  text: '#AFA9EC', border: 'rgba(83,74,183,0.2)' },
    green:  { bg: 'rgba(93,202,165,0.1)', text: '#5DCAA5', border: 'rgba(93,202,165,0.2)' },
    blue:   { bg: 'rgba(133,183,235,0.1)',text: '#85B7EB', border: 'rgba(133,183,235,0.2)' },
    amber:  { bg: 'rgba(239,159,39,0.1)', text: '#EF9F27', border: 'rgba(239,159,39,0.2)' },
  };
  const c = colors[accent];

  return (
    <div className="stat-card">
      {/* Icon */}
      <div className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0"
        style={{ background: c.bg, border: `0.5px solid ${c.border}` }}>
        <Icon className="w-4 h-4" style={{ color: c.text }} strokeWidth={1.75} />
      </div>
      <div className="min-w-0 flex-1">
        <p className="text-[10px] font-semibold uppercase tracking-widest text-white/30 mb-1">{title}</p>
        {loading ? (
          <div className="h-7 w-20 shimmer rounded-md" />
        ) : (
          <p className="text-[22px] font-bold text-white leading-none tracking-tight">{value ?? '—'}</p>
        )}
        <div className="flex items-center gap-2 mt-1">
          {sub && <p className="text-[11px] text-white/30">{sub}</p>}
          {trend && <span className="text-[10px] font-semibold text-emerald-400/80 flex items-center gap-0.5">
            <TrendingUp className="w-2.5 h-2.5" />{trend}
          </span>}
        </div>
      </div>
    </div>
  );
}

// ─── Confidence badge ─────────────────────────────────────────────────────────
const ConfidenceBadge = ({ flag }: { flag: string | null }) =>
  !flag || flag === 'normal'
    ? <span className="badge-green">✓ Normal</span>
    : <span className="badge-amber">⚠ Low</span>;

// ─── Score chip ───────────────────────────────────────────────────────────────
function ScoreChip({ score }: { score: number | null }) {
  if (score == null) return <span className="text-white/20 text-[11px] font-mono">—</span>;
  const cls = score >= 0.7 ? 'text-emerald-400 bg-emerald-400/10 ring-emerald-400/20'
    : score >= 0.4          ? 'text-amber-400  bg-amber-400/10  ring-amber-400/20'
                            : 'text-red-400    bg-red-400/10    ring-red-400/20';
  return <span className={`score-chip ${cls}`}>{score.toFixed(2)}</span>;
}

// ─── Main ─────────────────────────────────────────────────────────────────────
export default function Dashboard() {
  const { token } = useAuth();
  const apiKey = token || 'arch_test_key_dev';
  const headers = { Authorization: `Bearer ${apiKey}` };

  const [stats, setStats]         = useState<any>(null);
  const [blueprints, setBlueprints] = useState<any[]>([]);
  const [statsLoading, setStatsLoading] = useState(true);
  const [bpLoading, setBpLoading] = useState(true);
  const [error, setError]         = useState('');

  useEffect(() => {
    fetch('/v1/dashboard/stats', { headers })
      .then(r => r.json()).then(d => { setStats(d); setStatsLoading(false); })
      .catch(() => setStatsLoading(false));

    fetch('/v1/blueprints?limit=10', { headers })
      .then(r => r.json()).then(d => { setBlueprints(d.items || []); setBpLoading(false); })
      .catch(() => { setError('Failed to load blueprints.'); setBpLoading(false); });
  }, []);

  const downloadBlueprint = async (id: string) => {
    const res  = await fetch(`/v1/blueprints/${id}`, { headers });
    const data = await res.json();
    const a = Object.assign(document.createElement('a'), {
      href: URL.createObjectURL(new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' })),
      download: `archon-blueprint-${id.slice(0, 8)}.json`,
    });
    a.click();
  };

  const fmt = (iso: string | null) => {
    if (!iso) return '—';
    return new Date(iso).toLocaleDateString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
  };

  return (
    <div className="space-y-8 animate-in">

      {/* ── Header ── */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-white">Dashboard</h1>
        <p className="text-[13px] text-white/35 mt-1">Real-time metrics from your blueprint history.</p>
      </div>

      {/* ── Stat Cards ── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard title="Blueprints"       value={stats?.total_blueprints ?? null}    icon={LayoutGrid}  loading={statsLoading} accent="purple" />
        <StatCard title="Models Evaluated" value={stats?.models_evaluated ?? null}    icon={Cpu}        sub="scored" loading={statsLoading} accent="blue"   />
        <StatCard title="Avg Quality"      value={stats?.avg_eval_score != null ? stats.avg_eval_score.toFixed(2) : null} sub="RAGAs composite" icon={Star} loading={statsLoading} accent="amber"  />
        <StatCard title="Est. Monthly Cost" value={stats?.total_estimated_monthly_cost_usd != null ? `$${stats.total_estimated_monthly_cost_usd.toFixed(2)}` : null} sub="all blueprints" icon={DollarSign} loading={statsLoading} accent="green"  />
      </div>

      {/* ── Error ── */}
      {error && (
        <div className="flex items-center gap-3 rounded-xl px-5 py-4 text-[13px]"
          style={{ background: 'rgba(240,149,149,0.08)', border: '0.5px solid rgba(240,149,149,0.2)', color: '#F09595' }}>
          <AlertCircle className="w-4 h-4 flex-shrink-0" />{error}
        </div>
      )}

      {/* ── Blueprint Table ── */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Clock className="w-4 h-4 text-white/25" strokeWidth={1.5} />
            <h2 className="text-[14px] font-semibold text-white">Recent Blueprints</h2>
            {!bpLoading && blueprints.length > 0 && (
              <span className="badge-purple">{blueprints.length}</span>
            )}
          </div>
          <Link to="/builder" className="flex items-center gap-1.5 text-[12px] text-archon-mist/70 hover:text-archon-mist transition-colors">
            New Blueprint <ArrowRight className="w-3 h-3" />
          </Link>
        </div>

        {bpLoading ? (
          <div className="space-y-2">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="h-[60px] shimmer rounded-xl" />
            ))}
          </div>
        ) : blueprints.length === 0 ? (
          <div className="rounded-2xl px-8 py-16 text-center flex flex-col items-center"
            style={{ background: 'rgba(255,255,255,0.02)', border: '0.5px solid rgba(255,255,255,0.06)' }}>
            <div className="w-12 h-12 rounded-2xl flex items-center justify-center mb-4"
              style={{ background: 'rgba(83,74,183,0.1)', border: '0.5px solid rgba(83,74,183,0.2)' }}>
              <FileJson className="w-6 h-6 text-archon-core/60" strokeWidth={1.5} />
            </div>
            <p className="text-[14px] font-medium text-white/50 mb-1">No blueprints yet</p>
            <p className="text-[12px] text-white/25 mb-5">Generate your first AI architecture blueprint to see it here.</p>
            <Link to="/builder" className="btn-primary h-9 px-5 text-[13px]">
              Generate Blueprint <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        ) : (
          <div className="rounded-2xl overflow-hidden"
            style={{ background: 'rgba(255,255,255,0.018)', border: '0.5px solid rgba(255,255,255,0.06)' }}>
            {/* Table header */}
            <div className="grid grid-cols-12 px-5 py-3 text-[10px] font-semibold uppercase tracking-widest text-white/25"
              style={{ borderBottom: '0.5px solid rgba(255,255,255,0.05)', background: 'rgba(255,255,255,0.02)' }}>
              <div className="col-span-5">Description</div>
              <div className="col-span-1 text-center">Models</div>
              <div className="col-span-2 text-right">Monthly</div>
              <div className="col-span-1 text-center">P95</div>
              <div className="col-span-1 text-center">Score</div>
              <div className="col-span-2 text-right">Actions</div>
            </div>

            {/* Rows */}
            <div>
              {blueprints.map((bp, i) => (
                <motion.div
                  key={bp.blueprint_id}
                  initial={{ opacity: 0, y: 6 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.05 }}
                  className="grid grid-cols-12 px-5 py-4 items-center hover:bg-white/[0.025] transition-colors group"
                  style={{ borderTop: i > 0 ? '0.5px solid rgba(255,255,255,0.04)' : 'none' }}
                >
                  {/* Description */}
                  <div className="col-span-5 pr-4 min-w-0">
                    <p className="text-[13px] font-medium text-white/80 group-hover:text-white transition-colors truncate">
                      {bp.input_text || '(no description)'}
                    </p>
                    <p className="text-[11px] text-white/25 mt-0.5 flex items-center gap-1">
                      <Clock className="w-2.5 h-2.5 flex-shrink-0" />{fmt(bp.created_at)}
                    </p>
                  </div>

                  {/* Model count */}
                  <div className="col-span-1 text-center text-[13px] font-mono text-white/40">
                    {bp.model_count ?? '—'}
                  </div>

                  {/* Cost */}
                  <div className="col-span-2 text-right font-mono text-[13px]">
                    {bp.total_monthly_cost_usd > 0
                      ? <span className="text-emerald-400/80">${bp.total_monthly_cost_usd.toFixed(2)}</span>
                      : <span className="text-white/20">—</span>}
                  </div>

                  {/* P95 */}
                  <div className="col-span-1 text-center font-mono text-[11px] text-white/35">
                    {bp.total_p95_ms > 0 ? `${bp.total_p95_ms}ms` : '—'}
                  </div>

                  {/* Score */}
                  <div className="col-span-1 flex justify-center items-center gap-2">
                    <ScoreChip score={bp.eval_score} />
                  </div>

                  {/* Actions */}
                  <div className="col-span-2 flex items-center justify-end gap-1">
                    <ConfidenceBadge flag={bp.confidence_flag} />
                    <Link
                      to={`/blueprints/${bp.blueprint_id}`}
                      className="p-1.5 rounded-lg transition-colors text-white/25 hover:text-archon-mist hover:bg-archon-core/10"
                      title="View Blueprint"
                    >
                      <ExternalLink className="w-3.5 h-3.5" />
                    </Link>
                    <button
                      onClick={() => downloadBlueprint(bp.blueprint_id)}
                      className="p-1.5 rounded-lg transition-colors text-white/25 hover:text-white hover:bg-white/[0.06]"
                      title="Download JSON"
                    >
                      <Download className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* ── Quick Start tiles (when empty) ── */}
      {!bpLoading && blueprints.length === 0 && (
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-widest text-white/20 mb-3">Start with a template</p>
          <div className="grid grid-cols-2 gap-3">
            {[
              { title: 'Legal Q&A Bot',         desc: 'RAG + citation tracking',         tag: 'RAG' },
              { title: 'Code Review AI',         desc: 'Security & quality analysis',      tag: 'Code' },
              { title: 'Customer Support Bot',   desc: 'Multi-channel conversational AI',  tag: 'Chat' },
              { title: 'Data Analysis Pipeline', desc: 'ETL + LLM-powered insights',        tag: 'Data' },
            ].map((ex) => (
              <Link key={ex.title} to="/builder"
                className="group flex items-center justify-between px-4 py-3.5 rounded-xl transition-all"
                style={{ background: 'rgba(255,255,255,0.02)', border: '0.5px solid rgba(255,255,255,0.06)' }}
                onMouseEnter={e => { (e.currentTarget as HTMLElement).style.borderColor = 'rgba(83,74,183,0.3)'; }}
                onMouseLeave={e => { (e.currentTarget as HTMLElement).style.borderColor = 'rgba(255,255,255,0.06)'; }}
              >
                <div>
                  <div className="flex items-center gap-2 mb-0.5">
                    <span className="text-[13px] font-semibold text-white/70 group-hover:text-white transition-colors">{ex.title}</span>
                    <span className="badge-purple text-[9px]">{ex.tag}</span>
                  </div>
                  <p className="text-[11px] text-white/25">{ex.desc}</p>
                </div>
                <ArrowRight className="w-4 h-4 text-white/15 group-hover:text-archon-mist transition-all group-hover:translate-x-0.5" />
              </Link>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
