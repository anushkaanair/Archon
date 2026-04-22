import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  LayoutGrid, Cpu, DollarSign, Star, ArrowRight,
  AlertCircle, Download, Clock, ExternalLink,
  FileJson, Newspaper, ExternalLink as LinkIcon, Zap, TrendingUp,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import newsData from '../data/ai-news.json';

/* ─── Types ─────────────────────────────────────────────────────────────────── */
interface NewsItem {
  id: string; date: string; title: string; summary: string;
  type: 'model_release' | 'price_change' | 'collab' | 'research' | 'update';
  provider?: string | null; model_id?: string | null; link?: string | null;
}

/* ─── News feed ──────────────────────────────────────────────────────────────── */
const TYPE_META: Record<string, { color: string; label: string }> = {
  model_release: { color: '#8B3DFF', label: 'Model'    },
  price_change:  { color: '#00A854', label: 'Pricing'  },
  collab:        { color: '#3B82F6', label: 'Collab'   },
  research:      { color: '#D97706', label: 'Research' },
  update:        { color: '#6B7280', label: 'Update'   },
};

function isNew(d: string) { return Date.now() - new Date(d).getTime() < 7 * 864e5; }

function NewsFeed() {
  const sorted = [...(newsData as NewsItem[])].sort((a, b) => +new Date(b.date) - +new Date(a.date));
  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center gap-2 mb-4">
        <Newspaper className="w-3.5 h-3.5 text-white/40" strokeWidth={1.5} />
        <span className="text-[13px] font-semibold text-white/80">AI News</span>
        <span className="ml-auto text-[9px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full"
          style={{ background: 'rgba(0,168,84,0.12)', color: '#00A854', border: '0.5px solid rgba(0,168,84,0.25)' }}>
          Live
        </span>
      </div>
      <div className="flex-1 overflow-y-auto space-y-2 pr-0.5" style={{ maxHeight: 'calc(100vh - 200px)' }}>
        {sorted.map(item => {
          const m = TYPE_META[item.type] ?? TYPE_META.update;
          return (
            <div key={item.id} className="group rounded-xl p-3 cursor-default transition-all"
              style={{ background: 'rgba(255,255,255,0.02)', border: '0.5px solid rgba(255,255,255,0.05)' }}
              onMouseEnter={e => { (e.currentTarget as HTMLElement).style.borderColor = `${m.color}30`; (e.currentTarget as HTMLElement).style.background = 'rgba(255,255,255,0.035)'; }}
              onMouseLeave={e => { (e.currentTarget as HTMLElement).style.borderColor = 'rgba(255,255,255,0.05)'; (e.currentTarget as HTMLElement).style.background = 'rgba(255,255,255,0.02)'; }}
            >
              <div className="flex items-center gap-1.5 mb-1.5 flex-wrap">
                <span className="text-[9px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded"
                  style={{ background: `${m.color}18`, color: m.color }}>
                  {m.label}
                </span>
                {isNew(item.date) && (
                  <span className="text-[9px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded"
                    style={{ background: 'rgba(91,0,232,0.15)', color: '#C4A0FF' }}>
                    New
                  </span>
                )}
                <span className="text-[10px] text-white/20 ml-auto">
                  {new Date(item.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                </span>
              </div>
              <p className="text-[12px] font-semibold text-white/80 leading-snug mb-1">{item.title}</p>
              <p className="text-[11px] text-white/30 leading-relaxed line-clamp-2">{item.summary}</p>
              {item.link && (
                <a href={item.link} target="_blank" rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 mt-1.5 text-[10px] font-medium transition-opacity hover:opacity-70"
                  style={{ color: m.color }}>
                  Read more <LinkIcon className="w-2.5 h-2.5" />
                </a>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

/* ─── Stat card ─────────────────────────────────────────────────────────────── */
function StatCard({ title, value, sub, icon: Icon, loading, color }: {
  title: string; value: string | number | null; sub?: string;
  icon: any; loading: boolean; color: string;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
      className="relative rounded-2xl p-5 overflow-hidden group transition-all cursor-default"
      style={{ background: 'rgba(255,255,255,0.025)', border: '0.5px solid rgba(255,255,255,0.07)' }}
      onMouseEnter={e => { (e.currentTarget as HTMLElement).style.borderColor = `${color}35`; (e.currentTarget as HTMLElement).style.boxShadow = `0 0 24px ${color}12`; }}
      onMouseLeave={e => { (e.currentTarget as HTMLElement).style.borderColor = 'rgba(255,255,255,0.07)'; (e.currentTarget as HTMLElement).style.boxShadow = 'none'; }}
    >
      {/* Subtle bg glow */}
      <div className="absolute top-0 right-0 w-20 h-20 rounded-full pointer-events-none"
        style={{ background: `radial-gradient(circle, ${color}12 0%, transparent 70%)`, transform: 'translate(30%, -30%)' }} />
      <div className="relative">
        <div className="flex items-center justify-between mb-4">
          <p className="text-[10px] font-bold uppercase tracking-[0.15em] text-white/30">{title}</p>
          <div className="w-8 h-8 rounded-xl flex items-center justify-center"
            style={{ background: `${color}18`, border: `0.5px solid ${color}30` }}>
            <Icon className="w-3.5 h-3.5" style={{ color }} strokeWidth={1.75} />
          </div>
        </div>
        {loading
          ? <div className="h-8 w-24 shimmer rounded-lg mb-1" />
          : <p className="text-[26px] font-extrabold text-white leading-none tracking-tight font-display mb-1">
              {value ?? '—'}
            </p>
        }
        {sub && <p className="text-[11px] text-white/30">{sub}</p>}
      </div>
    </motion.div>
  );
}

/* ─── Score chip ─────────────────────────────────────────────────────────────── */
function ScoreChip({ score }: { score: number | null }) {
  if (score == null) return <span className="text-white/20 text-[11px] font-mono">—</span>;
  const [c, bg] = score >= 0.7 ? ['#00A854', 'rgba(0,168,84,0.1)'] : score >= 0.4 ? ['#D97706', 'rgba(217,119,6,0.1)'] : ['#EF4444', 'rgba(239,68,68,0.1)'];
  return <span className="text-[11px] font-mono px-2 py-0.5 rounded-md" style={{ color: c, background: bg }}>{score.toFixed(2)}</span>;
}

/* ─── Empty state ────────────────────────────────────────────────────────────── */
const EMPTY_EXAMPLES = [
  { title: 'Legal Q&A Bot',        desc: 'RAG + citation tracking',        tag: 'RAG'  },
  { title: 'Code Review AI',       desc: 'Security & quality analysis',    tag: 'Code' },
  { title: 'Customer Support Bot', desc: 'Multi-channel conversational AI',tag: 'Chat' },
  { title: 'Data Pipeline',        desc: 'ETL + LLM-powered insights',     tag: 'Data' },
];

function EmptyState() {
  return (
    <div className="space-y-5">
      <div className="rounded-2xl px-8 py-14 text-center flex flex-col items-center"
        style={{ background: 'rgba(91,0,232,0.04)', border: '0.5px solid rgba(91,0,232,0.12)' }}>
        <div className="w-14 h-14 rounded-2xl flex items-center justify-center mb-5"
          style={{ background: 'rgba(91,0,232,0.12)', border: '0.5px solid rgba(91,0,232,0.25)' }}>
          <FileJson className="w-7 h-7" style={{ color: '#8B3DFF' }} strokeWidth={1.5} />
        </div>
        <p className="font-display text-[18px] font-bold text-white mb-2">No blueprints yet</p>
        <p className="text-[13px] text-white/35 mb-6 max-w-xs leading-relaxed">
          Generate your first AI architecture blueprint to see it here.
        </p>
        <Link to="/blueprint" className="btn-primary h-10 px-6 text-[13px]">
          Generate Blueprint <ArrowRight className="w-4 h-4" />
        </Link>
      </div>

      <div>
        <p className="text-[10px] font-bold uppercase tracking-[0.15em] text-white/25 mb-3">Try a template</p>
        <div className="grid grid-cols-2 gap-2">
          {EMPTY_EXAMPLES.map(ex => (
            <Link key={ex.title} to="/blueprint"
              className="group flex items-start justify-between px-4 py-3.5 rounded-xl transition-all"
              style={{ background: 'rgba(255,255,255,0.02)', border: '0.5px solid rgba(255,255,255,0.06)' }}
              onMouseEnter={e => { (e.currentTarget as HTMLAnchorElement).style.borderColor = 'rgba(91,0,232,0.3)'; (e.currentTarget as HTMLAnchorElement).style.background = 'rgba(91,0,232,0.06)'; }}
              onMouseLeave={e => { (e.currentTarget as HTMLAnchorElement).style.borderColor = 'rgba(255,255,255,0.06)'; (e.currentTarget as HTMLAnchorElement).style.background = 'rgba(255,255,255,0.02)'; }}
            >
              <div>
                <div className="flex items-center gap-2 mb-0.5">
                  <span className="text-[13px] font-semibold text-white/70 group-hover:text-white transition-colors">{ex.title}</span>
                  <span className="badge-purple text-[9px]">{ex.tag}</span>
                </div>
                <p className="text-[11px] text-white/25">{ex.desc}</p>
              </div>
              <ArrowRight className="w-4 h-4 text-white/15 group-hover:text-archon-mist transition-all mt-0.5 flex-shrink-0 group-hover:translate-x-0.5" />
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}

/* ─── Main ────────────────────────────────────────────────────────────────────── */
export default function Dashboard() {
  const { token, user } = useAuth();
  const headers = { Authorization: `Bearer ${token || ''}` };

  const [stats, setStats]               = useState<any>(null);
  const [blueprints, setBlueprints]     = useState<any[]>([]);
  const [statsLoading, setStatsLoading] = useState(true);
  const [bpLoading, setBpLoading]       = useState(true);
  const [error, setError]               = useState('');

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

  const firstName = user?.name?.split(' ')[0] || null;

  return (
    <div className="flex gap-7 animate-in">

      {/* ── Left: main ── */}
      <div className="flex-1 min-w-0 space-y-7">

        {/* ── Welcome hero ── */}
        <div className="relative rounded-2xl overflow-hidden px-7 py-7 bg-grid-dark"
          style={{ background: 'linear-gradient(135deg, rgba(91,0,232,0.07) 0%, rgba(7,4,15,0) 60%)', border: '0.5px solid rgba(91,0,232,0.15)' }}>
          <div className="absolute -top-10 -left-10 w-64 h-48 pointer-events-none rounded-full"
            style={{ background: 'radial-gradient(circle, rgba(91,0,232,0.2) 0%, transparent 65%)' }} />
          <div className="absolute top-4 right-8 flex items-center gap-1.5 opacity-20">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="w-1 rounded-full" style={{ height: `${12 + i * 4}px`, background: '#5B00E8' }} />
            ))}
          </div>
          <div className="relative flex items-end justify-between gap-4 flex-wrap">
            <div>
              {firstName && (
                <p className="text-[11px] font-bold uppercase tracking-[0.2em] mb-2" style={{ color: '#8B3DFF' }}>
                  Welcome back, {firstName}
                </p>
              )}
              <h1 className="font-display text-[30px] font-extrabold text-white tracking-tight leading-none mb-2">
                Dashboard
              </h1>
              <p className="text-[13px] text-white/40">Blueprint history, model scores and usage at a glance.</p>
            </div>
            <Link to="/blueprint"
              className="flex items-center gap-2 h-10 px-5 rounded-xl text-[13px] font-bold text-white flex-shrink-0 transition-all"
              style={{ background: 'linear-gradient(135deg, #5B00E8, #7B3DFF)', border: '0.5px solid rgba(91,0,232,0.5)', boxShadow: '0 0 24px rgba(91,0,232,0.4)' }}
              onMouseEnter={e => { (e.currentTarget as HTMLAnchorElement).style.boxShadow = '0 0 36px rgba(91,0,232,0.6)'; }}
              onMouseLeave={e => { (e.currentTarget as HTMLAnchorElement).style.boxShadow = '0 0 24px rgba(91,0,232,0.4)'; }}
            >
              <span style={{ fontSize: '16px', lineHeight: 1 }}>+</span> New Blueprint
            </Link>
          </div>
        </div>

        {/* ── Stat cards ── */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          <StatCard title="Blueprints"       value={stats?.total_blueprints ?? null}      icon={LayoutGrid}  loading={statsLoading} color="#8B3DFF" />
          <StatCard title="Models Evaluated" value={stats?.models_evaluated ?? null}      icon={Cpu}         loading={statsLoading} color="#3B82F6" />
          <StatCard title="Avg Score"        value={stats?.avg_eval_score != null ? stats.avg_eval_score.toFixed(2) : null} sub="RAGAs composite" icon={Star} loading={statsLoading} color="#D97706" />
          <StatCard title="Est. Monthly"     value={stats?.total_estimated_monthly_cost_usd != null ? `$${stats.total_estimated_monthly_cost_usd.toFixed(2)}` : null} sub="across all blueprints" icon={DollarSign} loading={statsLoading} color="#00A854" />
        </div>

        {/* ── Error ── */}
        {error && (
          <div className="flex items-center gap-3 rounded-xl px-5 py-4 text-[13px]"
            style={{ background: 'rgba(239,68,68,0.07)', border: '0.5px solid rgba(239,68,68,0.2)', color: '#EF4444' }}>
            <AlertCircle className="w-4 h-4 flex-shrink-0" />{error}
          </div>
        )}

        {/* ── Recent blueprints ── */}
        <div>
          <div className="flex items-center gap-2.5 mb-4">
            <Clock className="w-4 h-4 text-white/25" strokeWidth={1.5} />
            <h2 className="font-display text-[15px] font-bold text-white">Recent Blueprints</h2>
            {!bpLoading && blueprints.length > 0 && (
              <span className="badge-purple">{blueprints.length}</span>
            )}
          </div>

          {bpLoading ? (
            <div className="space-y-2">
              {[...Array(4)].map((_, i) => <div key={i} className="h-[72px] shimmer rounded-xl" />)}
            </div>
          ) : blueprints.length === 0 ? (
            <EmptyState />
          ) : (
            <div className="space-y-2">
              {blueprints.map((bp, i) => (
                <motion.div key={bp.blueprint_id}
                  initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.04 }}
                  className="flex items-center gap-4 px-5 py-4 rounded-xl group transition-all"
                  style={{ background: 'rgba(255,255,255,0.02)', border: '0.5px solid rgba(255,255,255,0.06)' }}
                  onMouseEnter={e => { (e.currentTarget as HTMLElement).style.borderColor = 'rgba(91,0,232,0.28)'; (e.currentTarget as HTMLElement).style.background = 'rgba(91,0,232,0.05)'; }}
                  onMouseLeave={e => { (e.currentTarget as HTMLElement).style.borderColor = 'rgba(255,255,255,0.06)'; (e.currentTarget as HTMLElement).style.background = 'rgba(255,255,255,0.02)'; }}
                >
                  {/* Index bubble */}
                  <div className="w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0 text-[11px] font-bold"
                    style={{ background: 'rgba(91,0,232,0.1)', color: '#8B3DFF' }}>
                    {i + 1}
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-0.5">
                      <p className="text-[13px] font-semibold text-white/75 group-hover:text-white transition-colors truncate">
                        {bp.input_text || '(no description)'}
                      </p>
                      {bp.confidence_flag === 'low_confidence' && (
                        <span className="badge-amber text-[9px] flex-shrink-0">Low Confidence</span>
                      )}
                    </div>
                    <p className="text-[11px] text-white/25 flex items-center gap-1.5">
                      <Clock className="w-2.5 h-2.5 flex-shrink-0" />
                      {fmt(bp.created_at)}
                      {bp.model_count > 0 && (
                        <span className="flex items-center gap-1 text-white/20">
                          <Cpu className="w-2.5 h-2.5" /> {bp.model_count} models
                        </span>
                      )}
                    </p>
                  </div>

                  {/* Cost */}
                  <div className="text-right flex-shrink-0 w-20 hidden sm:block">
                    <p className="text-[10px] text-white/20 uppercase tracking-wider mb-0.5">Monthly</p>
                    {bp.total_monthly_cost_usd > 0
                      ? <p className="text-[13px] font-mono font-semibold" style={{ color: '#00A854' }}>${bp.total_monthly_cost_usd.toFixed(2)}</p>
                      : <p className="text-[13px] font-mono text-white/20">—</p>}
                  </div>

                  {/* Score */}
                  <div className="text-center flex-shrink-0 w-16 hidden sm:block">
                    <p className="text-[10px] text-white/20 uppercase tracking-wider mb-0.5">Score</p>
                    <ScoreChip score={bp.eval_score} />
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-1 flex-shrink-0">
                    <Link to={`/blueprints/${bp.blueprint_id}`}
                      className="p-2 rounded-lg transition-colors text-white/25 hover:text-archon-mist hover:bg-archon-core/10">
                      <ExternalLink className="w-3.5 h-3.5" />
                    </Link>
                    <button onClick={() => downloadBlueprint(bp.blueprint_id)}
                      className="p-2 rounded-lg transition-colors text-white/25 hover:text-white hover:bg-white/[0.06]">
                      <Download className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </motion.div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* ── Right: news sidebar ── */}
      <div className="w-[270px] flex-shrink-0 hidden lg:block">
        <div className="rounded-2xl p-4 sticky top-6"
          style={{ background: 'rgba(255,255,255,0.018)', border: '0.5px solid rgba(255,255,255,0.07)' }}>
          <NewsFeed />
        </div>
      </div>
    </div>
  );
}
