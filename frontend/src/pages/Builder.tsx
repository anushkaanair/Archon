import { useState, useEffect, useRef } from 'react';
import {
  Sparkles, ArrowRight, Loader2, CheckCircle2, AlertCircle,
  RotateCcw, ChevronDown, ChevronUp, Network, DollarSign,
  Zap, Brain, Star, BookOpen, MessageSquare, Code2, Shield,
  Clock, TrendingUp, Cpu, ExternalLink,
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../context/AuthContext';

import MermaidDiagram from '../components/ui/MermaidDiagram';
import CostTable from '../components/ui/CostTable';
import LatencyTable from '../components/ui/LatencyTable';
import ScoreGauge from '../components/ui/ScoreGauge';
import DownloadButton from '../components/ui/DownloadButton';
import ConstraintInputs from '../components/ui/ConstraintInputs';

// ─── Example prompts ────────────────────────────────────────────────────────
const EXAMPLES = [
  {
    icon: BookOpen,
    title: 'Legal Q&A Bot',
    desc: 'RAG + citation tracking',
    prompt: 'A legal document Q&A bot for law firms that requires high precision, tracks citations, and uses RAG for internal PDF knowledge bases. We expect 50k queries per month with strict GDPR compliance.',
  },
  {
    icon: Code2,
    title: 'Code Review AI',
    desc: 'Static analysis + security',
    prompt: 'An AI-powered code review tool that detects security vulnerabilities and code quality issues in real-time within GitHub PRs. Must handle 10k reviews/month with <2s latency.',
  },
  {
    icon: MessageSquare,
    title: 'Customer Support Bot',
    desc: 'Multi-channel conversational AI',
    prompt: 'A customer support chatbot for a SaaS company that handles billing queries, technical troubleshooting, and escalation routing. Expects 200k messages/month across web and Slack.',
  },
  {
    icon: Shield,
    title: 'Fraud Detection',
    desc: 'Real-time risk scoring',
    prompt: 'A real-time fraud detection pipeline for a fintech company that classifies transactions as fraudulent within 100ms. Processes 5M transactions/day with <0.1% false positive rate required.',
  },
];

// ─── Pipeline steps ──────────────────────────────────────────────────────────
const PIPELINE_STEPS = [
  { label: 'Detecting AI tasks from your description…', icon: Brain, duration: 800 },
  { label: 'Querying model registry…',                  icon: Cpu,   duration: 600 },
  { label: 'Computing model scores (cost · latency · quality · fit)…', icon: TrendingUp, duration: 900 },
  { label: 'Generating architecture graph…',            icon: Network, duration: 700 },
  { label: 'Estimating costs & latency projections…',  icon: DollarSign, duration: 600 },
  { label: 'Running RAGAs evaluation…',                 icon: Star,  duration: 800 },
  { label: 'Generating plain-English explanation…',     icon: BookOpen, duration: 500 },
];

// ─── Score badge ─────────────────────────────────────────────────────────────
function ScoreBadge({ score, size = 'sm' }: { score: number | null | undefined; size?: 'sm' | 'xs' }) {
  if (score == null) return <span className="text-white/25 text-xs font-mono">—</span>;
  const color =
    score >= 0.7 ? 'text-emerald-400 bg-emerald-400/10 ring-emerald-400/20' :
    score >= 0.4 ? 'text-amber-400 bg-amber-400/10 ring-amber-400/20' :
                  'text-red-400 bg-red-400/10 ring-red-400/20';
  return (
    <span className={`font-mono ring-1 rounded-md ${color} ${size === 'xs' ? 'text-[10px] px-1.5 py-0.5' : 'text-xs px-2 py-1'}`}>
      {score.toFixed(2)}
    </span>
  );
}

// ─── Collapsible section ──────────────────────────────────────────────────────
function Section({ title, icon: Icon, children, defaultOpen = true, badge }: {
  title: string; icon: any; children: React.ReactNode; defaultOpen?: boolean; badge?: string;
}) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-white/[0.03] border border-white/8 rounded-2xl overflow-hidden backdrop-blur-sm"
    >
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between px-6 py-4 hover:bg-white/[0.03] transition-colors group"
      >
        <h2 className="text-sm font-semibold text-white/90 flex items-center gap-2.5">
          <span className="p-1.5 rounded-lg bg-archon-core/10 border border-archon-core/15">
            <Icon className="w-3.5 h-3.5 text-archon-mist" />
          </span>
          {title}
          {badge && (
            <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-archon-core/15 text-archon-mist border border-archon-core/20">
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
            <div className="px-6 pb-6">{children}</div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

// ─── Main Builder ─────────────────────────────────────────────────────────────
export default function Builder() {
  const { token } = useAuth();

  const [prompt, setPrompt] = useState('');
  const [budget, setBudget] = useState(0);
  const [maxLatency, setMaxLatency] = useState(3000);
  const [requestVolume, setRequestVolume] = useState(10000);
  const [preferOpenSource, setPreferOpenSource] = useState(false);
  const [showConstraints, setShowConstraints] = useState(false);

  const [loading, setLoading] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);
  const [elapsedMs, setElapsedMs] = useState(0);

  const [result, setResult] = useState<any>(null);
  const [error, setError] = useState('');

  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const startTimeRef = useRef<number>(0);

  // Elapsed timer
  useEffect(() => {
    if (loading) {
      startTimeRef.current = Date.now();
      timerRef.current = setInterval(() => {
        setElapsedMs(Date.now() - startTimeRef.current);
      }, 50);
    } else {
      if (timerRef.current) clearInterval(timerRef.current);
    }
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, [loading]);

  const simulateProgress = async () => {
    setCurrentStep(0);
    for (let i = 0; i < PIPELINE_STEPS.length; i++) {
      setCurrentStep(i);
      await new Promise(r => setTimeout(r, PIPELINE_STEPS[i].duration));
    }
  };

  const handleBuild = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!prompt.trim()) return;
    setLoading(true);
    setError('');
    setResult(null);
    setElapsedMs(0);
    simulateProgress();

    try {
      const res = await fetch('/v1/architect', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token || 'arch_test_key_dev'}`,
        },
        body: JSON.stringify({
          input_text: prompt,
          async_mode: false,
          budget_monthly_usd: budget > 0 ? budget : null,
          max_latency_ms: maxLatency,
          request_volume: requestVolume,
          prefer_open_source: preferOpenSource,
        }),
      });
      const data = await res.json();
      if (!res.ok) { setError(data.detail || data.message || 'Blueprint generation failed.'); return; }
      setResult(data);
    } catch (err: any) {
      setError(err.message || 'Network error — is the backend running?');
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => { setResult(null); setError(''); setCurrentStep(0); setPrompt(''); };

  // ─── Loading view ───────────────────────────────────────────────────────
  if (loading) {
    const pct = Math.min((currentStep / PIPELINE_STEPS.length) * 100, 95);
    return (
      <div className="min-h-[70vh] flex flex-col items-center justify-center gap-10 select-none">
        {/* Multi-ring spinner */}
        <div className="relative flex items-center justify-center" style={{ width: 120, height: 120 }}>
          {/* Outer ring */}
          <div className="absolute inset-0 rounded-full border-2 border-archon-core/20" />
          <div className="absolute inset-0 rounded-full border-2 border-transparent border-t-archon-core animate-spin" />
          {/* Mid ring */}
          <div className="absolute inset-3 rounded-full border border-archon-bright/15" />
          <div
            className="absolute inset-3 rounded-full border border-transparent border-t-archon-bright animate-spin"
            style={{ animationDuration: '1.4s', animationDirection: 'reverse' }}
          />
          {/* Inner glow + logo */}
          <div className="absolute inset-6 rounded-full bg-archon-core/10 flex items-center justify-center">
            <svg width="24" height="24" viewBox="0 0 28 28">
              <polygon points="14,2 24,10 14,18 4,10" fill="#534AB7" />
              <polygon points="14,2 4,10 14,10" fill="#26215C" />
              <polygon points="14,2 24,10 14,10" fill="#7F77DD" />
              <polygon points="4,10 14,18 14,10" fill="#3C3489" />
              <polygon points="24,10 14,18 14,10" fill="#AFA9EC" />
            </svg>
          </div>
        </div>

        {/* Progress bar */}
        <div className="w-full max-w-sm space-y-2">
          <div className="flex justify-between text-xs text-white/30 mb-1">
            <span>Running pipeline…</span>
            <span className="font-mono">{(elapsedMs / 1000).toFixed(1)}s</span>
          </div>
          <div className="h-1 rounded-full bg-white/5 overflow-hidden">
            <motion.div
              className="h-full rounded-full bg-gradient-to-r from-archon-core to-archon-mist"
              animate={{ width: `${pct}%` }}
              transition={{ duration: 0.4, ease: 'easeOut' }}
            />
          </div>
        </div>

        {/* Pipeline steps */}
        <div className="w-full max-w-sm space-y-2.5">
          {PIPELINE_STEPS.map((step, i) => {
            const StepIcon = step.icon;
            const done = i < currentStep;
            const active = i === currentStep;
            return (
              <motion.div
                key={i}
                initial={{ opacity: 0, x: -8 }}
                animate={{ opacity: done ? 0.35 : active ? 1 : 0.18, x: 0 }}
                transition={{ delay: i * 0.05 }}
                className="flex items-center gap-3"
              >
                <div className={`w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0 transition-all ${
                  done ? 'bg-emerald-500/15 border border-emerald-500/30' :
                  active ? 'bg-archon-core/20 border border-archon-core/40 ring-2 ring-archon-core/15' :
                           'bg-white/5 border border-white/8'
                }`}>
                  {done ? (
                    <CheckCircle2 className="w-3 h-3 text-emerald-400" />
                  ) : active ? (
                    <Loader2 className="w-3 h-3 text-archon-mist animate-spin" />
                  ) : (
                    <StepIcon className="w-3 h-3 text-white/20" />
                  )}
                </div>
                <span className={`text-sm transition-colors ${active ? 'text-white' : 'text-white/40'}`}>
                  {step.label}
                </span>
              </motion.div>
            );
          })}
        </div>
      </div>
    );
  }

  // ─── Result view ────────────────────────────────────────────────────────
  if (result) {
    const tasks      = result.detected_tasks ?? [];
    const recs       = result.recommendations ?? [];
    const archDiagram= result.architecture_diagram ?? '';
    const costEst    = result.cost_estimate ?? {};
    const latEst     = result.latency_estimate ?? {};
    const evalScore  = result.eval_score ?? {};
    const explanation= result.explanation ?? '';
    const citations  = result.benchmark_citations ?? [];
    const isLowConf  = result.confidence_flag === 'low_confidence';
    const topModel   = recs[0];
    const totalCost  = costEst.total_monthly_usd ?? 0;
    const totalP95   = latEst.total_p95_ms ?? 0;

    return (
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-5 max-w-5xl">

        {/* ── Header ── */}
        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div className="min-w-0">
            <div className="flex items-center gap-3 mb-2">
              <h1 className="text-xl font-semibold text-white">Architecture Blueprint</h1>
              {isLowConf ? (
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-amber-400/10 text-amber-400 border border-amber-400/20 font-medium">
                  Low Confidence
                </span>
              ) : (
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-400/10 text-emerald-400 border border-emerald-400/20 font-medium">
                  Blueprint Ready
                </span>
              )}
            </div>
            <p className="text-sm text-white/35 line-clamp-2 max-w-2xl">{result.input_text}</p>
          </div>
          <div className="flex items-center gap-2 flex-shrink-0">
            <DownloadButton blueprintData={result} inputText={result.input_text} />
            <button
              onClick={resetForm}
              className="flex items-center gap-2 h-9 px-4 bg-white/5 hover:bg-white/10 border border-white/8 rounded-xl text-xs font-medium text-white/70 hover:text-white transition-all"
            >
              <RotateCcw className="w-3.5 h-3.5" /> New Blueprint
            </button>
          </div>
        </div>

        {/* ── Summary stats bar ── */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {[
            {
              label: 'Detected Tasks',
              value: tasks.length > 0 ? tasks.length : '—',
              sub: tasks.length > 0 ? tasks[0].task.replace('_', ' ') : 'none',
              icon: Brain,
              color: 'text-archon-mist',
            },
            {
              label: 'Models Scored',
              value: recs.length || '—',
              sub: topModel ? topModel.model_name : 'none',
              icon: Star,
              color: 'text-amber-400',
            },
            {
              label: 'Est. Monthly Cost',
              value: totalCost > 0 ? `$${totalCost.toFixed(2)}` : '$0',
              sub: totalCost === 0 ? 'add API key for pricing' : '/month',
              icon: DollarSign,
              color: 'text-emerald-400',
            },
            {
              label: 'P95 Latency',
              value: totalP95 > 0 ? `${totalP95}ms` : '—',
              sub: totalP95 > 0 ? (totalP95 < 1000 ? 'fast' : totalP95 < 3000 ? 'medium' : 'slow') : 'no data',
              icon: Zap,
              color: totalP95 > 0 && totalP95 < 1000 ? 'text-emerald-400' : 'text-amber-400',
            },
          ].map(({ label, value, sub, icon: Icon, color }) => (
            <div key={label} className="bg-white/[0.03] border border-white/8 rounded-xl p-4 flex items-start gap-3">
              <span className={`p-1.5 rounded-lg bg-white/5 flex-shrink-0 ${color}`}>
                <Icon className="w-3.5 h-3.5" />
              </span>
              <div className="min-w-0">
                <p className="text-[10px] font-medium text-white/35 uppercase tracking-wider mb-0.5">{label}</p>
                <p className="text-base font-semibold text-white truncate">{value}</p>
                <p className="text-[10px] text-white/30 capitalize truncate">{sub}</p>
              </div>
            </div>
          ))}
        </div>

        {/* ── Detected task pills ── */}
        {tasks.length > 0 && (
          <div className="flex flex-wrap gap-2">
            {tasks.map((t: any, i: number) => (
              <motion.span
                key={i}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: i * 0.07 }}
                className="flex items-center gap-2 px-3 py-1.5 bg-archon-core/10 border border-archon-core/25 rounded-full text-xs text-archon-mist"
              >
                <span className="w-1.5 h-1.5 rounded-full bg-archon-mist/70 flex-shrink-0" />
                {t.task.replace(/_/g, ' ')}
                <span className="text-archon-mist/40 font-mono">{(t.confidence * 100).toFixed(0)}%</span>
              </motion.span>
            ))}
          </div>
        )}

        {/* ── Low confidence warning ── */}
        {isLowConf && (
          <div className="flex items-start gap-3 bg-amber-500/8 border border-amber-500/20 rounded-xl px-5 py-4 text-sm text-amber-400">
            <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
            <span>
              <strong>Low Confidence</strong> — RAGAs scored below 0.7. Review recommendations before production.
              Add an LLM API key for richer evaluation.
            </span>
          </div>
        )}

        {/* ── Architecture Diagram ── */}
        {archDiagram && (
          <Section title="Architecture Diagram" icon={Network}>
            <MermaidDiagram chart={archDiagram} />
          </Section>
        )}

        {/* ── Model Recommendations — cards for top 3, table for rest ── */}
        {recs.length > 0 && (
          <Section title="Recommended Models" icon={Cpu} badge={`${recs.length} scored`}>
            {/* Top 3 as cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-4">
              {recs.slice(0, 3).map((r: any, i: number) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.08 }}
                  className={`relative rounded-xl border p-4 ${
                    i === 0
                      ? 'border-archon-core/40 bg-archon-core/8 ring-1 ring-archon-core/15'
                      : 'border-white/8 bg-white/[0.02]'
                  }`}
                >
                  {i === 0 && (
                    <div className="absolute -top-2.5 left-4 flex items-center gap-1 px-2 py-0.5 bg-archon-core rounded-full text-[10px] font-semibold text-white">
                      <Star className="w-2.5 h-2.5 fill-current" /> Top Pick
                    </div>
                  )}
                  <div className="mb-3">
                    <p className="font-semibold text-white text-sm">{r.model_name}</p>
                    <p className="text-[10px] text-white/40 capitalize mt-0.5">{r.provider} · {r.task?.replace(/_/g, ' ')}</p>
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    {[
                      { label: 'Composite', val: r.scores?.composite },
                      { label: 'Quality',   val: r.scores?.quality_score },
                      { label: 'Cost',      val: r.scores?.cost_score },
                      { label: 'Latency',   val: r.scores?.latency_score },
                    ].map(({ label, val }) => (
                      <div key={label} className="bg-white/5 rounded-lg px-2.5 py-1.5">
                        <p className="text-[9px] text-white/30 uppercase tracking-wider">{label}</p>
                        <ScoreBadge score={val} size="xs" />
                      </div>
                    ))}
                  </div>
                </motion.div>
              ))}
            </div>

            {/* Remaining models as compact table */}
            {recs.length > 3 && (
              <div className="rounded-xl border border-white/5 overflow-hidden">
                <table className="w-full text-xs">
                  <thead>
                    <tr className="bg-white/3 text-white/30 uppercase tracking-wider">
                      <th className="px-4 py-2.5 text-left">Model</th>
                      <th className="px-4 py-2.5 text-left">Task</th>
                      <th className="px-4 py-2.5 text-right">Composite</th>
                      <th className="px-4 py-2.5 text-right">Cost</th>
                      <th className="px-4 py-2.5 text-right">Quality</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/5">
                    {recs.slice(3).map((r: any, i: number) => (
                      <tr key={i} className="hover:bg-white/3 transition-colors">
                        <td className="px-4 py-2.5">
                          <span className="font-medium text-white/80">{r.model_name}</span>
                          <span className="block text-white/30 capitalize text-[10px]">{r.provider}</span>
                        </td>
                        <td className="px-4 py-2.5 text-white/40 capitalize">{r.task?.replace(/_/g, ' ')}</td>
                        <td className="px-4 py-2.5 text-right"><ScoreBadge score={r.scores?.composite} size="xs" /></td>
                        <td className="px-4 py-2.5 text-right"><ScoreBadge score={r.scores?.cost_score} size="xs" /></td>
                        <td className="px-4 py-2.5 text-right"><ScoreBadge score={r.scores?.quality_score} size="xs" /></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </Section>
        )}

        {/* ── Cost + Latency side by side ── */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
          {costEst.breakdown?.length > 0 && (
            <Section title="Cost Estimate" icon={DollarSign}>
              <CostTable breakdown={costEst.breakdown} totalMonthly={totalCost} requestVolume={requestVolume} />
            </Section>
          )}
          {latEst.breakdown?.length > 0 && (
            <Section title="Latency Estimate" icon={Zap}>
              <LatencyTable breakdown={latEst.breakdown} totalP95={totalP95} />
            </Section>
          )}
        </div>

        {/* ── Explanation ── */}
        {explanation && (
          <Section title="Why This Stack?" icon={BookOpen}>
            <p className="text-sm text-white/65 leading-7 whitespace-pre-wrap">{explanation}</p>
          </Section>
        )}

        {/* ── RAGAs Eval ── */}
        <Section title="RAGAs Quality Evaluation" icon={Brain} defaultOpen={false}>
          <div className="flex items-center gap-10 flex-wrap">
            <ScoreGauge score={evalScore.composite ?? null} label="Composite" size="lg" />
            <div className="grid grid-cols-2 gap-4">
              {[
                { label: 'Faithfulness',     key: 'faithfulness' },
                { label: 'Ans. Relevancy',   key: 'answer_relevancy' },
                { label: 'Ctx. Precision',   key: 'context_precision' },
                { label: 'Ctx. Recall',      key: 'context_recall' },
              ].map(({ label, key }) => (
                <ScoreGauge key={key} score={evalScore[key] ?? null} label={label} size="sm" />
              ))}
            </div>
          </div>
          {evalScore.is_low_confidence && (
            <p className="mt-4 text-xs text-amber-400/70 leading-relaxed max-w-lg">
              Scores are null — RAGAs requires an LLM key to evaluate faithfulness & relevancy.
              Add <code className="bg-white/5 px-1 rounded">OPENAI_API_KEY</code> or{' '}
              <code className="bg-white/5 px-1 rounded">ANTHROPIC_API_KEY</code> in <code className="bg-white/5 px-1 rounded">.env</code>.
            </p>
          )}
        </Section>

        {/* ── Citations ── */}
        {citations.length > 0 && (
          <Section title={`Benchmark Citations`} icon={ExternalLink} defaultOpen={false} badge={`${citations.length}`}>
            <ul className="space-y-2.5">
              {citations.map((c: any, i: number) => (
                <li key={i} className="flex items-start gap-3 text-xs text-white/45">
                  <span className="text-archon-mist font-mono text-[10px] mt-0.5">[{i + 1}]</span>
                  <div>
                    <span className="text-white/65">{c.metric}:</span> {c.value}
                    {c.source && (
                      <a href={c.source} target="_blank" rel="noopener noreferrer"
                        className="ml-2 text-archon-mist/70 hover:text-archon-mist underline underline-offset-2 inline-flex items-center gap-1">
                        source <ExternalLink className="w-2.5 h-2.5" />
                      </a>
                    )}
                  </div>
                </li>
              ))}
            </ul>
          </Section>
        )}

        {/* ── Bottom CTA ── */}
        <div className="flex items-center justify-center py-6">
          <button
            onClick={resetForm}
            className="flex items-center gap-2 h-10 px-8 bg-archon-core hover:bg-archon-bright rounded-xl text-sm font-medium text-white transition-all shadow-[0_0_24px_rgba(83,74,183,0.25)] hover:shadow-[0_0_32px_rgba(83,74,183,0.4)]"
          >
            <RotateCcw className="w-4 h-4" /> Generate Another Blueprint
          </button>
        </div>
      </motion.div>
    );
  }

  // ─── Input form view ────────────────────────────────────────────────────
  const charCount = prompt.length;

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="max-w-3xl space-y-6"
    >
      {/* Header */}
      <header>
        <div className="flex items-center gap-3 mb-2">
          <div className="p-2 rounded-xl bg-archon-core/15 border border-archon-core/20">
            <Sparkles className="w-5 h-5 text-archon-mist" />
          </div>
          <div>
            <h1 className="text-2xl font-semibold text-white tracking-tight">Architecture Builder</h1>
            <p className="text-white/40 text-xs mt-0.5">
              Describe your product → get a complete, scored AI stack blueprint
            </p>
          </div>
        </div>
      </header>

      {/* Example prompts */}
      <div>
        <p className="text-xs font-medium text-white/30 uppercase tracking-wider mb-3">Try an example</p>
        <div className="grid grid-cols-2 gap-2.5">
          {EXAMPLES.map((ex) => {
            const Ex = ex.icon;
            return (
              <button
                key={ex.title}
                onClick={() => setPrompt(ex.prompt)}
                className={`group text-left p-3.5 rounded-xl border transition-all ${
                  prompt === ex.prompt
                    ? 'border-archon-core/50 bg-archon-core/10 ring-1 ring-archon-core/20'
                    : 'border-white/8 bg-white/[0.02] hover:border-white/15 hover:bg-white/[0.04]'
                }`}
              >
                <div className="flex items-center gap-2.5 mb-1.5">
                  <Ex className={`w-3.5 h-3.5 transition-colors ${prompt === ex.prompt ? 'text-archon-mist' : 'text-white/30 group-hover:text-white/60'}`} />
                  <span className="text-sm font-medium text-white/80">{ex.title}</span>
                </div>
                <p className="text-xs text-white/30">{ex.desc}</p>
              </button>
            );
          })}
        </div>
      </div>

      <form onSubmit={handleBuild} className="space-y-4">
        {/* Prompt input */}
        <div className="relative group">
          {/* Ambient glow */}
          <div className="absolute -inset-px rounded-2xl bg-gradient-to-br from-archon-core/20 via-transparent to-archon-bright/10 opacity-0 group-focus-within:opacity-100 transition-opacity pointer-events-none" />
          <div className="relative bg-[#0d0b1a] border border-white/8 group-focus-within:border-archon-core/50 rounded-2xl transition-all">
            <div className="flex items-center gap-2 px-5 pt-4 pb-2 border-b border-white/5">
              <Sparkles className="w-3.5 h-3.5 text-archon-mist/60" />
              <span className="text-xs font-medium text-white/50">Product Description</span>
            </div>
            <textarea
              value={prompt}
              onChange={e => setPrompt(e.target.value)}
              className="w-full bg-transparent px-5 py-4 text-sm text-white placeholder:text-white/18 focus:outline-none min-h-[180px] resize-none leading-relaxed"
              placeholder="Describe your product idea in detail — include the use case, target users, expected scale (requests/month), latency requirements, compliance needs, and any preference for open-source models…"
              required
            />
            <div className="flex items-center justify-between px-5 py-3 border-t border-white/5">
              <p className="text-[10px] text-white/20">Be specific — more detail = better blueprint</p>
              <span className={`text-[10px] font-mono ${charCount > 4500 ? 'text-red-400' : charCount > 3000 ? 'text-amber-400' : 'text-white/20'}`}>
                {charCount}/5000
              </span>
            </div>
          </div>
        </div>

        {/* Constraints accordion */}
        <div className="border border-white/8 rounded-xl overflow-hidden">
          <button
            type="button"
            onClick={() => setShowConstraints(!showConstraints)}
            className="w-full flex items-center justify-between px-5 py-3.5 hover:bg-white/[0.02] transition-colors"
          >
            <div className="flex items-center gap-2">
              <Clock className="w-3.5 h-3.5 text-white/30" />
              <span className="text-sm text-white/50">Constraints &amp; preferences</span>
              {(budget > 0 || preferOpenSource) && (
                <span className="text-[10px] px-1.5 py-0.5 rounded bg-archon-core/20 text-archon-mist border border-archon-core/25">
                  {[budget > 0 && `$${budget}/mo cap`, preferOpenSource && 'OSS preferred'].filter(Boolean).join(' · ')}
                </span>
              )}
            </div>
            {showConstraints ? <ChevronUp className="w-4 h-4 text-white/25" /> : <ChevronDown className="w-4 h-4 text-white/25" />}
          </button>
          <AnimatePresence>
            {showConstraints && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={{ duration: 0.2 }}
                className="overflow-hidden border-t border-white/5"
              >
                <ConstraintInputs
                  budget={budget} setBudget={setBudget}
                  maxLatency={maxLatency} setMaxLatency={setMaxLatency}
                  requestVolume={requestVolume} setRequestVolume={setRequestVolume}
                  preferOpenSource={preferOpenSource} setPreferOpenSource={setPreferOpenSource}
                />
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Error */}
        {error && (
          <div className="flex items-start gap-3 bg-red-500/8 border border-red-500/20 rounded-xl px-5 py-4 text-sm text-red-400">
            <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
            {error}
          </div>
        )}

        {/* Pipeline hint + submit */}
        <div className="flex items-center justify-between gap-4">
          <div className="hidden sm:flex items-center gap-1.5 text-[10px] text-white/20 flex-wrap">
            {['Analyze', 'Score', 'Architect', 'Estimate', 'Evaluate', 'Explain'].map((s, i, arr) => (
              <span key={s} className="flex items-center gap-1.5">
                <span>{s}</span>
                {i < arr.length - 1 && <ArrowRight className="w-2.5 h-2.5 opacity-40" />}
              </span>
            ))}
          </div>
          <button
            type="submit"
            disabled={loading || !prompt.trim() || charCount > 5000}
            className="flex-shrink-0 h-11 px-8 rounded-xl text-sm font-semibold text-white transition-all flex items-center gap-2
              bg-archon-core hover:bg-archon-bright
              disabled:bg-white/5 disabled:text-white/25 disabled:border disabled:border-white/8
              shadow-[0_0_24px_rgba(83,74,183,0.35)] hover:shadow-[0_0_32px_rgba(83,74,183,0.5)]
              disabled:shadow-none"
          >
            Generate Blueprint <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </form>
    </motion.div>
  );
}
