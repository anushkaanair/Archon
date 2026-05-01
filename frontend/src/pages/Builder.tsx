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

const EXAMPLES = [
  {
    icon: BookOpen,
    title: 'Legal Q&A Bot',
    desc: 'RAG + citation tracking for law firms',
    prompt: 'A legal document Q&A bot for law firms that requires high precision, tracks citations, and uses RAG for internal PDF knowledge bases. We expect 50k queries per month with strict GDPR compliance.',
  },
  {
    icon: Code2,
    title: 'Code Review AI',
    desc: 'Static analysis + security scanning',
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
    desc: 'Real-time risk scoring at scale',
    prompt: 'A real-time fraud detection pipeline for a fintech company that classifies transactions as fraudulent within 100ms. Processes 5M transactions/day with <0.1% false positive rate required.',
  },
];

const PIPELINE_STEPS = [
  { label: 'Detecting AI tasks from your description…', icon: Brain,      duration: 800  },
  { label: 'Querying model registry…',                  icon: Cpu,        duration: 600  },
  { label: 'Computing model scores (cost · latency · quality · fit)…', icon: TrendingUp, duration: 900 },
  { label: 'Generating architecture graph…',            icon: Network,    duration: 700  },
  { label: 'Estimating costs & latency projections…',   icon: DollarSign, duration: 600  },
  { label: 'Running RAGAs evaluation…',                 icon: Star,       duration: 800  },
  { label: 'Generating plain-English explanation…',     icon: BookOpen,   duration: 500  },
];

function ScoreBadge({ score, size = 'sm' }: { score: number | null | undefined; size?: 'sm' | 'xs' }) {
  if (score == null) return <span className="text-[#9CA3AF] text-xs font-mono">—</span>;
  const [c, bg] =
    score >= 0.7 ? ['#059669', 'rgba(5,150,105,0.1)'] :
    score >= 0.4 ? ['#D97706', 'rgba(217,119,6,0.1)'] :
                   ['#EF4444', 'rgba(239,68,68,0.1)'];
  return (
    <span className={`font-mono rounded-md ${size === 'xs' ? 'text-[10px] px-1.5 py-0.5' : 'text-xs px-2 py-1'}`}
      style={{ color: c, background: bg, border: `1px solid ${c}25` }}>
      {score.toFixed(2)}
    </span>
  );
}

function Section({ title, icon: Icon, children, defaultOpen = true, badge }: {
  title: string; icon: any; children: React.ReactNode; defaultOpen?: boolean; badge?: string;
}) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      className="rounded-2xl overflow-hidden bg-white"
      style={{ border: '1.5px solid rgba(91,0,232,0.12)', boxShadow: '0 4px 24px rgba(91,0,232,0.07)' }}
    >
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between px-6 py-4 hover:bg-[#F9FAFB] transition-colors group"
        style={{ borderBottom: open ? '1.5px solid rgba(91,0,232,0.08)' : 'none' }}
      >
        <h2 className="text-[13px] font-semibold text-[#0D0D0D] flex items-center gap-3">
          <span className="w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0"
            style={{ background: 'rgba(91,0,232,0.1)', border: '1px solid rgba(91,0,232,0.2)' }}>
            <Icon className="w-3.5 h-3.5 text-[#5B00E8]" />
          </span>
          {title}
          {badge && (
            <span className="text-[10px] font-mono px-2 py-0.5 rounded-full"
              style={{ background: 'rgba(91,0,232,0.08)', color: '#5B00E8', border: '1px solid rgba(91,0,232,0.2)' }}>
              {badge}
            </span>
          )}
        </h2>
        <span className="text-[#9CA3AF] group-hover:text-[#6B7280] transition-colors">
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
            <div className="px-6 py-6">{children}</div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

export default function Builder() {
  const { token } = useAuth();

  const [prompt, setPrompt]                 = useState('');
  const [budget, setBudget]                 = useState(0);
  const [maxLatency, setMaxLatency]         = useState(3000);
  const [requestVolume, setRequestVolume]   = useState(10000);
  const [preferOpenSource, setPreferOpenSource] = useState(false);
  const [compliance, setCompliance]         = useState<string[]>([]);
  const [teamSize, setTeamSize]             = useState('Solo dev');
  const [region, setRegion]                 = useState('English only');
  const [deployment, setDeployment]         = useState('Cloud SaaS');
  const [priority, setPriority]             = useState<'cost' | 'latency' | 'quality'>('quality');
  const [showConstraints, setShowConstraints] = useState(false);

  const [loading, setLoading]         = useState(false);
  const [currentStep, setCurrentStep] = useState(0);
  const [elapsedMs, setElapsedMs]     = useState(0);
  const [result, setResult]           = useState<any>(null);
  const [error, setError]             = useState('');

  const timerRef     = useRef<ReturnType<typeof setInterval> | null>(null);
  const startTimeRef = useRef<number>(0);

  useEffect(() => {
    if (loading) {
      startTimeRef.current = Date.now();
      timerRef.current = setInterval(() => setElapsedMs(Date.now() - startTimeRef.current), 50);
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
    setLoading(true); setError(''); setResult(null); setElapsedMs(0);
    simulateProgress();
    try {
      const res = await fetch('/v1/architect', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token || 'arch_test_key_dev'}` },
        body: JSON.stringify({
          input_text: prompt, async_mode: false,
          budget_monthly_usd: budget > 0 ? budget : null,
          max_latency_ms: maxLatency, request_volume: requestVolume,
          prefer_open_source: preferOpenSource,
          compliance_requirements: compliance,
          team_size: teamSize,
          region,
          deployment_target: deployment,
          optimization_priority: priority,
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

  // ─── Loading view ────────────────────────────────────────────────────────────
  if (loading) {
    const pct = Math.min((currentStep / PIPELINE_STEPS.length) * 100, 95);
    return (
      <div className="min-h-[70vh] flex flex-col items-center justify-center gap-10 select-none">
        <div className="relative flex items-center justify-center" style={{ width: 120, height: 120 }}>
          <div className="absolute inset-0 rounded-full" style={{ border: '2px solid rgba(91,0,232,0.15)' }} />
          <div className="absolute inset-0 rounded-full animate-spin" style={{ border: '2px solid transparent', borderTop: '2px solid #5B00E8' }} />
          <div className="absolute inset-3 rounded-full" style={{ border: '1px solid rgba(91,0,232,0.1)' }} />
          <div className="absolute inset-3 rounded-full animate-spin" style={{ border: '1px solid transparent', borderTop: '1px solid #8B3DFF', animationDuration: '1.4s', animationDirection: 'reverse' }} />
          <div className="absolute inset-6 rounded-full flex items-center justify-center" style={{ background: 'rgba(91,0,232,0.08)' }}>
            <Sparkles className="w-6 h-6 text-[#5B00E8]" />
          </div>
        </div>

        <div className="w-full max-w-sm space-y-2">
          <div className="flex justify-between text-[11px] text-[#9CA3AF] mb-1">
            <span>Running pipeline…</span>
            <span className="font-mono">{(elapsedMs / 1000).toFixed(1)}s</span>
          </div>
          <div className="h-1.5 rounded-full overflow-hidden" style={{ background: '#EDE9FF' }}>
            <motion.div
              className="h-full rounded-full"
              animate={{ width: `${pct}%` }}
              transition={{ duration: 0.4, ease: 'easeOut' }}
              style={{ background: 'linear-gradient(90deg, #5B00E8, #8B3DFF)' }}
            />
          </div>
        </div>

        <div className="w-full max-w-sm space-y-2.5">
          {PIPELINE_STEPS.map((step, i) => {
            const StepIcon = step.icon;
            const done   = i < currentStep;
            const active = i === currentStep;
            return (
              <motion.div key={i} initial={{ opacity: 0, x: -8 }} animate={{ opacity: done ? 0.4 : active ? 1 : 0.2, x: 0 }} transition={{ delay: i * 0.05 }}
                className="flex items-center gap-3">
                <div className={`w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0 transition-all`}
                  style={{
                    background: done ? 'rgba(5,150,105,0.1)' : active ? 'rgba(91,0,232,0.12)' : '#F4F2FF',
                    border: done ? '1px solid rgba(5,150,105,0.3)' : active ? '1px solid rgba(91,0,232,0.4)' : '1px solid rgba(91,0,232,0.1)',
                  }}>
                  {done   ? <CheckCircle2 className="w-3 h-3 text-[#059669]" /> :
                   active ? <Loader2 className="w-3 h-3 text-[#5B00E8] animate-spin" /> :
                            <StepIcon className="w-3 h-3 text-[#9CA3AF]" />}
                </div>
                <span className={`text-[13px] ${active ? 'text-[#0D0D0D] font-medium' : 'text-[#9CA3AF]'}`}>{step.label}</span>
              </motion.div>
            );
          })}
        </div>
      </div>
    );
  }

  // ─── Result view ─────────────────────────────────────────────────────────────
  if (result) {
    const tasks       = result.detected_tasks ?? [];
    const recs        = result.recommendations ?? [];
    const archDiagram = result.architecture_diagram ?? '';
    const costEst     = result.cost_estimate ?? {};
    const latEst      = result.latency_estimate ?? {};
    const evalScore   = result.eval_score ?? {};
    const explanation = result.explanation ?? '';
    const citations   = result.benchmark_citations ?? [];
    const isLowConf   = result.confidence_flag === 'low_confidence';
    const topModel    = recs[0];
    const totalCost   = costEst.total_monthly_usd ?? 0;
    const totalP95    = latEst.total_p95_ms ?? 0;

    return (
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-5 max-w-5xl">

        {/* Header */}
        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div className="min-w-0">
            <div className="flex items-center gap-3 mb-2">
              <h1 className="font-display text-2xl font-extrabold text-[#0D0D0D] tracking-tight">Architecture Blueprint</h1>
              {isLowConf ? (
                <span className="text-[10px] px-2.5 py-1 rounded-full font-semibold"
                  style={{ background: 'rgba(217,119,6,0.1)', color: '#D97706', border: '1px solid rgba(217,119,6,0.25)' }}>
                  Low Confidence
                </span>
              ) : (
                <span className="text-[10px] px-2.5 py-1 rounded-full font-semibold"
                  style={{ background: 'rgba(5,150,105,0.1)', color: '#059669', border: '1px solid rgba(5,150,105,0.25)' }}>
                  Blueprint Ready
                </span>
              )}
            </div>
            <p className="text-[13px] text-[#6B7280] line-clamp-2 max-w-2xl">{result.input_text}</p>
          </div>
          <div className="flex items-center gap-2 flex-shrink-0">
            <DownloadButton blueprintData={result} inputText={result.input_text} />
            <button onClick={resetForm}
              className="flex items-center gap-2 h-9 px-4 rounded-xl text-[12px] font-medium transition-all"
              style={{ background: 'white', border: '1.5px solid rgba(91,0,232,0.2)', color: '#374151' }}>
              <RotateCcw className="w-3.5 h-3.5" /> New Blueprint
            </button>
          </div>
        </div>

        {/* Summary stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {[
            { label: 'Detected Tasks',    value: tasks.length > 0 ? tasks.length : '—',             sub: tasks.length > 0 ? tasks[0].task.replace('_', ' ') : 'none', icon: Brain,     color: '#5B00E8' },
            { label: 'Models Scored',     value: recs.length || '—',                                 sub: topModel ? topModel.model_name : 'none',                    icon: Star,      color: '#D97706' },
            { label: 'Est. Monthly Cost', value: totalCost > 0 ? `$${totalCost.toFixed(2)}` : '$0', sub: totalCost === 0 ? 'add API key for pricing' : '/month',       icon: DollarSign,color: '#059669' },
            { label: 'P95 Latency',       value: totalP95 > 0 ? `${totalP95}ms` : '—',              sub: totalP95 > 0 ? (totalP95 < 1000 ? 'fast' : totalP95 < 3000 ? 'medium' : 'slow') : 'no data', icon: Zap, color: '#3B82F6' },
          ].map(({ label, value, sub, icon: Icon, color }) => (
            <div key={label} className="rounded-xl p-4 flex items-start gap-3 bg-white"
              style={{ border: '1.5px solid rgba(91,0,232,0.12)', boxShadow: '0 4px 24px rgba(91,0,232,0.07)' }}>
              <span className="w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0"
                style={{ background: `${color}12`, border: `1px solid ${color}25` }}>
                <Icon className="w-3.5 h-3.5" style={{ color }} />
              </span>
              <div className="min-w-0">
                <p className="text-[10px] font-semibold text-[#9CA3AF] uppercase tracking-wider mb-0.5">{label}</p>
                <p className="text-[15px] font-bold text-[#0D0D0D] truncate">{value}</p>
                <p className="text-[10px] text-[#9CA3AF] capitalize truncate">{sub}</p>
              </div>
            </div>
          ))}
        </div>

        {/* Task pills */}
        {tasks.length > 0 && (
          <div className="flex flex-wrap gap-2">
            {tasks.map((t: any, i: number) => (
              <motion.span key={i} initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: i * 0.07 }}
                className="flex items-center gap-2 px-3 py-1.5 rounded-full text-[11px] font-medium"
                style={{ background: 'rgba(91,0,232,0.08)', border: '1px solid rgba(91,0,232,0.2)', color: '#5B00E8' }}>
                <span className="w-1.5 h-1.5 rounded-full flex-shrink-0 bg-[#5B00E8]" />
                {t.task.replace(/_/g, ' ')}
                <span className="font-mono text-[#8B3DFF]">{(t.confidence * 100).toFixed(0)}%</span>
              </motion.span>
            ))}
          </div>
        )}

        {isLowConf && (
          <div className="flex items-start gap-3 rounded-xl px-5 py-4 text-[13px]"
            style={{ background: 'rgba(217,119,6,0.06)', border: '1px solid rgba(217,119,6,0.2)', color: '#D97706' }}>
            <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
            <span><strong>Low Confidence</strong> — RAGAs scored below 0.7. Review recommendations before production. Add an LLM API key for richer evaluation.</span>
          </div>
        )}

        {/* Architecture Diagram */}
        {archDiagram && (
          <Section title="Architecture Diagram" icon={Network}>
            <MermaidDiagram chart={archDiagram} />
          </Section>
        )}

        {/* Model Recommendations */}
        {recs.length > 0 && (
          <Section title="Recommended Models" icon={Cpu} badge={`${recs.length} scored`}>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-4">
              {recs.slice(0, 3).map((r: any, i: number) => (
                <motion.div key={i} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.08 }}
                  className="relative rounded-xl p-4"
                  style={{
                    background: i === 0 ? 'rgba(91,0,232,0.05)' : '#F9FAFB',
                    border: i === 0 ? '1.5px solid rgba(91,0,232,0.35)' : '1.5px solid rgba(91,0,232,0.1)',
                    boxShadow: i === 0 ? '0 4px 20px rgba(91,0,232,0.1)' : 'none',
                  }}>
                  {i === 0 && (
                    <div className="absolute -top-3 left-4 flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold text-white"
                      style={{ background: 'linear-gradient(135deg, #5B00E8, #8B3DFF)' }}>
                      <Star className="w-2.5 h-2.5 fill-current" /> Top Pick
                    </div>
                  )}
                  <p className="font-semibold text-[#0D0D0D] text-[13px] mb-0.5">{r.model_name}</p>
                  <p className="text-[10px] text-[#6B7280] capitalize mb-3">{r.provider} · {r.task?.replace(/_/g, ' ')}</p>
                  <div className="grid grid-cols-2 gap-2">
                    {[{ label: 'Composite', val: r.scores?.composite }, { label: 'Quality', val: r.scores?.quality_score }, { label: 'Cost', val: r.scores?.cost_score }, { label: 'Latency', val: r.scores?.latency_score }].map(({ label, val }) => (
                      <div key={label} className="rounded-lg px-2.5 py-1.5" style={{ background: 'rgba(91,0,232,0.04)' }}>
                        <p className="text-[9px] text-[#9CA3AF] uppercase tracking-wider mb-0.5">{label}</p>
                        <ScoreBadge score={val} size="xs" />
                      </div>
                    ))}
                  </div>
                </motion.div>
              ))}
            </div>
            {recs.length > 3 && (
              <div className="rounded-xl overflow-hidden" style={{ border: '1.5px solid rgba(91,0,232,0.1)' }}>
                <table className="w-full text-[12px]">
                  <thead>
                    <tr className="text-[#9CA3AF] uppercase tracking-wider text-[10px]"
                      style={{ borderBottom: '1.5px solid rgba(91,0,232,0.08)', background: '#F9FAFB' }}>
                      <th className="px-4 py-2.5 text-left">Model</th>
                      <th className="px-4 py-2.5 text-left">Task</th>
                      <th className="px-4 py-2.5 text-right">Composite</th>
                      <th className="px-4 py-2.5 text-right">Cost</th>
                      <th className="px-4 py-2.5 text-right">Quality</th>
                    </tr>
                  </thead>
                  <tbody>
                    {recs.slice(3).map((r: any, i: number) => (
                      <tr key={i} className="transition-colors" style={{ borderTop: '1px solid rgba(91,0,232,0.06)' }}
                        onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = '#F9FAFB'; }}
                        onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = 'white'; }}>
                        <td className="px-4 py-2.5">
                          <span className="font-medium text-[#374151]">{r.model_name}</span>
                          <span className="block text-[#9CA3AF] capitalize text-[10px]">{r.provider}</span>
                        </td>
                        <td className="px-4 py-2.5 text-[#6B7280] capitalize">{r.task?.replace(/_/g, ' ')}</td>
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

        {/* Cost + Latency */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
          <Section title="Cost Estimate" icon={DollarSign}>
            {costEst.breakdown?.length > 0
              ? <CostTable breakdown={costEst.breakdown} totalMonthly={totalCost} requestVolume={requestVolume} />
              : <p className="text-[13px] text-[#9CA3AF] py-4 text-center">No cost data. Add an LLM API key for live pricing.</p>}
          </Section>
          <Section title="Latency Estimate" icon={Zap}>
            {latEst.breakdown?.length > 0
              ? <LatencyTable breakdown={latEst.breakdown} totalP95={totalP95} />
              : <p className="text-[13px] text-[#9CA3AF] py-4 text-center">No latency data available.</p>}
          </Section>
        </div>

        {/* Explanation */}
        {explanation && (
          <Section title="Why This Stack?" icon={BookOpen}>
            <div className="space-y-3">
              {explanation.split('\n\n').filter(Boolean).map((para: string, i: number) => (
                <p key={i} className="text-[13px] text-[#374151] leading-[1.8]">{para}</p>
              ))}
            </div>
          </Section>
        )}

        {/* RAGAs Evaluation */}
        <Section title="RAGAs Quality Evaluation" icon={Brain} defaultOpen={false}>
          <div className="flex items-center gap-10 flex-wrap">
            <ScoreGauge score={evalScore.composite ?? null} label="Composite" size="lg" />
            <div className="grid grid-cols-2 gap-4">
              {[{ label: 'Faithfulness', key: 'faithfulness' }, { label: 'Ans. Relevancy', key: 'answer_relevancy' }, { label: 'Ctx. Precision', key: 'context_precision' }, { label: 'Ctx. Recall', key: 'context_recall' }].map(({ label, key }) => (
                <ScoreGauge key={key} score={evalScore[key] ?? null} label={label} size="sm" />
              ))}
            </div>
          </div>
          {evalScore.is_low_confidence && (
            <p className="mt-4 text-[12px] leading-relaxed max-w-lg text-[#D97706]">
              Scores are null — RAGAs requires an LLM key. Add <code className="bg-[#F4F2FF] px-1 rounded text-[#5B00E8]">OPENAI_API_KEY</code> or <code className="bg-[#F4F2FF] px-1 rounded text-[#5B00E8]">ANTHROPIC_API_KEY</code> in <code className="bg-[#F4F2FF] px-1 rounded">.env</code>.
            </p>
          )}
        </Section>

        {/* Citations */}
        {citations.length > 0 && (
          <Section title="Benchmark Citations" icon={ExternalLink} defaultOpen={false} badge={`${citations.length}`}>
            <ul className="space-y-2.5">
              {citations.map((c: any, i: number) => (
                <li key={i} className="flex items-start gap-3 text-[12px] text-[#6B7280]">
                  <span className="font-mono text-[10px] mt-0.5 text-[#5B00E8]">[{i + 1}]</span>
                  <div>
                    <span className="text-[#374151] font-medium">{c.metric}:</span> {c.value}
                    {c.source && (
                      <a href={c.source} target="_blank" rel="noopener noreferrer"
                        className="ml-2 hover:opacity-70 underline underline-offset-2 inline-flex items-center gap-1 transition-opacity text-[#5B00E8]">
                        source <ExternalLink className="w-2.5 h-2.5" />
                      </a>
                    )}
                  </div>
                </li>
              ))}
            </ul>
          </Section>
        )}

        <div className="flex items-center justify-center py-6">
          <button onClick={resetForm}
            className="flex items-center gap-2 h-10 px-8 rounded-xl text-[13px] font-semibold text-white transition-all"
            style={{ background: '#5B00E8', boxShadow: '0 2px 20px rgba(91,0,232,0.35)' }}>
            <RotateCcw className="w-4 h-4" /> Generate Another Blueprint
          </button>
        </div>
      </motion.div>
    );
  }

  // ─── Input form view ─────────────────────────────────────────────────────────
  const charCount = prompt.length;

  return (
    <div className="space-y-7 max-w-3xl">

      {/* Hero header */}
      <div className="relative rounded-2xl overflow-hidden px-8 py-10"
        style={{ background: 'linear-gradient(135deg, rgba(91,0,232,0.06) 0%, #ffffff 70%)', border: '1.5px solid rgba(91,0,232,0.15)', boxShadow: '0 4px 24px rgba(91,0,232,0.07)' }}>
        <div className="absolute top-0 left-1/3 w-96 h-36 pointer-events-none"
          style={{ background: 'radial-gradient(ellipse, rgba(91,0,232,0.12) 0%, transparent 70%)' }} />
        <div className="relative">
          <div className="flex items-center gap-3 mb-5">
            <div className="p-2.5 rounded-xl" style={{ background: 'rgba(91,0,232,0.1)', border: '1px solid rgba(91,0,232,0.2)' }}>
              <Sparkles className="w-5 h-5 text-[#5B00E8]" />
            </div>
            <span className="text-[10px] font-bold uppercase tracking-[0.15em] px-2.5 py-1 rounded-full"
              style={{ background: 'rgba(91,0,232,0.08)', color: '#5B00E8', border: '1px solid rgba(91,0,232,0.2)' }}>
              AI Architect
            </span>
          </div>
          <h1 className="font-display text-[32px] font-extrabold tracking-tight mb-3 text-[#0D0D0D]">
            Blueprint Builder
          </h1>
          <p className="text-[14px] text-[#6B7280] max-w-lg leading-relaxed">
            Describe your product in plain English — get a complete, scored AI stack with architecture diagram, cost & latency projections.
          </p>
        </div>
      </div>

      {/* Example prompts */}
      <div>
        <p className="text-[10px] font-semibold text-[#9CA3AF] uppercase tracking-[0.15em] mb-3">Start from a template</p>
        <div className="grid grid-cols-2 gap-2.5">
          {EXAMPLES.map((ex) => {
            const Ex = ex.icon;
            const isSelected = prompt === ex.prompt;
            return (
              <button key={ex.title} onClick={() => setPrompt(ex.prompt)}
                className="group text-left p-4 rounded-xl bg-white transition-all"
                style={{
                  border: isSelected ? '1.5px solid #5B00E8' : '1.5px solid rgba(91,0,232,0.12)',
                  boxShadow: isSelected ? '0 4px 20px rgba(91,0,232,0.15)' : '0 4px 24px rgba(91,0,232,0.07)',
                  background: isSelected ? 'rgba(91,0,232,0.04)' : 'white',
                }}
                onMouseEnter={e => { if (!isSelected) (e.currentTarget as HTMLElement).style.borderColor = 'rgba(91,0,232,0.3)'; }}
                onMouseLeave={e => { if (!isSelected) (e.currentTarget as HTMLElement).style.borderColor = 'rgba(91,0,232,0.12)'; }}
              >
                <div className="flex items-center gap-2.5 mb-2">
                  <div className="w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0"
                    style={{ background: isSelected ? 'rgba(91,0,232,0.1)' : '#F4F2FF' }}>
                    <Ex className={`w-3.5 h-3.5 ${isSelected ? 'text-[#5B00E8]' : 'text-[#9CA3AF] group-hover:text-[#5B00E8]'} transition-colors`} />
                  </div>
                  <span className="text-[13px] font-semibold text-[#374151] group-hover:text-[#0D0D0D] transition-colors">{ex.title}</span>
                </div>
                <p className="text-[11px] text-[#9CA3AF] leading-relaxed ml-9">{ex.desc}</p>
              </button>
            );
          })}
        </div>
      </div>

      <form onSubmit={handleBuild} className="space-y-4">

        {/* Prompt textarea */}
        <div className="relative rounded-2xl overflow-hidden bg-white transition-all"
          style={{ border: '1.5px solid rgba(91,0,232,0.2)', boxShadow: '0 4px 24px rgba(91,0,232,0.07)' }}
          onFocusCapture={e => { (e.currentTarget as HTMLElement).style.borderColor = '#5B00E8'; (e.currentTarget as HTMLElement).style.boxShadow = '0 0 0 3px rgba(91,0,232,0.08), 0 4px 24px rgba(91,0,232,0.07)'; }}
          onBlurCapture={e => { (e.currentTarget as HTMLElement).style.borderColor = 'rgba(91,0,232,0.2)'; (e.currentTarget as HTMLElement).style.boxShadow = '0 4px 24px rgba(91,0,232,0.07)'; }}
        >
          <div className="flex items-center gap-2 px-5 pt-4 pb-2.5" style={{ borderBottom: '1.5px solid rgba(91,0,232,0.08)' }}>
            <Sparkles className="w-3.5 h-3.5 text-[#5B00E8]" />
            <span className="text-[10px] font-bold uppercase tracking-[0.15em] text-[#6B7280]">Product Description</span>
          </div>
          <textarea
            value={prompt}
            onChange={e => setPrompt(e.target.value)}
            className="w-full bg-transparent px-5 py-4 text-[14px] text-[#0D0D0D] placeholder:text-[#9CA3AF] focus:outline-none min-h-[180px] resize-none leading-[1.75]"
            placeholder="Describe your product idea — include use case, target users, expected scale (requests/month), latency requirements, compliance needs, and any preferences for open-source models…"
            required
          />
          <div className="flex items-center justify-between px-5 py-3" style={{ borderTop: '1.5px solid rgba(91,0,232,0.08)' }}>
            <p className="text-[10px] text-[#9CA3AF]">More detail → better blueprint</p>
            <span className={`text-[10px] font-mono ${charCount > 4500 ? 'text-[#EF4444]' : charCount > 3000 ? 'text-[#D97706]' : 'text-[#9CA3AF]'}`}>
              {charCount}/5000
            </span>
          </div>
        </div>

        {/* Constraints accordion */}
        <div className="rounded-xl overflow-hidden bg-white" style={{ border: '1.5px solid rgba(91,0,232,0.12)' }}>
          <button type="button" onClick={() => setShowConstraints(!showConstraints)}
            className="w-full flex items-center justify-between px-5 py-3.5 hover:bg-[#F9FAFB] transition-colors">
            <div className="flex items-center gap-2.5">
              <Clock className="w-3.5 h-3.5 text-[#9CA3AF]" />
              <span className="text-[13px] text-[#374151]">Constraints &amp; preferences</span>
              {(budget > 0 || preferOpenSource || compliance.length > 0) && (
                <span className="text-[10px] px-1.5 py-0.5 rounded-md"
                  style={{ background: 'rgba(91,0,232,0.08)', color: '#5B00E8', border: '1px solid rgba(91,0,232,0.2)' }}>
                  {[budget > 0 && `$${budget}/mo cap`, preferOpenSource && 'OSS preferred', compliance.length > 0 && compliance.join(', ')].filter(Boolean).join(' · ')}
                </span>
              )}
            </div>
            {showConstraints ? <ChevronUp className="w-4 h-4 text-[#9CA3AF]" /> : <ChevronDown className="w-4 h-4 text-[#9CA3AF]" />}
          </button>
          <AnimatePresence>
            {showConstraints && (
              <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} transition={{ duration: 0.2 }}
                className="overflow-hidden" style={{ borderTop: '1.5px solid rgba(91,0,232,0.08)' }}>
                <ConstraintInputs
                  budget={budget} setBudget={setBudget}
                  maxLatency={maxLatency} setMaxLatency={setMaxLatency}
                  requestVolume={requestVolume} setRequestVolume={setRequestVolume}
                  preferOpenSource={preferOpenSource} setPreferOpenSource={setPreferOpenSource}
                  compliance={compliance} setCompliance={setCompliance}
                  teamSize={teamSize} setTeamSize={setTeamSize}
                  region={region} setRegion={setRegion}
                  deployment={deployment} setDeployment={setDeployment}
                  priority={priority} setPriority={setPriority}
                />
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {error && (
          <div className="flex items-start gap-3 rounded-xl px-5 py-4 text-[13px]"
            style={{ background: 'rgba(239,68,68,0.06)', border: '1px solid rgba(239,68,68,0.2)', color: '#EF4444' }}>
            <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />{error}
          </div>
        )}

        {/* Submit row */}
        <div className="flex items-center justify-between gap-4 pt-1">
          <div className="hidden sm:flex items-center gap-1.5 text-[10px] text-[#9CA3AF] flex-wrap">
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
            className="flex-shrink-0 h-11 px-8 rounded-xl text-[13px] font-bold transition-all flex items-center gap-2 disabled:cursor-not-allowed text-white"
            style={{
              background: (!prompt.trim() || charCount > 5000) ? '#E5E7EB' : '#5B00E8',
              boxShadow: (!prompt.trim() || charCount > 5000) ? 'none' : '0 2px 20px rgba(91,0,232,0.4)',
              color: (!prompt.trim() || charCount > 5000) ? '#9CA3AF' : '#fff',
            }}
          >
            Generate Blueprint <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </form>
    </div>
  );
}
