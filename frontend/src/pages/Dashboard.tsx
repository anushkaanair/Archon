import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  LayoutGrid, Cpu, DollarSign, Star, ArrowRight,
  Download, Clock, ExternalLink, FileJson,
  Newspaper, ExternalLink as LinkIcon, TrendingUp,
  Zap, AlertCircle,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import newsData from '../data/ai-news.json';

interface NewsItem {
  id: string; date: string; title: string; summary: string;
  type: 'model_release' | 'price_change' | 'collab' | 'research' | 'update';
  provider?: string | null; model_id?: string | null; link?: string | null;
}

const TYPE_META: Record<string, { color: string; label: string }> = {
  model_release: { color: '#5B00E8', label: 'Model'    },
  price_change:  { color: '#059669', label: 'Pricing'  },
  collab:        { color: '#2563EB', label: 'Collab'   },
  research:      { color: '#D97706', label: 'Research' },
  update:        { color: '#6B7280', label: 'Update'   },
};

function isNew(d: string) { return Date.now() - new Date(d).getTime() < 7 * 864e5; }

/* ─── Stat card ─────────────────────────────────────────────────────────── */
function StatCard({ title, value, sub, icon: Icon, loading, color, delay = 0 }: {
  title: string; value: string | number | null; sub?: string;
  icon: any; loading: boolean; color: string; delay?: number;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}
      transition={{ delay, duration: 0.3, ease: 'easeOut' }}
      className="relative rounded-2xl p-5 overflow-hidden bg-white cursor-default group"
      style={{ border: '1.5px solid rgba(91,0,232,0.1)', boxShadow: '0 2px 16px rgba(91,0,232,0.06)', transition: 'all 0.2s ease' }}
      onMouseEnter={e => {
        (e.currentTarget as HTMLElement).style.borderColor = `${color}35`;
        (e.currentTarget as HTMLElement).style.boxShadow = `0 8px 32px ${color}14, 0 2px 8px ${color}08`;
        (e.currentTarget as HTMLElement).style.transform = 'translateY(-2px)';
      }}
      onMouseLeave={e => {
        (e.currentTarget as HTMLElement).style.borderColor = 'rgba(91,0,232,0.1)';
        (e.currentTarget as HTMLElement).style.boxShadow = '0 2px 16px rgba(91,0,232,0.06)';
        (e.currentTarget as HTMLElement).style.transform = '';
      }}>
      {/* Background radial glow */}
      <div className="absolute -top-6 -right-6 w-28 h-28 rounded-full pointer-events-none opacity-60"
        style={{ background: `radial-gradient(circle, ${color}14 0%, transparent 70%)` }} />
      {/* Bottom accent line */}
      <div className="absolute bottom-0 left-5 right-5 h-[2px] rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
        style={{ background: `linear-gradient(90deg, transparent, ${color}40, transparent)` }} />
      <div className="relative">
        <div className="flex items-start justify-between mb-4">
          <p className="text-[10px] font-extrabold uppercase tracking-[0.16em] text-[#9CA3AF]">{title}</p>
          <div className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0"
            style={{ background: `${color}10`, border: `1.5px solid ${color}20` }}>
            <Icon className="w-4 h-4" style={{ color }} strokeWidth={2} />
          </div>
        </div>
        {loading ? (
          <div className="space-y-2">
            <div className="h-7 w-20 rounded-lg" style={{ background: 'rgba(91,0,232,0.06)', animation: 'pulse 1.5s ease-in-out infinite' }} />
            {sub && <div className="h-3 w-28 rounded" style={{ background: 'rgba(91,0,232,0.04)', animation: 'pulse 1.5s ease-in-out infinite' }} />}
          </div>
        ) : (
          <>
            <p className="text-[28px] font-black text-[#0D0D0D] leading-none tracking-tight mb-1.5">
              {value ?? <span className="text-[#D1D5DB]">—</span>}
            </p>
            {sub && <p className="text-[11px] text-[#9CA3AF]">{sub}</p>}
          </>
        )}
      </div>
    </motion.div>
  );
}

/* ─── Score chip ────────────────────────────────────────────────────────── */
function ScoreChip({ score }: { score: number | null }) {
  if (score == null) return <span className="text-[#CBD5E1] text-[11px] font-mono">—</span>;
  const [c, bg, border] =
    score >= 0.7 ? ['#059669', 'rgba(5,150,105,0.08)', 'rgba(5,150,105,0.2)'] :
    score >= 0.4 ? ['#D97706', 'rgba(217,119,6,0.08)', 'rgba(217,119,6,0.2)'] :
                   ['#EF4444', 'rgba(239,68,68,0.08)', 'rgba(239,68,68,0.2)'];
  return (
    <span className="text-[11px] font-mono font-bold px-2.5 py-1 rounded-lg"
      style={{ color: c, background: bg, border: `1px solid ${border}` }}>
      {score.toFixed(2)}
    </span>
  );
}

/* ─── Empty state ───────────────────────────────────────────────────────── */
const TEMPLATES = [
  { title: 'Legal Q&A Bot',        desc: 'RAG + citation tracking',         tag: 'RAG',  color: '#5B00E8' },
  { title: 'Code Review AI',       desc: 'Security & quality analysis',     tag: 'Code', color: '#2563EB' },
  { title: 'Customer Support Bot', desc: 'Multi-channel conversational AI', tag: 'Chat', color: '#059669' },
  { title: 'Data Insights',        desc: 'ETL + LLM-powered analytics',     tag: 'Data', color: '#D97706' },
];

function EmptyState() {
  return (
    <div className="space-y-4">
      <div className="rounded-2xl px-8 py-12 text-center flex flex-col items-center bg-white"
        style={{ border: '1.5px solid rgba(91,0,232,0.1)', boxShadow: '0 4px 24px rgba(91,0,232,0.06)' }}>
        <div className="w-16 h-16 rounded-2xl flex items-center justify-center mb-5 relative"
          style={{ background: 'rgba(91,0,232,0.06)', border: '2px solid rgba(91,0,232,0.15)' }}>
          <FileJson className="w-8 h-8 text-[#5B00E8] opacity-50" strokeWidth={1.5} />
          <div className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-[#5B00E8] flex items-center justify-center">
            <span className="text-white text-[10px] font-black">+</span>
          </div>
        </div>
        <p className="text-[18px] font-extrabold text-[#0D0D0D] mb-2">No blueprints yet</p>
        <p className="text-[13px] text-[#6B7280] mb-6 max-w-xs leading-relaxed">
          Generate your first AI architecture blueprint and it'll appear here with scores, costs, and models.
        </p>
        <Link to="/builder"
          className="inline-flex items-center gap-2 h-11 px-7 rounded-xl text-[13px] font-bold text-white transition-all"
          style={{ background: 'linear-gradient(135deg, #5B00E8, #7C3AED)', boxShadow: '0 4px 20px rgba(91,0,232,0.35)' }}
          onMouseEnter={e => { (e.currentTarget as HTMLElement).style.transform = 'translateY(-1px)'; (e.currentTarget as HTMLElement).style.boxShadow = '0 8px 28px rgba(91,0,232,0.45)'; }}
          onMouseLeave={e => { (e.currentTarget as HTMLElement).style.transform = ''; (e.currentTarget as HTMLElement).style.boxShadow = '0 4px 20px rgba(91,0,232,0.35)'; }}>
          <Zap className="w-4 h-4" /> Generate First Blueprint
        </Link>
      </div>

      <div>
        <p className="text-[10px] font-extrabold uppercase tracking-[0.16em] text-[#9CA3AF] mb-3 px-1">
          Try a template
        </p>
        <div className="grid grid-cols-2 gap-2">
          {TEMPLATES.map(ex => (
            <Link key={ex.title} to="/builder"
              className="group flex items-start gap-3 px-4 py-3.5 rounded-xl bg-white transition-all"
              style={{ border: '1.5px solid rgba(91,0,232,0.08)' }}
              onMouseEnter={e => { (e.currentTarget as HTMLAnchorElement).style.borderColor = `${ex.color}30`; (e.currentTarget as HTMLAnchorElement).style.background = `${ex.color}04`; (e.currentTarget as HTMLAnchorElement).style.transform = 'translateY(-1px)'; }}
              onMouseLeave={e => { (e.currentTarget as HTMLAnchorElement).style.borderColor = 'rgba(91,0,232,0.08)'; (e.currentTarget as HTMLAnchorElement).style.background = 'white'; (e.currentTarget as HTMLAnchorElement).style.transform = ''; }}>
              <div className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5"
                style={{ background: `${ex.color}10` }}>
                <span className="text-[9px] font-black" style={{ color: ex.color }}>{ex.tag}</span>
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-[12px] font-bold text-[#374151] group-hover:text-[#0D0D0D] transition-colors">{ex.title}</p>
                <p className="text-[11px] text-[#9CA3AF] mt-0.5">{ex.desc}</p>
              </div>
              <ArrowRight className="w-4 h-4 text-[#CBD5E1] group-hover:text-[#5B00E8] transition-colors flex-shrink-0 mt-1" />
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}

/* ─── News feed ─────────────────────────────────────────────────────────── */
function NewsFeed() {
  const sorted = [...(newsData as NewsItem[])].sort((a, b) => +new Date(b.date) - +new Date(a.date));
  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center gap-2 mb-4">
        <Newspaper className="w-3.5 h-3.5 text-[#9CA3AF]" strokeWidth={1.5} />
        <span className="text-[13px] font-bold text-[#0D0D0D]">AI News</span>
        <span className="ml-auto flex items-center gap-1 text-[9px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full"
          style={{ background: 'rgba(5,150,105,0.1)', color: '#059669', border: '1px solid rgba(5,150,105,0.2)' }}>
          <span className="w-1.5 h-1.5 rounded-full bg-[#059669] animate-pulse" />
          Live
        </span>
      </div>
      <div className="flex-1 overflow-y-auto space-y-2 pr-0.5" style={{ maxHeight: 'calc(100vh - 220px)' }}>
        {sorted.map(item => {
          const m = TYPE_META[item.type] ?? TYPE_META.update;
          return (
            <div key={item.id}
              className="group rounded-xl p-3 transition-all cursor-default"
              style={{ background: '#F9FAFB', border: '1.5px solid rgba(91,0,232,0.06)' }}
              onMouseEnter={e => { (e.currentTarget as HTMLElement).style.borderColor = `${m.color}25`; (e.currentTarget as HTMLElement).style.background = 'white'; }}
              onMouseLeave={e => { (e.currentTarget as HTMLElement).style.borderColor = 'rgba(91,0,232,0.06)'; (e.currentTarget as HTMLElement).style.background = '#F9FAFB'; }}>
              <div className="flex items-center gap-1.5 mb-1.5">
                <span className="text-[9px] font-black uppercase tracking-wider px-1.5 py-0.5 rounded"
                  style={{ background: `${m.color}10`, color: m.color }}>{m.label}</span>
                {isNew(item.date) && (
                  <span className="text-[9px] font-black uppercase tracking-wider px-1.5 py-0.5 rounded"
                    style={{ background: 'rgba(91,0,232,0.08)', color: '#5B00E8' }}>New</span>
                )}
                <span className="text-[10px] text-[#9CA3AF] ml-auto font-mono">
                  {new Date(item.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                </span>
              </div>
              <p className="text-[12px] font-bold text-[#0D0D0D] leading-snug mb-1">{item.title}</p>
              <p className="text-[11px] text-[#6B7280] leading-relaxed line-clamp-2">{item.summary}</p>
              {item.link && (
                <a href={item.link} target="_blank" rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 mt-2 text-[10px] font-semibold transition-opacity hover:opacity-70"
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

/* ─── Main ──────────────────────────────────────────────────────────────── */
export default function Dashboard() {
  const { token, user } = useAuth();
  const headers = { Authorization: `Bearer ${token || ''}` };

  const [stats, setStats]               = useState<any>(null);
  const [blueprints, setBlueprints]     = useState<any[]>([]);
  const [statsLoading, setStatsLoading] = useState(true);
  const [bpLoading, setBpLoading]       = useState(true);
  const [error, setError]               = useState('');

  useEffect(() => {
    const safeJson = async (res: Response) => {
      const text = await res.text();
      if (!text || !text.trim()) return null;
      try { return JSON.parse(text); } catch { return null; }
    };
    fetch('/v1/dashboard/stats', { headers })
      .then(safeJson).then(d => { if (d) setStats(d); setStatsLoading(false); })
      .catch(() => setStatsLoading(false));
    fetch('/v1/blueprints?limit=10', { headers })
      .then(safeJson).then(d => { if (d) setBlueprints(d.items || []); setBpLoading(false); })
      .catch(() => { setError('Backend offline — showing demo data'); setBpLoading(false); });
  }, []);

  const downloadBlueprint = async (id: string) => {
    try {
      const res  = await fetch(`/v1/blueprints/${id}`, { headers });
      const text = await res.text();
      if (!text || !text.trim()) return;
      const data = JSON.parse(text);
      const a = Object.assign(document.createElement('a'), {
        href: URL.createObjectURL(new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' })),
        download: `archon-blueprint-${id.slice(0, 8)}.json`,
      });
      a.click();
    } catch { /* silently ignore download failures */ }
  };

  const fmt = (iso: string | null) => {
    if (!iso) return '—';
    return new Date(iso).toLocaleDateString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
  };

  const firstName = user?.name?.split(' ')[0] || null;
  const hour = new Date().getHours();
  const greeting = hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening';

  return (
    <div className="p-6 lg:p-8 flex gap-7 min-h-full">

      {/* ── Left: main ── */}
      <div className="flex-1 min-w-0 space-y-6">

        {/* ── Welcome hero ── */}
        <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }}
          className="relative rounded-2xl overflow-hidden"
          style={{ background: 'linear-gradient(135deg, #5B00E8 0%, #7C3AED 60%, #C4A0FF 100%)', boxShadow: '0 8px 40px rgba(91,0,232,0.3)' }}>
          {/* Texture overlay */}
          <div className="absolute inset-0 pointer-events-none"
            style={{ backgroundImage: 'radial-gradient(circle at 15% 50%, rgba(255,255,255,0.12) 0%, transparent 55%), radial-gradient(circle at 85% 20%, rgba(255,255,255,0.08) 0%, transparent 50%)' }} />
          {/* Bars decoration */}
          <div className="absolute top-5 right-8 flex items-end gap-1 opacity-20">
            {[14, 20, 28, 22, 32, 18, 26].map((h, i) => (
              <div key={i} className="w-1.5 rounded-full bg-white" style={{ height: h }} />
            ))}
          </div>
          <div className="relative px-7 py-7 flex items-end justify-between gap-4 flex-wrap">
            <div>
              <p className="text-[11px] font-black uppercase tracking-[0.22em] mb-2 text-white/70">
                {greeting}{firstName ? `, ${firstName}` : ''}
              </p>
              <h1 className="text-[32px] font-black text-white leading-none tracking-tight mb-2">
                Dashboard
              </h1>
              <p className="text-[13px] text-white/65">Blueprint history, model scores and usage at a glance.</p>
            </div>
            <Link to="/builder"
              className="flex items-center gap-2 h-10 px-5 rounded-xl text-[13px] font-bold text-[#5B00E8] flex-shrink-0 transition-all"
              style={{ background: 'white', boxShadow: '0 2px 16px rgba(0,0,0,0.15)' }}
              onMouseEnter={e => { (e.currentTarget as HTMLAnchorElement).style.transform = 'translateY(-1px)'; (e.currentTarget as HTMLAnchorElement).style.boxShadow = '0 6px 24px rgba(0,0,0,0.2)'; }}
              onMouseLeave={e => { (e.currentTarget as HTMLAnchorElement).style.transform = ''; (e.currentTarget as HTMLAnchorElement).style.boxShadow = '0 2px 16px rgba(0,0,0,0.15)'; }}>
              <Zap className="w-4 h-4" /> New Blueprint
            </Link>
          </div>
        </motion.div>

        {/* ── Stat cards ── */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          <StatCard delay={0.06} title="Blueprints"       value={stats?.total_blueprints ?? null}      icon={LayoutGrid}  loading={statsLoading} color="#5B00E8" />
          <StatCard delay={0.10} title="Models Evaluated" value={stats?.models_evaluated ?? null}      icon={Cpu}         loading={statsLoading} color="#2563EB" />
          <StatCard delay={0.14} title="Avg Score"
            value={stats?.avg_eval_score != null ? stats.avg_eval_score.toFixed(2) : null}
            sub="RAGAs composite" icon={Star} loading={statsLoading} color="#D97706" />
          <StatCard delay={0.18} title="Est. Monthly"
            value={stats?.total_estimated_monthly_cost_usd != null ? `$${stats.total_estimated_monthly_cost_usd.toFixed(2)}` : null}
            sub="across all blueprints" icon={DollarSign} loading={statsLoading} color="#059669" />
        </div>

        {/* ── Status bar ── */}
        {error && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}
            className="flex items-center gap-3 rounded-xl px-4 py-3 text-[12px]"
            style={{ background: 'rgba(217,119,6,0.06)', border: '1px solid rgba(217,119,6,0.18)', color: '#D97706' }}>
            <AlertCircle className="w-4 h-4 flex-shrink-0" />
            <span>{error}</span>
            <Link to="/builder" className="ml-auto flex items-center gap-1 font-semibold hover:underline">
              Try the Builder <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </motion.div>
        )}

        {/* ── Recent blueprints ── */}
        <div>
          <div className="flex items-center gap-2.5 mb-4">
            <Clock className="w-4 h-4 text-[#9CA3AF]" strokeWidth={1.5} />
            <h2 className="text-[15px] font-extrabold text-[#0D0D0D]">Recent Blueprints</h2>
            {!bpLoading && blueprints.length > 0 && (
              <span className="text-[10px] font-black px-2 py-0.5 rounded-full"
                style={{ background: 'rgba(91,0,232,0.08)', color: '#5B00E8', border: '1px solid rgba(91,0,232,0.18)' }}>
                {blueprints.length}
              </span>
            )}
            {!bpLoading && blueprints.length > 0 && (
              <Link to="/builder" className="ml-auto flex items-center gap-1 text-[12px] font-semibold text-[#5B00E8] hover:underline">
                New <TrendingUp className="w-3.5 h-3.5" />
              </Link>
            )}
          </div>

          {bpLoading ? (
            <div className="space-y-2">
              {[...Array(4)].map((_, i) => (
                <div key={i} className="h-[72px] rounded-2xl"
                  style={{ background: 'rgba(91,0,232,0.04)', animation: `pulse ${1.2 + i * 0.1}s ease-in-out infinite` }} />
              ))}
            </div>
          ) : blueprints.length === 0 ? <EmptyState /> : (
            <div className="space-y-2">
              {blueprints.map((bp, i) => (
                <motion.div key={bp.blueprint_id}
                  initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.05, duration: 0.25 }}
                  className="flex items-center gap-4 px-5 py-4 rounded-2xl group bg-white transition-all cursor-default"
                  style={{ border: '1.5px solid rgba(91,0,232,0.08)', transition: 'all 0.18s ease' }}
                  onMouseEnter={e => {
                    (e.currentTarget as HTMLElement).style.borderColor = 'rgba(91,0,232,0.22)';
                    (e.currentTarget as HTMLElement).style.boxShadow = '0 6px 24px rgba(91,0,232,0.09)';
                    (e.currentTarget as HTMLElement).style.transform = 'translateY(-1px)';
                  }}
                  onMouseLeave={e => {
                    (e.currentTarget as HTMLElement).style.borderColor = 'rgba(91,0,232,0.08)';
                    (e.currentTarget as HTMLElement).style.boxShadow = 'none';
                    (e.currentTarget as HTMLElement).style.transform = '';
                  }}>

                  {/* Index */}
                  <div className="w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0 text-[11px] font-black"
                    style={{ background: 'rgba(91,0,232,0.07)', color: '#5B00E8' }}>
                    {i + 1}
                  </div>

                  {/* Main info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-0.5">
                      <p className="text-[13px] font-semibold text-[#374151] group-hover:text-[#0D0D0D] transition-colors truncate">
                        {bp.input_text || '(no description)'}
                      </p>
                      {bp.confidence_flag === 'low_confidence' && (
                        <span className="text-[9px] font-bold px-2 py-0.5 rounded-full flex-shrink-0"
                          style={{ background: 'rgba(217,119,6,0.08)', color: '#D97706', border: '1px solid rgba(217,119,6,0.2)' }}>
                          Low Confidence
                        </span>
                      )}
                    </div>
                    <p className="text-[11px] text-[#9CA3AF] flex items-center gap-2">
                      <Clock className="w-2.5 h-2.5 flex-shrink-0" />
                      {fmt(bp.created_at)}
                      {bp.model_count > 0 && (
                        <span className="flex items-center gap-1">
                          <Cpu className="w-2.5 h-2.5" /> {bp.model_count} models
                        </span>
                      )}
                    </p>
                  </div>

                  {/* Cost */}
                  <div className="text-right flex-shrink-0 hidden sm:block" style={{ minWidth: 72 }}>
                    <p className="text-[9px] text-[#9CA3AF] uppercase tracking-wider font-bold mb-0.5">Monthly</p>
                    {bp.total_monthly_cost_usd > 0
                      ? <p className="text-[13px] font-mono font-bold" style={{ color: '#059669' }}>${bp.total_monthly_cost_usd.toFixed(2)}</p>
                      : <p className="text-[13px] font-mono text-[#CBD5E1]">—</p>}
                  </div>

                  {/* Score */}
                  <div className="text-center flex-shrink-0 hidden sm:block" style={{ minWidth: 52 }}>
                    <p className="text-[9px] text-[#9CA3AF] uppercase tracking-wider font-bold mb-0.5">Score</p>
                    <ScoreChip score={bp.eval_score} />
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-1 flex-shrink-0">
                    <Link to={`/blueprints/${bp.blueprint_id}`}
                      className="w-8 h-8 rounded-xl flex items-center justify-center transition-all text-[#CBD5E1]"
                      onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = 'rgba(91,0,232,0.07)'; (e.currentTarget as HTMLElement).style.color = '#5B00E8'; }}
                      onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = 'transparent'; (e.currentTarget as HTMLElement).style.color = '#CBD5E1'; }}>
                      <ExternalLink className="w-3.5 h-3.5" />
                    </Link>
                    <button onClick={() => downloadBlueprint(bp.blueprint_id)}
                      className="w-8 h-8 rounded-xl flex items-center justify-center transition-all text-[#CBD5E1]"
                      onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = '#F4F2FF'; (e.currentTarget as HTMLElement).style.color = '#374151'; }}
                      onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = 'transparent'; (e.currentTarget as HTMLElement).style.color = '#CBD5E1'; }}>
                      <Download className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </motion.div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* ── Right: news ── */}
      <div className="w-[268px] flex-shrink-0 hidden lg:block">
        <div className="sticky top-0">
          <div className="rounded-2xl p-4 bg-white"
            style={{ border: '1.5px solid rgba(91,0,232,0.1)', boxShadow: '0 4px 24px rgba(91,0,232,0.07)' }}>
            <NewsFeed />
          </div>
        </div>
      </div>
    </div>
  );
}
