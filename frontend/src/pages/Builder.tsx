import { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import {
  Sparkles, ArrowRight, Loader2, CheckCircle2, AlertCircle,
  RotateCcw, ChevronDown, ChevronUp, Network, DollarSign,
  Zap, Brain, Star, BookOpen, MessageSquare, Code2, Shield,
  Clock, TrendingUp, Cpu, ExternalLink, FlaskConical, ServerOff,
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../context/AuthContext';

import MermaidDiagram from '../components/ui/MermaidDiagram';
import CostTable from '../components/ui/CostTable';
import LatencyTable from '../components/ui/LatencyTable';
import ScoreGauge from '../components/ui/ScoreGauge';
import DownloadButton from '../components/ui/DownloadButton';
import ConstraintInputs from '../components/ui/ConstraintInputs';

/* ─── Example prompts ───────────────────────────────────────────────────── */
const EXAMPLES = [
  { icon: BookOpen,    title: 'Legal Q&A Bot',        desc: 'RAG + citation tracking for law firms', prompt: 'A legal document Q&A bot for law firms that requires high precision, tracks citations, and uses RAG for internal PDF knowledge bases. We expect 50k queries per month with strict GDPR compliance.' },
  { icon: Code2,       title: 'Code Review AI',        desc: 'Static analysis + security scanning',   prompt: 'An AI-powered code review tool that detects security vulnerabilities and code quality issues in real-time within GitHub PRs. Must handle 10k reviews/month with <2s latency.' },
  { icon: MessageSquare, title: 'Customer Support Bot', desc: 'Multi-channel conversational AI',      prompt: 'A customer support chatbot for a SaaS company that handles billing queries, technical troubleshooting, and escalation routing. Expects 200k messages/month across web and Slack.' },
  { icon: Shield,      title: 'Fraud Detection',       desc: 'Real-time risk scoring at scale',       prompt: 'A real-time fraud detection pipeline for a fintech company that classifies transactions as fraudulent within 100ms. Processes 5M transactions/day with <0.1% false positive rate required.' },
];

/* ─── Pipeline steps shown during loading ───────────────────────────────── */
const PIPELINE_STEPS = [
  { label: 'Detecting AI tasks from your description…',                     icon: Brain,      duration: 800 },
  { label: 'Querying model registry…',                                       icon: Cpu,        duration: 600 },
  { label: 'Computing model scores (cost · latency · quality · fit)…',       icon: TrendingUp, duration: 900 },
  { label: 'Generating architecture graph…',                                 icon: Network,    duration: 700 },
  { label: 'Estimating costs & latency projections…',                        icon: DollarSign, duration: 600 },
  { label: 'Running RAGAs evaluation…',                                      icon: Star,       duration: 800 },
  { label: 'Generating plain-English explanation…',                          icon: BookOpen,   duration: 500 },
];

/* ─── Keyword-driven live tips ──────────────────────────────────────────── */
const KEYWORD_TIPS = [
  {
    keywords: ['image', 'vision', 'photo', 'visual', 'picture', 'screenshot'],
    emoji: '🖼️', color: '#2563EB', bg: 'rgba(37,99,235,0.06)', border: 'rgba(37,99,235,0.18)',
    reaction: 'Vision task detected!',
    tip: 'GPT-4o and Claude claude-sonnet-4 handle vision. Images add ~$0.001–0.003/call — budget accordingly.',
  },
  {
    keywords: ['real-time', 'realtime', '100ms', '200ms', 'streaming', 'instant', 'live'],
    emoji: '⚡', color: '#D97706', bg: 'rgba(217,119,6,0.06)', border: 'rgba(217,119,6,0.18)',
    reaction: 'Ultra-low latency needed!',
    tip: 'Stream tokens. Use Claude Haiku or GPT-4o-mini + edge deployment. Avoid full JSON wait.',
  },
  {
    keywords: ['million', '1m ', '5m ', '10m', 'millions', 'high volume', 'billions', '1,000,000'],
    emoji: '💸', color: '#EF4444', bg: 'rgba(239,68,68,0.06)', border: 'rgba(239,68,68,0.18)',
    reaction: 'Ohh, this might get costly!',
    tip: 'At millions of requests, $0.001/call = $1,000/mo+. Batch APIs + semantic caching save up to 60%.',
  },
  {
    keywords: ['rag', 'retrieval', 'document', 'pdf', 'knowledge base', 'vector', 'embedding'],
    emoji: '📚', color: '#5B00E8', bg: 'rgba(91,0,232,0.06)', border: 'rgba(91,0,232,0.18)',
    reaction: 'Smart RAG architecture!',
    tip: 'Hybrid search (dense + BM25) beats dense-only by ~18% recall. Add a cross-encoder reranker.',
  },
  {
    keywords: ['hipaa', 'gdpr', 'pii', 'compliance', 'healthcare', 'medical', 'legal', 'audit'],
    emoji: '🔒', color: '#D97706', bg: 'rgba(217,119,6,0.06)', border: 'rgba(217,119,6,0.18)',
    reaction: 'Compliance requirements!',
    tip: 'Self-hosted Llama or Azure OpenAI Private Endpoint. Zero PII to public third-party APIs.',
  },
  {
    keywords: ['code', 'coding', 'programming', 'sql', 'github', 'review', 'debug'],
    emoji: '💻', color: '#059669', bg: 'rgba(5,150,105,0.06)', border: 'rgba(5,150,105,0.18)',
    reaction: 'Great use case for code AI!',
    tip: 'Claude claude-sonnet-4 leads on code tasks. DeepSeek-Coder is 10x cheaper and nearly as good.',
  },
  {
    keywords: ['open source', 'open-source', 'llama', 'mistral', 'self-hosted', 'on-prem'],
    emoji: '🌿', color: '#059669', bg: 'rgba(5,150,105,0.06)', border: 'rgba(5,150,105,0.18)',
    reaction: 'Oh wow, great choice!',
    tip: 'Llama 3.3 70B matches GPT-4o on many tasks. Run on Groq for free, or self-host on RunPod.',
  },
  {
    keywords: ['chat', 'support', 'customer', 'helpdesk', 'faq', 'assistant'],
    emoji: '💬', color: '#5B00E8', bg: 'rgba(91,0,232,0.06)', border: 'rgba(91,0,232,0.18)',
    reaction: 'Conversational AI — solid!',
    tip: 'Claude Haiku is 10x cheaper than Sonnet for simple Q&A. Use Sonnet only for complex turns.',
  },
  {
    keywords: ['multimodal', 'audio', 'video', 'speech', 'transcription', 'whisper', 'voice'],
    emoji: '🎙️', color: '#7C3AED', bg: 'rgba(124,58,237,0.06)', border: 'rgba(124,58,237,0.18)',
    reaction: 'Multimodal pipeline!',
    tip: 'Whisper for transcription → Claude/GPT for reasoning. Two-stage is more cost-efficient than end-to-end.',
  },
];

const MODEL_GUIDE = [
  { name: 'claude-haiku-4',  badge: '⚡ Fast',  cost: '$',    note: 'Best for chat & simple tasks'  },
  { name: 'claude-sonnet-4', badge: '⭐ Top',   cost: '$$$',  note: 'Best overall balance'           },
  { name: 'gpt-4o-mini',     badge: '💰 Cheap', cost: '$$',   note: 'OpenAI budget option'           },
  { name: 'deepseek-r1',     badge: '🧠 Reason',cost: '$$',   note: 'Strong code & reasoning'       },
  { name: 'llama-3.3-70b',   badge: '🌿 OSS',   cost: 'Free', note: 'Self-host = near-zero cost'    },
];

/* ─── Sub-components ────────────────────────────────────────────────────── */
function ScoreBadge({ score, size = 'sm' }: { score: number | null | undefined; size?: 'sm' | 'xs' }) {
  if (score == null) return <span className="text-[#9CA3AF] text-xs font-mono">—</span>;
  const [c, bg] = score >= 0.7 ? ['#059669', 'rgba(5,150,105,0.1)'] : score >= 0.4 ? ['#D97706', 'rgba(217,119,6,0.1)'] : ['#EF4444', 'rgba(239,68,68,0.1)'];
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
    <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
      className="rounded-2xl overflow-hidden bg-white"
      style={{ border: '1.5px solid rgba(91,0,232,0.12)', boxShadow: '0 4px 24px rgba(91,0,232,0.07)' }}>
      <button onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between px-6 py-4 hover:bg-[#F9FAFB] transition-colors"
        style={{ borderBottom: open ? '1.5px solid rgba(91,0,232,0.08)' : 'none' }}>
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
        <span className="text-[#9CA3AF]">{open ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}</span>
      </button>
      <AnimatePresence initial={false}>
        {open && (
          <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }} transition={{ duration: 0.2 }} className="overflow-hidden">
            <div className="px-6 py-6">{children}</div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

/* ─── Live Tips Panel ───────────────────────────────────────────────────── */
function LiveTipsPanel({ prompt }: { prompt: string }) {
  const lc = prompt.toLowerCase();
  const activeTips = KEYWORD_TIPS.filter(t => t.keywords.some(k => lc.includes(k)));

  return (
    <div className="space-y-3">
      {/* Intelligence card */}
      <div className="rounded-2xl overflow-hidden bg-white"
        style={{ border: '1.5px solid rgba(91,0,232,0.12)', boxShadow: '0 4px 24px rgba(91,0,232,0.07)' }}>
        <div className="flex items-center gap-2.5 px-4 py-3"
          style={{ borderBottom: '1px solid rgba(91,0,232,0.08)', background: 'rgba(91,0,232,0.02)' }}>
          <div className="w-6 h-6 rounded-lg flex items-center justify-center" style={{ background: 'rgba(91,0,232,0.1)' }}>
            <Sparkles className="w-3 h-3 text-[#5B00E8]" />
          </div>
          <span className="text-[12px] font-bold text-[#374151]">Live Intelligence</span>
          {activeTips.length > 0 && (
            <motion.span key={activeTips.length}
              initial={{ scale: 0.8, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}
              className="ml-auto text-[9px] font-black px-2 py-0.5 rounded-full"
              style={{ background: 'rgba(91,0,232,0.1)', color: '#5B00E8', border: '1px solid rgba(91,0,232,0.2)' }}>
              {activeTips.length} insight{activeTips.length > 1 ? 's' : ''}
            </motion.span>
          )}
        </div>

        <div className="p-4 min-h-[160px]">
          <AnimatePresence mode="popLayout">
            {activeTips.length === 0 ? (
              <motion.div key="empty" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                <p className="text-[11px] text-[#9CA3AF] leading-relaxed mb-4">
                  Start describing your product — insights appear as you type.
                </p>
                {[
                  { icon: Brain, label: 'Detect AI tasks', desc: 'What your app needs to do' },
                  { icon: Cpu, label: 'Score all models', desc: 'Cost · latency · quality rank' },
                  { icon: Network, label: 'Design architecture', desc: 'Optimal stack diagram' },
                  { icon: DollarSign, label: 'Estimate spend', desc: 'Real pricing, projected monthly' },
                ].map((step, i) => {
                  const StepIcon = step.icon;
                  return (
                    <motion.div key={step.label}
                      initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: i * 0.07 }}
                      className="flex items-center gap-3 py-1.5">
                      <div className="w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0"
                        style={{ background: 'rgba(91,0,232,0.07)', border: '1px solid rgba(91,0,232,0.12)' }}>
                        <StepIcon className="w-3.5 h-3.5 text-[#5B00E8]" />
                      </div>
                      <div>
                        <p className="text-[11px] font-semibold text-[#374151]">{step.label}</p>
                        <p className="text-[10px] text-[#9CA3AF]">{step.desc}</p>
                      </div>
                    </motion.div>
                  );
                })}
              </motion.div>
            ) : (
              <div className="space-y-2">
                {activeTips.map((tip, i) => (
                  <motion.div key={tip.reaction} layout
                    initial={{ opacity: 0, y: -10, scale: 0.96 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.94 }}
                    transition={{ delay: i * 0.04 }}
                    className="rounded-xl p-3"
                    style={{ background: tip.bg, border: `1.5px solid ${tip.border}` }}>
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-[13px]">{tip.emoji}</span>
                      <p className="text-[11px] font-bold" style={{ color: tip.color }}>{tip.reaction}</p>
                    </div>
                    <p className="text-[10.5px] text-[#6B7280] leading-relaxed">{tip.tip}</p>
                  </motion.div>
                ))}
              </div>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* Quick model reference */}
      <div className="rounded-2xl bg-white overflow-hidden"
        style={{ border: '1.5px solid rgba(91,0,232,0.1)', boxShadow: '0 2px 12px rgba(91,0,232,0.05)' }}>
        <div className="px-4 py-3" style={{ borderBottom: '1px solid rgba(91,0,232,0.08)' }}>
          <p className="text-[11px] font-bold text-[#374151]">⚡ Quick Model Guide</p>
        </div>
        <div className="p-3 space-y-1.5">
          {MODEL_GUIDE.map(m => (
            <div key={m.name} className="flex items-center gap-2 px-2 py-1.5 rounded-lg" style={{ background: '#F9FAFB' }}>
              <div className="flex-1 min-w-0">
                <p className="text-[10px] font-mono font-bold text-[#374151] truncate">{m.name}</p>
                <p className="text-[9px] text-[#9CA3AF]">{m.note}</p>
              </div>
              <div className="flex items-center gap-1.5 flex-shrink-0">
                <span className="text-[8.5px] font-bold px-1.5 py-0.5 rounded"
                  style={{ background: 'rgba(91,0,232,0.08)', color: '#5B00E8' }}>{m.badge}</span>
                <span className="text-[9px] font-mono text-[#9CA3AF] w-8 text-right">{m.cost}</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* DIY teaser */}
      <Link to="/playground"
        className="flex items-center gap-3 rounded-2xl px-4 py-3.5 bg-white transition-all group"
        style={{ border: '1.5px solid rgba(91,0,232,0.12)', boxShadow: '0 2px 12px rgba(91,0,232,0.05)' }}
        onMouseEnter={e => { (e.currentTarget as HTMLElement).style.borderColor = 'rgba(91,0,232,0.3)'; (e.currentTarget as HTMLElement).style.background = 'rgba(91,0,232,0.03)'; }}
        onMouseLeave={e => { (e.currentTarget as HTMLElement).style.borderColor = 'rgba(91,0,232,0.12)'; (e.currentTarget as HTMLElement).style.background = 'white'; }}>
        <div className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0"
          style={{ background: 'rgba(91,0,232,0.08)', border: '1.5px solid rgba(91,0,232,0.2)' }}>
          <FlaskConical className="w-4 h-4 text-[#5B00E8]" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-[12px] font-bold text-[#374151] group-hover:text-[#5B00E8] transition-colors">Visual Playground →</p>
          <p className="text-[10px] text-[#9CA3AF]">Build pipelines with drag & drop nodes</p>
        </div>
      </Link>
    </div>
  );
}

/* ─── Main Builder ──────────────────────────────────────────────────────── */
export default function Builder() {
  const { token } = useAuth();

  /* ── Restore draft from localStorage ── */
  const restoreDraft = () => {
    try {
      const raw = localStorage.getItem('archon_builder_draft');
      if (raw) return JSON.parse(raw);
    } catch { /* ignore */ }
    return null;
  };
  const draft = restoreDraft();

  const [prompt, setPrompt]                     = useState(draft?.prompt ?? '');
  const [budget, setBudget]                     = useState(draft?.budget ?? 0);
  const [maxLatency, setMaxLatency]             = useState(draft?.maxLatency ?? 3000);
  const [requestVolume, setRequestVolume]       = useState(draft?.requestVolume ?? 10000);
  const [preferOpenSource, setPreferOpenSource] = useState(draft?.preferOpenSource ?? false);
  const [compliance, setCompliance]             = useState<string[]>(draft?.compliance ?? []);
  const [teamSize, setTeamSize]                 = useState(draft?.teamSize ?? 'Solo dev');
  const [region, setRegion]                     = useState(draft?.region ?? 'English only');
  const [deployment, setDeployment]             = useState(draft?.deployment ?? 'Cloud SaaS');
  const [priority, setPriority]                 = useState<'cost' | 'latency' | 'quality'>(draft?.priority ?? 'quality');
  const [showConstraints, setShowConstraints]   = useState(false);

  const [loading, setLoading]         = useState(false);
  const [currentStep, setCurrentStep] = useState(0);
  const [elapsedMs, setElapsedMs]     = useState(0);
  const [result, setResult]           = useState<any>(null);
  const [error, setError]             = useState('');

  const timerRef     = useRef<ReturnType<typeof setInterval> | null>(null);
  const startTimeRef = useRef<number>(0);

  /* ── Persist draft on every change ── */
  useEffect(() => {
    if (result) return; // don't overwrite with post-submit state
    try {
      localStorage.setItem('archon_builder_draft', JSON.stringify({
        prompt, budget, maxLatency, requestVolume, preferOpenSource,
        compliance, teamSize, region, deployment, priority,
      }));
    } catch { /* quota exceeded — ignore */ }
  }, [prompt, budget, maxLatency, requestVolume, preferOpenSource,
      compliance, teamSize, region, deployment, priority, result]);

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

      // Safely read + parse the response body
      const raw = await res.text();
      if (!raw || !raw.trim()) {
        setError('Backend returned an empty response. Make sure the backend server is running at http://localhost:8000');
        return;
      }

      let data: any;
      try {
        data = JSON.parse(raw);
      } catch {
        setError('Received invalid response from the backend. Is the server running correctly?');
        return;
      }

      if (!res.ok) {
        setError(data?.detail || data?.message || `Server error (${res.status})`);
        return;
      }

      setResult(data);
    } catch (err: any) {
      if (err?.message?.includes('Failed to fetch') || err?.message?.includes('NetworkError')) {
        setError('Cannot reach backend — start the server: uvicorn app.main:app --reload (port 8000)');
      } else {
        setError(err?.message || 'Unexpected error. Check the browser console.');
      }
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setResult(null); setError(''); setCurrentStep(0); setPrompt('');
    try { localStorage.removeItem('archon_builder_draft'); } catch { /* ignore */ }
  };

  /* ── Loading view ── */
  if (loading) {
    const pct = Math.min((currentStep / PIPELINE_STEPS.length) * 100, 95);
    return (
      <div className="p-8 min-h-[70vh] flex flex-col items-center justify-center gap-10 select-none">
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
            <motion.div className="h-full rounded-full" animate={{ width: `${pct}%` }}
              transition={{ duration: 0.4, ease: 'easeOut' }}
              style={{ background: 'linear-gradient(90deg, #5B00E8, #8B3DFF)' }} />
          </div>
        </div>
        <div className="w-full max-w-sm space-y-2.5">
          {PIPELINE_STEPS.map((step, i) => {
            const StepIcon = step.icon;
            const done = i < currentStep; const active = i === currentStep;
            return (
              <motion.div key={i} initial={{ opacity: 0, x: -8 }} animate={{ opacity: done ? 0.4 : active ? 1 : 0.2, x: 0 }} transition={{ delay: i * 0.05 }}
                className="flex items-center gap-3">
                <div className="w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0"
                  style={{ background: done ? 'rgba(5,150,105,0.1)' : active ? 'rgba(91,0,232,0.12)' : '#F4F2FF', border: done ? '1px solid rgba(5,150,105,0.3)' : active ? '1px solid rgba(91,0,232,0.4)' : '1px solid rgba(91,0,232,0.1)' }}>
                  {done ? <CheckCircle2 className="w-3 h-3 text-[#059669]" /> : active ? <Loader2 className="w-3 h-3 text-[#5B00E8] animate-spin" /> : <StepIcon className="w-3 h-3 text-[#9CA3AF]" />}
                </div>
                <span className={`text-[13px] ${active ? 'text-[#0D0D0D] font-medium' : 'text-[#9CA3AF]'}`}>{step.label}</span>
              </motion.div>
            );
          })}
        </div>
      </div>
    );
  }

  /* ── Result view ── */
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
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="p-6 lg:p-8 space-y-5 max-w-5xl">

        {/* Header */}
        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div className="min-w-0">
            <div className="flex items-center gap-3 mb-2">
              <h1 className="text-[22px] font-extrabold text-[#0D0D0D] tracking-tight">Architecture Blueprint</h1>
              {isLowConf ? (
                <span className="text-[10px] px-2.5 py-1 rounded-full font-semibold"
                  style={{ background: 'rgba(217,119,6,0.1)', color: '#D97706', border: '1px solid rgba(217,119,6,0.25)' }}>
                  Low Confidence
                </span>
              ) : (
                <span className="text-[10px] px-2.5 py-1 rounded-full font-semibold"
                  style={{ background: 'rgba(5,150,105,0.1)', color: '#059669', border: '1px solid rgba(5,150,105,0.25)' }}>
                  ✓ Blueprint Ready
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
            { label: 'Detected Tasks',    value: tasks.length > 0 ? tasks.length : '—', sub: tasks[0]?.task?.replace(/_/g, ' ') ?? 'none', icon: Brain,      color: '#5B00E8' },
            { label: 'Models Scored',     value: recs.length || '—',                     sub: topModel?.model_name ?? 'none',                 icon: Star,       color: '#D97706' },
            { label: 'Est. Monthly Cost', value: totalCost > 0 ? `$${totalCost.toFixed(2)}` : '$0', sub: totalCost === 0 ? 'add API key for pricing' : '/month', icon: DollarSign, color: '#059669' },
            { label: 'P95 Latency',       value: totalP95 > 0 ? `${totalP95}ms` : '—',  sub: totalP95 > 0 ? (totalP95 < 1000 ? 'fast ✓' : totalP95 < 3000 ? 'medium' : 'slow') : 'no data', icon: Zap, color: '#2563EB' },
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
            <span><strong>Low Confidence</strong> — RAGAs scored below 0.7. Review before production use. Add an LLM API key for richer evaluation.</span>
          </div>
        )}

        {archDiagram && <Section title="Architecture Diagram" icon={Network}><MermaidDiagram chart={archDiagram} /></Section>}

        {recs.length > 0 && (
          <Section title="Recommended Models" icon={Cpu} badge={`${recs.length} scored`}>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-4">
              {recs.slice(0, 3).map((r: any, i: number) => (
                <motion.div key={i} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.08 }}
                  className="relative rounded-xl p-4"
                  style={{ background: i === 0 ? 'rgba(91,0,232,0.05)' : '#F9FAFB', border: i === 0 ? '1.5px solid rgba(91,0,232,0.35)' : '1.5px solid rgba(91,0,232,0.1)', boxShadow: i === 0 ? '0 4px 20px rgba(91,0,232,0.1)' : 'none' }}>
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
                      {['Model', 'Task', 'Composite', 'Cost', 'Quality'].map(h => (
                        <th key={h} className={`px-4 py-2.5 ${h === 'Model' || h === 'Task' ? 'text-left' : 'text-right'}`}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {recs.slice(3).map((r: any, i: number) => (
                      <tr key={i} style={{ borderTop: '1px solid rgba(91,0,232,0.06)' }}
                        onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = '#F9FAFB'; }}
                        onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = 'white'; }}>
                        <td className="px-4 py-2.5"><span className="font-medium text-[#374151]">{r.model_name}</span><span className="block text-[#9CA3AF] capitalize text-[10px]">{r.provider}</span></td>
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

        {explanation && (
          <Section title="Why This Stack?" icon={BookOpen}>
            <div className="space-y-3">
              {explanation.split('\n\n').filter(Boolean).map((para: string, i: number) => (
                <p key={i} className="text-[13px] text-[#374151] leading-[1.8]">{para}</p>
              ))}
            </div>
          </Section>
        )}

        <Section title="RAGAs Quality Evaluation" icon={Brain} defaultOpen={false}>
          <div className="flex items-center gap-10 flex-wrap">
            <ScoreGauge score={evalScore.composite ?? null} label="Composite" size="lg" />
            <div className="grid grid-cols-2 gap-4">
              {[{ label: 'Faithfulness', key: 'faithfulness' }, { label: 'Ans. Relevancy', key: 'answer_relevancy' }, { label: 'Ctx. Precision', key: 'context_precision' }, { label: 'Ctx. Recall', key: 'context_recall' }].map(({ label, key }) => (
                <ScoreGauge key={key} score={evalScore[key] ?? null} label={label} size="sm" />
              ))}
            </div>
          </div>
        </Section>

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

        {/* ── DIY / Build Your Own CTA ── */}
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }}
          className="rounded-2xl overflow-hidden"
          style={{ border: '2px solid rgba(91,0,232,0.2)', background: 'linear-gradient(135deg, rgba(91,0,232,0.04) 0%, white 100%)', boxShadow: '0 4px 24px rgba(91,0,232,0.08)' }}>
          <div className="px-6 py-6 flex items-center gap-5 flex-wrap">
            <div className="w-12 h-12 rounded-2xl flex items-center justify-center flex-shrink-0"
              style={{ background: 'rgba(91,0,232,0.1)', border: '2px solid rgba(91,0,232,0.2)' }}>
              <FlaskConical className="w-6 h-6 text-[#5B00E8]" />
            </div>
            <div className="flex-1 min-w-[200px]">
              <h3 className="text-[16px] font-extrabold text-[#0D0D0D] mb-1">Want to build this yourself? 🛠️</h3>
              <p className="text-[12px] text-[#6B7280] leading-relaxed">
                Jump into the visual Playground — wire up the exact nodes from this blueprint, connect models, and test with live inputs.
              </p>
            </div>
            <Link to="/playground"
              className="flex items-center gap-2 h-11 px-6 rounded-xl text-[13px] font-bold text-white flex-shrink-0 transition-all"
              style={{ background: 'linear-gradient(135deg, #5B00E8, #7C3AED)', boxShadow: '0 4px 20px rgba(91,0,232,0.35)' }}
              onMouseEnter={e => { (e.currentTarget as HTMLElement).style.transform = 'translateY(-1px)'; (e.currentTarget as HTMLElement).style.boxShadow = '0 8px 28px rgba(91,0,232,0.45)'; }}
              onMouseLeave={e => { (e.currentTarget as HTMLElement).style.transform = ''; (e.currentTarget as HTMLElement).style.boxShadow = '0 4px 20px rgba(91,0,232,0.35)'; }}>
              <FlaskConical className="w-4 h-4" /> Open Playground
            </Link>
          </div>
        </motion.div>

        <div className="flex items-center justify-center py-4">
          <button onClick={resetForm}
            className="flex items-center gap-2 h-10 px-8 rounded-xl text-[13px] font-semibold text-white transition-all"
            style={{ background: '#5B00E8', boxShadow: '0 2px 20px rgba(91,0,232,0.35)' }}>
            <RotateCcw className="w-4 h-4" /> Generate Another Blueprint
          </button>
        </div>
      </motion.div>
    );
  }

  /* ── Form view (2-column with live tips) ── */
  const charCount = prompt.length;

  return (
    <div className="flex gap-6 items-start p-6 lg:p-8">

      {/* Left: main form */}
      <div className="flex-1 min-w-0 space-y-6 max-w-2xl">

        {/* Hero header */}
        <div className="relative rounded-2xl overflow-hidden px-8 py-9"
          style={{ background: 'linear-gradient(135deg, rgba(91,0,232,0.06) 0%, #ffffff 70%)', border: '1.5px solid rgba(91,0,232,0.15)', boxShadow: '0 4px 24px rgba(91,0,232,0.07)' }}>
          <div className="absolute top-0 left-1/3 w-96 h-36 pointer-events-none"
            style={{ background: 'radial-gradient(ellipse, rgba(91,0,232,0.12) 0%, transparent 70%)' }} />
          <div className="relative">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2.5 rounded-xl" style={{ background: 'rgba(91,0,232,0.1)', border: '1px solid rgba(91,0,232,0.2)' }}>
                <Sparkles className="w-5 h-5 text-[#5B00E8]" />
              </div>
              <span className="text-[10px] font-bold uppercase tracking-[0.15em] px-2.5 py-1 rounded-full"
                style={{ background: 'rgba(91,0,232,0.08)', color: '#5B00E8', border: '1px solid rgba(91,0,232,0.2)' }}>
                AI Architect
              </span>
            </div>
            <h1 className="text-[30px] font-extrabold tracking-tight mb-2 text-[#0D0D0D]">Blueprint Builder</h1>
            <p className="text-[13px] text-[#6B7280] max-w-lg leading-relaxed">
              Describe your product in plain English — get a complete, scored AI stack with architecture diagram, cost & latency projections.
            </p>
          </div>
        </div>

        {/* Example prompts */}
        <div>
          <p className="text-[10px] font-bold text-[#9CA3AF] uppercase tracking-[0.15em] mb-3">Start from a template</p>
          <div className="grid grid-cols-2 gap-2.5">
            {EXAMPLES.map(ex => {
              const Ex = ex.icon;
              const isSelected = prompt === ex.prompt;
              return (
                <button key={ex.title} onClick={() => setPrompt(ex.prompt)}
                  className="group text-left p-4 rounded-xl bg-white transition-all"
                  style={{ border: isSelected ? '1.5px solid #5B00E8' : '1.5px solid rgba(91,0,232,0.12)', background: isSelected ? 'rgba(91,0,232,0.04)' : 'white', boxShadow: '0 2px 12px rgba(91,0,232,0.06)' }}
                  onMouseEnter={e => { if (!isSelected) (e.currentTarget as HTMLElement).style.borderColor = 'rgba(91,0,232,0.3)'; }}
                  onMouseLeave={e => { if (!isSelected) (e.currentTarget as HTMLElement).style.borderColor = 'rgba(91,0,232,0.12)'; }}>
                  <div className="flex items-center gap-2.5 mb-2">
                    <div className="w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0"
                      style={{ background: isSelected ? 'rgba(91,0,232,0.1)' : '#F4F2FF' }}>
                      <Ex className={`w-3.5 h-3.5 ${isSelected ? 'text-[#5B00E8]' : 'text-[#9CA3AF] group-hover:text-[#5B00E8]'} transition-colors`} />
                    </div>
                    <span className="text-[12px] font-semibold text-[#374151] group-hover:text-[#0D0D0D] transition-colors">{ex.title}</span>
                  </div>
                  <p className="text-[11px] text-[#9CA3AF] leading-relaxed ml-9">{ex.desc}</p>
                </button>
              );
            })}
          </div>
        </div>

        <form onSubmit={handleBuild} className="space-y-4">
          {/* Textarea */}
          <div className="relative rounded-2xl overflow-hidden bg-white transition-all"
            style={{ border: '1.5px solid rgba(91,0,232,0.2)', boxShadow: '0 4px 24px rgba(91,0,232,0.07)' }}
            onFocusCapture={e => { (e.currentTarget as HTMLElement).style.borderColor = '#5B00E8'; (e.currentTarget as HTMLElement).style.boxShadow = '0 0 0 3px rgba(91,0,232,0.08), 0 4px 24px rgba(91,0,232,0.07)'; }}
            onBlurCapture={e => { (e.currentTarget as HTMLElement).style.borderColor = 'rgba(91,0,232,0.2)'; (e.currentTarget as HTMLElement).style.boxShadow = '0 4px 24px rgba(91,0,232,0.07)'; }}>
            <div className="flex items-center gap-2 px-5 pt-4 pb-2.5" style={{ borderBottom: '1.5px solid rgba(91,0,232,0.08)' }}>
              <Sparkles className="w-3.5 h-3.5 text-[#5B00E8]" />
              <span className="text-[10px] font-bold uppercase tracking-[0.15em] text-[#6B7280]">Product Description</span>
            </div>
            <textarea value={prompt} onChange={e => setPrompt(e.target.value)}
              className="w-full bg-transparent px-5 py-4 text-[14px] text-[#0D0D0D] placeholder:text-[#9CA3AF] focus:outline-none min-h-[180px] resize-none leading-[1.75]"
              placeholder="Describe your product idea — include use case, target users, expected scale (requests/month), latency requirements, compliance needs, and any preferences for open-source models…"
              required />
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
                <span className="text-[13px] text-[#374151] font-medium">Constraints &amp; preferences</span>
                {(budget > 0 || preferOpenSource || compliance.length > 0) && (
                  <span className="text-[10px] px-1.5 py-0.5 rounded-md"
                    style={{ background: 'rgba(91,0,232,0.08)', color: '#5B00E8', border: '1px solid rgba(91,0,232,0.2)' }}>
                    {[budget > 0 && `$${budget}/mo`, preferOpenSource && 'OSS', compliance.length > 0 && compliance.join('+')].filter(Boolean).join(' · ')}
                  </span>
                )}
              </div>
              {showConstraints ? <ChevronUp className="w-4 h-4 text-[#9CA3AF]" /> : <ChevronDown className="w-4 h-4 text-[#9CA3AF]" />}
            </button>
            <AnimatePresence>
              {showConstraints && (
                <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }} transition={{ duration: 0.2 }}
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

          {/* Error */}
          <AnimatePresence>
            {error && (
              <motion.div initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
                className="flex items-start gap-3 rounded-xl px-5 py-4 text-[13px]"
                style={{ background: 'rgba(239,68,68,0.06)', border: '1px solid rgba(239,68,68,0.2)', color: '#EF4444' }}>
                <ServerOff className="w-4 h-4 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="font-semibold mb-0.5">Backend not reachable</p>
                  <p className="text-[12px] opacity-80">{error}</p>
                  <p className="text-[11px] mt-1 opacity-60">Run: <code className="font-mono bg-red-50 px-1 rounded">cd archon && uvicorn app.main:app --reload</code></p>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Submit */}
          <div className="flex items-center justify-between gap-4 pt-1">
            <div className="hidden sm:flex items-center gap-1.5 text-[10px] text-[#9CA3AF] flex-wrap">
              {['Analyze', 'Score', 'Architect', 'Estimate', 'Evaluate', 'Explain'].map((s, i, arr) => (
                <span key={s} className="flex items-center gap-1.5">
                  <span>{s}</span>
                  {i < arr.length - 1 && <ArrowRight className="w-2.5 h-2.5 opacity-40" />}
                </span>
              ))}
            </div>
            <button type="submit"
              disabled={loading || !prompt.trim() || charCount > 5000}
              className="flex-shrink-0 h-11 px-8 rounded-xl text-[13px] font-bold transition-all flex items-center gap-2 disabled:cursor-not-allowed"
              style={{
                background: (!prompt.trim() || charCount > 5000) ? '#E5E7EB' : 'linear-gradient(135deg, #5B00E8, #7C3AED)',
                boxShadow: (!prompt.trim() || charCount > 5000) ? 'none' : '0 2px 20px rgba(91,0,232,0.4)',
                color: (!prompt.trim() || charCount > 5000) ? '#9CA3AF' : '#fff',
              }}>
              Generate Blueprint <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </form>
      </div>

      {/* Right: live tips panel */}
      <div className="w-[284px] flex-shrink-0 hidden lg:block sticky top-6">
        <LiveTipsPanel prompt={prompt} />
      </div>
    </div>
  );
}
