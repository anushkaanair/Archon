import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ArrowLeft, Loader2, AlertCircle, Network, DollarSign,
  Zap, Brain, Star, ChevronDown, ChevronUp, ExternalLink,
  Clock, Cpu,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import MermaidDiagram from '../components/ui/MermaidDiagram';
import CostTable from '../components/ui/CostTable';
import LatencyTable from '../components/ui/LatencyTable';
import ScoreGauge from '../components/ui/ScoreGauge';
import DownloadButton from '../components/ui/DownloadButton';

/* ─── Collapsible section ──────────────────────────────────────────────────── */
function Section({ title, icon: Icon, iconColor = '#8B3DFF', children, defaultOpen = true, badge }: {
  title: string; icon: any; iconColor?: string; children: React.ReactNode;
  defaultOpen?: boolean; badge?: string;
}) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      className="rounded-2xl overflow-hidden"
      style={{ background: 'rgba(255,255,255,0.025)', border: '0.5px solid rgba(255,255,255,0.08)' }}
    >
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between px-6 py-4 hover:bg-white/[0.02] transition-colors group"
      >
        <h2 className="text-[13px] font-semibold text-white/90 flex items-center gap-3">
          <span className="w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0"
            style={{ background: `${iconColor}18`, border: `0.5px solid ${iconColor}28` }}>
            <Icon className="w-3.5 h-3.5" style={{ color: iconColor }} />
          </span>
          {title}
          {badge && (
            <span className="text-[10px] font-mono px-2 py-0.5 rounded-full"
              style={{ background: 'rgba(91,0,232,0.12)', color: '#8B3DFF', border: '0.5px solid rgba(91,0,232,0.2)' }}>
              {badge}
            </span>
          )}
        </h2>
        <span className="text-white/20 group-hover:text-white/50 transition-colors">
          {open ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
        </span>
      </button>
      <AnimatePresence initial={false}>
        {open && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden"
          >
            <div className="px-6 pb-6" style={{ borderTop: '0.5px solid rgba(255,255,255,0.05)' }}>
              <div className="pt-5">{children}</div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

/* ─── Score badge ──────────────────────────────────────────────────────────── */
function ScoreBadge({ score, size = 'sm' }: { score: number | null | undefined; size?: 'sm' | 'xs' }) {
  if (score == null) return <span className="text-white/25 text-xs font-mono">—</span>;
  const [textColor, bg, ring] =
    score >= 0.7 ? ['#00A854', 'rgba(0,168,84,0.1)',  '0 0 0 1px rgba(0,168,84,0.25)'] :
    score >= 0.4 ? ['#D97706', 'rgba(217,119,6,0.1)', '0 0 0 1px rgba(217,119,6,0.25)'] :
                   ['#EF4444', 'rgba(239,68,68,0.1)',  '0 0 0 1px rgba(239,68,68,0.25)'];
  return (
    <span
      className={`font-mono rounded-md ${size === 'xs' ? 'text-[10px] px-1.5 py-0.5' : 'text-xs px-2 py-1'}`}
      style={{ color: textColor, background: bg, boxShadow: ring }}
    >
      {score.toFixed(3)}
    </span>
  );
}

/* ─── Main ─────────────────────────────────────────────────────────────────── */
export default function BlueprintDetail() {
  const { id } = useParams<{ id: string }>();
  const { token } = useAuth();
  const apiKey = token || 'arch_test_key_dev';

  const [bp, setBp]         = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError]   = useState('');

  useEffect(() => {
    if (!id) return;
    fetch(`/v1/blueprints/${id}`, { headers: { Authorization: `Bearer ${apiKey}` } })
      .then(r => { if (!r.ok) throw new Error(`HTTP ${r.status}`); return r.json(); })
      .then(data => { setBp(data); setLoading(false); })
      .catch(e => { setError(e.message || 'Failed to load blueprint.'); setLoading(false); });
  }, [id]);

  /* ── Loading ── */
  if (loading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <Loader2 className="w-6 h-6 text-archon-mist animate-spin" />
      </div>
    );
  }

  /* ── Error ── */
  if (error || !bp) {
    return (
      <div className="space-y-6 animate-in">
        <Link to="/dashboard" className="inline-flex items-center gap-2 text-[13px] text-white/40 hover:text-white transition-colors">
          <ArrowLeft className="w-4 h-4" /> Back to Dashboard
        </Link>
        <div className="flex items-start gap-3 rounded-xl px-5 py-4 text-[13px]"
          style={{ background: 'rgba(239,68,68,0.07)', border: '0.5px solid rgba(239,68,68,0.2)', color: '#EF4444' }}>
          <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
          {error || 'Blueprint not found.'}
        </div>
      </div>
    );
  }

  const {
    input_text, architecture_diagram, model_recommendations: recs = [],
    cost_estimate: costEst = {}, latency_estimate: latEst = {},
    explanation, benchmark_citations: citations = [],
    eval_details: evalScore = {}, confidence_flag, created_at,
  } = bp;

  const isLowConf = confidence_flag === 'low_confidence';
  const formattedDate = created_at
    ? new Date(created_at).toLocaleString('en-US', { dateStyle: 'medium', timeStyle: 'short' })
    : null;
  const totalCost = costEst.total_monthly_usd ?? 0;
  const totalP95  = latEst.total_p95_ms ?? 0;
  const topModel  = recs[0];

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-6 max-w-5xl animate-in"
    >
      {/* ── Back nav ── */}
      <Link to="/dashboard"
        className="inline-flex items-center gap-2 text-[13px] text-white/40 hover:text-white transition-colors group">
        <ArrowLeft className="w-4 h-4 group-hover:-translate-x-0.5 transition-transform" />
        Back to Dashboard
      </Link>

      {/* ── Header ── */}
      <div className="relative rounded-2xl overflow-hidden px-7 py-7 bg-grid-dark"
        style={{ background: 'rgba(91,0,232,0.04)', border: '0.5px solid rgba(91,0,232,0.14)' }}>
        <div className="absolute top-0 right-1/3 w-80 h-32 pointer-events-none"
          style={{ background: 'radial-gradient(ellipse, rgba(91,0,232,0.18) 0%, transparent 70%)' }} />
        <div className="relative flex items-start justify-between gap-4 flex-wrap">
          <div className="min-w-0">
            <div className="flex items-center gap-3 mb-2 flex-wrap">
              <h1 className="font-display text-[26px] font-extrabold text-white tracking-tight">
                Architecture Blueprint
              </h1>
              {isLowConf ? (
                <span className="text-[10px] px-2.5 py-1 rounded-full font-semibold flex-shrink-0"
                  style={{ background: 'rgba(217,119,6,0.1)', color: '#D97706', border: '0.5px solid rgba(217,119,6,0.25)' }}>
                  Low Confidence
                </span>
              ) : (
                <span className="text-[10px] px-2.5 py-1 rounded-full font-semibold flex-shrink-0"
                  style={{ background: 'rgba(0,168,84,0.1)', color: '#00A854', border: '0.5px solid rgba(0,168,84,0.25)' }}>
                  Blueprint Ready
                </span>
              )}
            </div>
            <p className="text-[13px] text-white/40 max-w-2xl leading-relaxed line-clamp-3">{input_text}</p>
            {formattedDate && (
              <p className="text-[11px] text-white/20 mt-2 flex items-center gap-1.5">
                <Clock className="w-3 h-3" /> Generated {formattedDate}
              </p>
            )}
          </div>
          <div className="flex items-center gap-2 flex-shrink-0">
            <DownloadButton blueprintData={bp} inputText={input_text} />
          </div>
        </div>
      </div>

      {/* ── Summary stats ── */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {[
          { label: 'Models Scored', value: recs.length > 0 ? String(recs.length) : '—', sub: topModel?.model_name ?? 'none', icon: Cpu, color: '#8B3DFF' },
          { label: 'Top Composite', value: topModel?.scores?.composite != null ? topModel.scores.composite.toFixed(2) : '—', sub: topModel ? `via ${topModel.provider}` : 'no model', icon: Star, color: '#D97706' },
          { label: 'Est. Monthly', value: totalCost > 0 ? `$${totalCost.toFixed(2)}` : '—', sub: totalCost > 0 ? '/month' : 'no pricing data', icon: DollarSign, color: '#00A854' },
          { label: 'P95 Latency', value: totalP95 > 0 ? `${totalP95}ms` : '—', sub: totalP95 > 0 ? (totalP95 < 1000 ? 'fast' : totalP95 < 3000 ? 'medium' : 'slow') : 'no data', icon: Zap, color: totalP95 > 0 && totalP95 < 1000 ? '#00A854' : '#D97706' },
        ].map(({ label, value, sub, icon: Icon, color }) => (
          <div key={label} className="rounded-xl p-4 flex items-start gap-3 transition-all"
            style={{ background: 'rgba(255,255,255,0.025)', border: '0.5px solid rgba(255,255,255,0.07)' }}
            onMouseEnter={e => { (e.currentTarget as HTMLElement).style.borderColor = `${color}30`; }}
            onMouseLeave={e => { (e.currentTarget as HTMLElement).style.borderColor = 'rgba(255,255,255,0.07)'; }}
          >
            <span className="w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0"
              style={{ background: `${color}18`, border: `0.5px solid ${color}28` }}>
              <Icon className="w-3.5 h-3.5" style={{ color }} />
            </span>
            <div className="min-w-0">
              <p className="text-[10px] font-semibold text-white/30 uppercase tracking-wider mb-0.5">{label}</p>
              <p className="text-[15px] font-bold text-white truncate font-display">{value}</p>
              <p className="text-[10px] text-white/30 capitalize truncate">{sub}</p>
            </div>
          </div>
        ))}
      </div>

      {/* ── Low confidence warning ── */}
      {isLowConf && (
        <div className="flex items-start gap-3 rounded-xl px-5 py-4 text-[13px]"
          style={{ background: 'rgba(217,119,6,0.07)', border: '0.5px solid rgba(217,119,6,0.2)', color: '#D97706' }}>
          <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
          <span>
            <strong>Low Confidence Flag</strong> — RAGAs evaluation scored below 0.7. Review the recommendations carefully before production use. Add an LLM API key for richer evaluation.
          </span>
        </div>
      )}

      {/* ── Architecture Diagram ── */}
      {architecture_diagram && (
        <Section title="Architecture Diagram" icon={Network} iconColor="#3B82F6">
          <MermaidDiagram chart={architecture_diagram} />
        </Section>
      )}

      {/* ── Model Recommendations ── */}
      {recs.length > 0 && (
        <Section title="Recommended Models" icon={Cpu} badge={`${recs.length} scored`}>
          {/* Top 3 cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-4">
            {recs.slice(0, 3).map((r: any, i: number) => (
              <motion.div key={i} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.08 }}
                className="relative rounded-xl p-4"
                style={{
                  background: i === 0 ? 'rgba(91,0,232,0.08)' : 'rgba(255,255,255,0.02)',
                  border: i === 0 ? '0.5px solid rgba(91,0,232,0.4)' : '0.5px solid rgba(255,255,255,0.08)',
                  boxShadow: i === 0 ? '0 0 20px rgba(91,0,232,0.1)' : 'none',
                }}>
                {i === 0 && (
                  <div className="absolute -top-2.5 left-4 flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold text-white"
                    style={{ background: 'linear-gradient(135deg, #5B00E8, #8B3DFF)' }}>
                    <Star className="w-2.5 h-2.5 fill-current" /> Top Pick
                  </div>
                )}
                <p className="font-semibold text-white text-[13px] mb-0.5">{r.model_name}</p>
                <p className="text-[10px] text-white/40 capitalize mb-3">{r.provider} · {r.task?.replace(/_/g, ' ')}</p>
                <div className="grid grid-cols-2 gap-2">
                  {[{ label: 'Composite', val: r.scores?.composite }, { label: 'Quality', val: r.scores?.quality_score }, { label: 'Cost', val: r.scores?.cost_score }, { label: 'Latency', val: r.scores?.latency_score }].map(({ label, val }) => (
                    <div key={label} className="rounded-lg px-2.5 py-1.5" style={{ background: 'rgba(255,255,255,0.05)' }}>
                      <p className="text-[9px] text-white/30 uppercase tracking-wider mb-0.5">{label}</p>
                      <ScoreBadge score={val} size="xs" />
                    </div>
                  ))}
                </div>
              </motion.div>
            ))}
          </div>

          {/* Remaining table */}
          {recs.length > 3 && (
            <div className="rounded-xl overflow-hidden" style={{ border: '0.5px solid rgba(255,255,255,0.06)' }}>
              <table className="w-full text-[12px]">
                <thead>
                  <tr className="text-white/30 uppercase tracking-wider text-[10px]"
                    style={{ borderBottom: '0.5px solid rgba(255,255,255,0.06)', background: 'rgba(255,255,255,0.02)' }}>
                    <th className="px-4 py-2.5 text-left">Model</th>
                    <th className="px-4 py-2.5 text-left">Task</th>
                    <th className="px-4 py-2.5 text-right">Composite</th>
                    <th className="px-4 py-2.5 text-right">Cost</th>
                    <th className="px-4 py-2.5 text-right">Quality</th>
                    <th className="px-4 py-2.5 text-right">Latency</th>
                  </tr>
                </thead>
                <tbody>
                  {recs.slice(3).map((r: any, i: number) => (
                    <tr key={i} className="transition-colors hover:bg-white/[0.02]"
                      style={{ borderTop: '0.5px solid rgba(255,255,255,0.04)' }}>
                      <td className="px-4 py-2.5">
                        <span className="font-medium text-white/80">{r.model_name}</span>
                        <span className="block text-white/30 capitalize text-[10px]">{r.provider}</span>
                      </td>
                      <td className="px-4 py-2.5 text-white/40 capitalize text-[11px]">{r.task?.replace(/_/g, ' ')}</td>
                      <td className="px-4 py-2.5 text-right"><ScoreBadge score={r.scores?.composite} size="xs" /></td>
                      <td className="px-4 py-2.5 text-right"><ScoreBadge score={r.scores?.cost_score} size="xs" /></td>
                      <td className="px-4 py-2.5 text-right"><ScoreBadge score={r.scores?.quality_score} size="xs" /></td>
                      <td className="px-4 py-2.5 text-right"><ScoreBadge score={r.scores?.latency_score} size="xs" /></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </Section>
      )}

      {/* ── Cost + Latency ── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {costEst.breakdown?.length > 0 && (
          <Section title="Cost Estimate" icon={DollarSign} iconColor="#00A854">
            <CostTable breakdown={costEst.breakdown} totalMonthly={totalCost} requestVolume={10000} />
          </Section>
        )}
        {latEst.breakdown?.length > 0 && (
          <Section title="Latency Estimate" icon={Zap} iconColor="#3B82F6">
            <LatencyTable breakdown={latEst.breakdown} totalP95={totalP95} />
          </Section>
        )}
      </div>

      {/* ── Explanation ── */}
      {explanation && (
        <Section title="Why This Stack?" icon={Brain} iconColor="#D97706">
          <p className="text-[13px] text-white/60 leading-[1.8] whitespace-pre-wrap">{explanation}</p>
        </Section>
      )}

      {/* ── RAGAs Eval ── */}
      <Section title="RAGAs Quality Evaluation" icon={Star} iconColor="#D97706" defaultOpen={false}>
        <div className="flex items-center gap-10 flex-wrap">
          <ScoreGauge score={evalScore.composite ?? null} label="Composite" size="lg" />
          <div className="grid grid-cols-2 gap-4">
            {[
              { label: 'Faithfulness',     key: 'faithfulness'      },
              { label: 'Ans. Relevancy',   key: 'answer_relevancy'  },
              { label: 'Ctx. Precision',   key: 'context_precision' },
              { label: 'Ctx. Recall',      key: 'context_recall'    },
            ].map(({ label, key }) => (
              <ScoreGauge key={key} score={evalScore[key] ?? null} label={label} size="sm" />
            ))}
          </div>
        </div>
        {evalScore.is_low_confidence && (
          <p className="mt-4 text-[12px] leading-relaxed max-w-lg" style={{ color: 'rgba(217,119,6,0.8)' }}>
            Scores are null — RAGAs requires an LLM key. Add{' '}
            <code className="bg-white/5 px-1.5 py-0.5 rounded text-white/60">OPENAI_API_KEY</code> or{' '}
            <code className="bg-white/5 px-1.5 py-0.5 rounded text-white/60">ANTHROPIC_API_KEY</code> in{' '}
            <code className="bg-white/5 px-1.5 py-0.5 rounded text-white/60">.env</code>.
          </p>
        )}
      </Section>

      {/* ── Citations ── */}
      {citations.length > 0 && (
        <Section title="Benchmark Citations" icon={ExternalLink} defaultOpen={false} badge={`${citations.length}`}>
          <ul className="space-y-2.5">
            {citations.map((c: any, i: number) => (
              <li key={i} className="flex items-start gap-3 text-[12px] text-white/45">
                <span className="font-mono text-[10px] mt-0.5" style={{ color: '#8B3DFF' }}>[{i + 1}]</span>
                <div>
                  <span className="text-white/65">{c.metric}:</span> {c.value}
                  {c.source && (
                    <a href={c.source} target="_blank" rel="noopener noreferrer"
                      className="ml-2 hover:opacity-70 underline underline-offset-2 inline-flex items-center gap-1 transition-opacity"
                      style={{ color: '#8B3DFF' }}>
                      source <ExternalLink className="w-2.5 h-2.5" />
                    </a>
                  )}
                </div>
              </li>
            ))}
          </ul>
        </Section>
      )}
    </motion.div>
  );
}
