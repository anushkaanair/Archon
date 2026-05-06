import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ArrowLeft, Loader2, AlertCircle, Network, DollarSign,
  Zap, Brain, Star, ChevronDown, ChevronUp, ExternalLink,
  Clock, Cpu, FlaskConical,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import MermaidDiagram from '../components/ui/MermaidDiagram';
import CostTable from '../components/ui/CostTable';
import LatencyTable from '../components/ui/LatencyTable';
import ScoreGauge from '../components/ui/ScoreGauge';
import DownloadButton from '../components/ui/DownloadButton';

/* ─── Collapsible section ──────────────────────────────────────────────── */
function Section({ title, icon: Icon, iconColor = '#5B00E8', children, defaultOpen = true, badge }: {
  title: string; icon: any; iconColor?: string; children: React.ReactNode;
  defaultOpen?: boolean; badge?: string;
}) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      className="rounded-2xl overflow-hidden bg-white"
      style={{ border: '1.5px solid rgba(91,0,232,0.1)', boxShadow: '0 2px 16px rgba(91,0,232,0.06)' }}>
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between px-6 py-4 transition-colors group"
        style={{ borderBottom: open ? '1px solid rgba(91,0,232,0.06)' : 'none' }}
        onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = 'rgba(91,0,232,0.02)'; }}
        onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = 'transparent'; }}>
        <h2 className="text-[13px] font-bold text-[#0D0D0D] flex items-center gap-3">
          <span className="w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0"
            style={{ background: `${iconColor}14`, border: `1px solid ${iconColor}25` }}>
            <Icon className="w-3.5 h-3.5" style={{ color: iconColor }} />
          </span>
          {title}
          {badge && (
            <span className="text-[10px] font-mono px-2 py-0.5 rounded-full"
              style={{ background: 'rgba(91,0,232,0.08)', color: '#5B00E8', border: '1px solid rgba(91,0,232,0.15)' }}>
              {badge}
            </span>
          )}
        </h2>
        <span className="text-[#9CA3AF] group-hover:text-[#5B00E8] transition-colors">
          {open ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
        </span>
      </button>
      <AnimatePresence initial={false}>
        {open && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}>
            <div className="px-6 pb-6">
              <div className="pt-5">{children}</div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

/* ─── Score badge ──────────────────────────────────────────────────────── */
function ScoreBadge({ score, size = 'sm' }: { score: number | null | undefined; size?: 'sm' | 'xs' }) {
  if (score == null) return <span className="text-[#CBD5E1] text-xs font-mono">—</span>;
  const [textColor, bg, border] =
    score >= 0.7 ? ['#059669', 'rgba(5,150,105,0.08)',  'rgba(5,150,105,0.2)'] :
    score >= 0.4 ? ['#D97706', 'rgba(217,119,6,0.08)',  'rgba(217,119,6,0.2)'] :
                   ['#EF4444', 'rgba(239,68,68,0.08)',   'rgba(239,68,68,0.2)'];
  return (
    <span
      className={`font-mono rounded-md ${size === 'xs' ? 'text-[10px] px-1.5 py-0.5' : 'text-xs px-2 py-1'}`}
      style={{ color: textColor, background: bg, border: `1px solid ${border}` }}>
      {score.toFixed(3)}
    </span>
  );
}

/* ─── Main ─────────────────────────────────────────────────────────────── */
export default function BlueprintDetail() {
  const { id } = useParams<{ id: string }>();
  const { token } = useAuth();
  const apiKey = token || 'arch_test_key_dev';

  const [bp, setBp]           = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError]     = useState('');

  useEffect(() => {
    if (!id) return;
    const safeJson = async (res: Response) => {
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const text = await res.text();
      if (!text || !text.trim()) throw new Error('Empty response from server');
      return JSON.parse(text);
    };
    fetch(`/v1/blueprints/${id}`, { headers: { Authorization: `Bearer ${apiKey}` } })
      .then(safeJson)
      .then(data => { setBp(data); setLoading(false); })
      .catch(e => { setError(e.message || 'Failed to load blueprint.'); setLoading(false); });
  }, [id]);

  if (loading) {
    return (
      <div className="p-6 lg:p-8 min-h-[60vh] flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-8 h-8 text-[#5B00E8] animate-spin mx-auto mb-3" />
          <p className="text-[13px] text-[#9CA3AF]">Loading blueprint…</p>
        </div>
      </div>
    );
  }

  if (error || !bp) {
    return (
      <div className="p-6 lg:p-8 space-y-6">
        <Link to="/dashboard" className="inline-flex items-center gap-2 text-[13px] text-[#6B7280] hover:text-[#5B00E8] transition-colors group">
          <ArrowLeft className="w-4 h-4 group-hover:-translate-x-0.5 transition-transform" />
          Back to Dashboard
        </Link>
        <div className="flex items-start gap-3 rounded-xl px-5 py-4 text-[13px]"
          style={{ background: 'rgba(239,68,68,0.06)', border: '1.5px solid rgba(239,68,68,0.2)', color: '#EF4444' }}>
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

  const isLowConf   = confidence_flag === 'low_confidence';
  const formattedDate = created_at
    ? new Date(created_at).toLocaleString('en-US', { dateStyle: 'medium', timeStyle: 'short' })
    : null;
  const totalCost = costEst.total_monthly_usd ?? 0;
  const totalP95  = latEst.total_p95_ms ?? 0;
  const topModel  = recs[0];

  return (
    <div className="p-6 lg:p-8">
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-6 max-w-5xl">

      {/* ── Back nav ── */}
      <Link to="/dashboard"
        className="inline-flex items-center gap-2 text-[13px] text-[#6B7280] hover:text-[#5B00E8] transition-colors group">
        <ArrowLeft className="w-4 h-4 group-hover:-translate-x-0.5 transition-transform" />
        Back to Dashboard
      </Link>

      {/* ── Header ── */}
      <div className="relative rounded-2xl overflow-hidden px-7 py-7 bg-white"
        style={{ border: '1.5px solid rgba(91,0,232,0.15)', boxShadow: '0 4px 24px rgba(91,0,232,0.07)' }}>
        <div className="absolute top-0 right-0 w-80 h-32 pointer-events-none"
          style={{ background: 'radial-gradient(ellipse at top right, rgba(91,0,232,0.06) 0%, transparent 70%)' }} />
        <div className="relative flex items-start justify-between gap-4 flex-wrap">
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-3 mb-2 flex-wrap">
              <div className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0"
                style={{ background: 'rgba(91,0,232,0.08)', border: '1.5px solid rgba(91,0,232,0.15)' }}>
                <Network className="w-4 h-4 text-[#5B00E8]" />
              </div>
              <h1 className="text-[24px] font-extrabold text-[#0D0D0D] tracking-tight">
                Architecture Blueprint
              </h1>
              {isLowConf ? (
                <span className="text-[10px] px-2.5 py-1 rounded-full font-bold flex-shrink-0"
                  style={{ background: 'rgba(217,119,6,0.08)', color: '#D97706', border: '1.5px solid rgba(217,119,6,0.2)' }}>
                  Low Confidence
                </span>
              ) : (
                <span className="text-[10px] px-2.5 py-1 rounded-full font-bold flex-shrink-0"
                  style={{ background: 'rgba(5,150,105,0.08)', color: '#059669', border: '1.5px solid rgba(5,150,105,0.2)' }}>
                  ✓ Blueprint Ready
                </span>
              )}
            </div>
            <p className="text-[13px] text-[#6B7280] max-w-2xl leading-relaxed line-clamp-3 mb-2">{input_text}</p>
            {formattedDate && (
              <p className="text-[11px] text-[#9CA3AF] flex items-center gap-1.5">
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
          { label: 'Models Scored', value: recs.length > 0 ? String(recs.length) : '—', sub: topModel?.model_name ?? 'none', icon: Cpu, color: '#5B00E8' },
          { label: 'Top Composite', value: topModel?.scores?.composite != null ? topModel.scores.composite.toFixed(2) : '—', sub: topModel ? `via ${topModel.provider}` : 'no model', icon: Star, color: '#D97706' },
          { label: 'Est. Monthly', value: totalCost > 0 ? `$${totalCost.toFixed(2)}` : '—', sub: totalCost > 0 ? '/month' : 'no pricing data', icon: DollarSign, color: '#059669' },
          { label: 'P95 Latency', value: totalP95 > 0 ? `${totalP95}ms` : '—', sub: totalP95 > 0 ? (totalP95 < 1000 ? 'fast' : totalP95 < 3000 ? 'medium' : 'slow') : 'no data', icon: Zap, color: totalP95 > 0 && totalP95 < 1000 ? '#059669' : '#D97706' },
        ].map(({ label, value, sub, icon: Icon, color }) => (
          <div key={label} className="rounded-2xl p-4 flex items-start gap-3 bg-white transition-all cursor-default"
            style={{ border: '1.5px solid rgba(91,0,232,0.1)', boxShadow: '0 2px 12px rgba(91,0,232,0.05)' }}
            onMouseEnter={e => { (e.currentTarget as HTMLElement).style.borderColor = `${color}35`; (e.currentTarget as HTMLElement).style.transform = 'translateY(-1px)'; }}
            onMouseLeave={e => { (e.currentTarget as HTMLElement).style.borderColor = 'rgba(91,0,232,0.1)'; (e.currentTarget as HTMLElement).style.transform = ''; }}>
            <span className="w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0"
              style={{ background: `${color}12`, border: `1px solid ${color}22` }}>
              <Icon className="w-3.5 h-3.5" style={{ color }} />
            </span>
            <div className="min-w-0">
              <p className="text-[10px] font-bold text-[#9CA3AF] uppercase tracking-wider mb-0.5">{label}</p>
              <p className="text-[17px] font-black text-[#0D0D0D] truncate leading-none mb-0.5">{value}</p>
              <p className="text-[10px] text-[#9CA3AF] capitalize truncate">{sub}</p>
            </div>
          </div>
        ))}
      </div>

      {/* ── Low confidence warning ── */}
      {isLowConf && (
        <div className="flex items-start gap-3 rounded-xl px-5 py-4 text-[13px]"
          style={{ background: 'rgba(217,119,6,0.06)', border: '1.5px solid rgba(217,119,6,0.2)', color: '#D97706' }}>
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
                className="relative rounded-xl p-4 transition-all"
                style={{
                  background: i === 0 ? 'rgba(91,0,232,0.04)' : 'rgba(91,0,232,0.01)',
                  border: i === 0 ? '1.5px solid rgba(91,0,232,0.3)' : '1.5px solid rgba(91,0,232,0.1)',
                  boxShadow: i === 0 ? '0 4px 20px rgba(91,0,232,0.1)' : 'none',
                }}>
                {i === 0 && (
                  <div className="absolute -top-3 left-4 flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold text-white"
                    style={{ background: 'linear-gradient(135deg, #5B00E8, #8B3DFF)' }}>
                    <Star className="w-2.5 h-2.5 fill-current" /> Top Pick
                  </div>
                )}
                <p className="font-bold text-[#0D0D0D] text-[13px] mb-0.5">{r.model_name}</p>
                <p className="text-[10px] text-[#9CA3AF] capitalize mb-3">{r.provider} · {r.task?.replace(/_/g, ' ')}</p>
                <div className="grid grid-cols-2 gap-2">
                  {[{ label: 'Composite', val: r.scores?.composite }, { label: 'Quality', val: r.scores?.quality_score }, { label: 'Cost', val: r.scores?.cost_score }, { label: 'Latency', val: r.scores?.latency_score }].map(({ label, val }) => (
                    <div key={label} className="rounded-lg px-2.5 py-1.5" style={{ background: 'rgba(91,0,232,0.04)', border: '1px solid rgba(91,0,232,0.08)' }}>
                      <p className="text-[9px] text-[#9CA3AF] uppercase tracking-wider mb-0.5">{label}</p>
                      <ScoreBadge score={val} size="xs" />
                    </div>
                  ))}
                </div>
              </motion.div>
            ))}
          </div>

          {/* Remaining table */}
          {recs.length > 3 && (
            <div className="rounded-xl overflow-hidden" style={{ border: '1.5px solid rgba(91,0,232,0.08)' }}>
              <table className="w-full text-[12px]">
                <thead>
                  <tr className="text-[#9CA3AF] uppercase tracking-wider text-[10px]"
                    style={{ borderBottom: '1.5px solid rgba(91,0,232,0.08)', background: '#F9FAFB' }}>
                    <th className="px-4 py-2.5 text-left font-semibold">Model</th>
                    <th className="px-4 py-2.5 text-left font-semibold">Task</th>
                    <th className="px-4 py-2.5 text-right font-semibold">Composite</th>
                    <th className="px-4 py-2.5 text-right font-semibold">Cost</th>
                    <th className="px-4 py-2.5 text-right font-semibold">Quality</th>
                    <th className="px-4 py-2.5 text-right font-semibold">Latency</th>
                  </tr>
                </thead>
                <tbody>
                  {recs.slice(3).map((r: any, i: number) => (
                    <tr key={i} className="transition-colors"
                      style={{ borderTop: '1px solid rgba(91,0,232,0.05)' }}
                      onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = 'rgba(91,0,232,0.02)'; }}
                      onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = 'transparent'; }}>
                      <td className="px-4 py-2.5">
                        <span className="font-semibold text-[#374151]">{r.model_name}</span>
                        <span className="block text-[#9CA3AF] capitalize text-[10px]">{r.provider}</span>
                      </td>
                      <td className="px-4 py-2.5 text-[#6B7280] capitalize text-[11px]">{r.task?.replace(/_/g, ' ')}</td>
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
          <Section title="Cost Estimate" icon={DollarSign} iconColor="#059669">
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
          <p className="text-[13px] text-[#374151] leading-[1.85] whitespace-pre-wrap">{explanation}</p>
        </Section>
      )}

      {/* ── RAGAs Eval ── */}
      <Section title="RAGAs Quality Evaluation" icon={Star} iconColor="#D97706" defaultOpen={false}>
        <div className="flex items-center gap-10 flex-wrap">
          <ScoreGauge score={evalScore.composite ?? null} label="Composite" size="lg" />
          <div className="grid grid-cols-2 gap-4">
            {[
              { label: 'Faithfulness',    key: 'faithfulness'      },
              { label: 'Ans. Relevancy',  key: 'answer_relevancy'  },
              { label: 'Ctx. Precision',  key: 'context_precision' },
              { label: 'Ctx. Recall',     key: 'context_recall'    },
            ].map(({ label, key }) => (
              <ScoreGauge key={key} score={evalScore[key] ?? null} label={label} size="sm" />
            ))}
          </div>
        </div>
        {evalScore.is_low_confidence && (
          <p className="mt-4 text-[12px] text-[#D97706] leading-relaxed max-w-lg">
            Scores are null — RAGAs requires an LLM key. Add{' '}
            <code className="px-1.5 py-0.5 rounded text-[11px]" style={{ background: 'rgba(91,0,232,0.06)', color: '#5B00E8' }}>OPENAI_API_KEY</code> or{' '}
            <code className="px-1.5 py-0.5 rounded text-[11px]" style={{ background: 'rgba(91,0,232,0.06)', color: '#5B00E8' }}>ANTHROPIC_API_KEY</code> in{' '}
            <code className="px-1.5 py-0.5 rounded text-[11px]" style={{ background: 'rgba(91,0,232,0.06)', color: '#5B00E8' }}>.env</code>.
          </p>
        )}
      </Section>

      {/* ── Citations ── */}
      {citations.length > 0 && (
        <Section title="Benchmark Citations" icon={ExternalLink} defaultOpen={false} badge={`${citations.length}`}>
          <ul className="space-y-2.5">
            {citations.map((c: any, i: number) => (
              <li key={i} className="flex items-start gap-3 text-[12px] text-[#6B7280]">
                <span className="font-mono text-[10px] mt-0.5 font-bold" style={{ color: '#5B00E8' }}>[{i + 1}]</span>
                <div>
                  <span className="font-semibold text-[#374151]">{c.metric}:</span> {c.value}
                  {c.source && (
                    <a href={c.source} target="_blank" rel="noopener noreferrer"
                      className="ml-2 hover:opacity-70 underline underline-offset-2 inline-flex items-center gap-1 transition-opacity"
                      style={{ color: '#5B00E8' }}>
                      source <ExternalLink className="w-2.5 h-2.5" />
                    </a>
                  )}
                </div>
              </li>
            ))}
          </ul>
        </Section>
      )}

      {/* ── DIY CTA ── */}
      <div className="rounded-2xl p-6 flex items-center justify-between gap-4 flex-wrap bg-white"
        style={{ border: '1.5px solid rgba(91,0,232,0.12)', boxShadow: '0 4px 24px rgba(91,0,232,0.07)' }}>
        <div>
          <p className="text-[14px] font-bold text-[#0D0D0D] mb-1">Want to customise this architecture?</p>
          <p className="text-[12px] text-[#6B7280]">Open the Playground and wire it up visually — drag nodes, connect ports, test live.</p>
        </div>
        <Link to="/playground"
          className="flex items-center gap-2 h-9 px-5 rounded-xl text-[13px] font-semibold text-white flex-shrink-0 transition-all"
          style={{ background: 'linear-gradient(135deg, #5B00E8, #7C3AED)', boxShadow: '0 2px 14px rgba(91,0,232,0.35)' }}
          onMouseEnter={e => { (e.currentTarget as HTMLElement).style.boxShadow = '0 4px 20px rgba(91,0,232,0.5)'; }}
          onMouseLeave={e => { (e.currentTarget as HTMLElement).style.boxShadow = '0 2px 14px rgba(91,0,232,0.35)'; }}>
          <FlaskConical className="w-4 h-4" /> Open Playground
        </Link>
      </div>

    </motion.div>
    </div>
  );
}
