import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  ArrowLeft, ExternalLink, Cpu, DollarSign, Zap, Star,
  CheckCircle2, AlertCircle, Loader2, Award,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';

interface ModelEntry {
  id: string;
  provider: string;
  model_name: string;
  capabilities: string[];
  pricing: { input_per_1m_tokens?: number; output_per_1m_tokens?: number };
  pricing_source?: string | null;
  latency_p50_ms?: number | null;
  latency_p95_ms?: number | null;
  latency_source?: string | null;
  quality_scores?: { arena_elo?: number; mmlu?: number; humaneval?: number } | null;
  is_active?: boolean;
}

const PROVIDER_LINKS: Record<string, string> = {
  openai: 'https://openai.com/api/',
  anthropic: 'https://www.anthropic.com/api',
  google: 'https://ai.google.dev/',
  meta: 'https://llama.meta.com/',
  mistral: 'https://mistral.ai/',
  deepseek: 'https://platform.deepseek.com/',
  cohere: 'https://cohere.com/',
  groq: 'https://groq.com/',
  together: 'https://www.together.ai/',
};

const PROVIDER_COLORS: Record<string, string> = {
  openai: '#0EA47A', anthropic: '#5B00E8', google: '#4285F4', meta: '#0866FF',
  mistral: '#FA520F', deepseek: '#4D6BFE', cohere: '#39594D', groq: '#F55036',
  together: '#0F6FFF',
};

export default function ModelDetail() {
  const { id } = useParams<{ id: string }>();
  const { token } = useAuth();
  const [models, setModels] = useState<ModelEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error,   setError]   = useState<string>('');

  useEffect(() => {
    const headers = { Authorization: `Bearer ${token || 'arch_test_key_dev'}` };
    fetch('/v1/models', { headers })
      .then(r => r.json())
      .then(d => { setModels(Array.isArray(d) ? d : d.items || []); setLoading(false); })
      .catch(e => { setError(String(e.message || e)); setLoading(false); });
  }, [token]);

  // Match by id OR by URL-encoded model_name (so /models/gpt-4o works as well as /models/<uuid>)
  const model = models.find(m =>
    m.id === id || m.model_name === id || encodeURIComponent(m.model_name) === id
  );

  if (loading) {
    return (
      <div className="p-8 min-h-[60vh] flex items-center justify-center">
        <Loader2 className="w-7 h-7 text-[#5B00E8] animate-spin" />
      </div>
    );
  }

  if (error || !model) {
    return (
      <div className="p-8 max-w-3xl mx-auto space-y-5">
        <Link to="/builder" className="inline-flex items-center gap-2 text-[13px] text-[#6B7280] hover:text-[#5B00E8]">
          <ArrowLeft className="w-4 h-4" /> Back
        </Link>
        <div className="flex items-start gap-3 rounded-xl px-5 py-4 text-[13px]"
          style={{ background: 'rgba(239,68,68,0.06)', border: '1.5px solid rgba(239,68,68,0.2)', color: '#EF4444' }}>
          <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
          {error || `No model found for id "${id}".`}
        </div>
      </div>
    );
  }

  const provider = model.provider.toLowerCase();
  const color = PROVIDER_COLORS[provider] || '#5B00E8';
  const docsHref = PROVIDER_LINKS[provider];

  const inCost  = model.pricing?.input_per_1m_tokens;
  const outCost = model.pricing?.output_per_1m_tokens;
  const elo     = model.quality_scores?.arena_elo;
  const mmlu    = model.quality_scores?.mmlu;
  const humaneval = model.quality_scores?.humaneval;

  // Cost per 1k requests at avg 800 in / 400 out tokens
  const costPer1kReq =
    inCost != null && outCost != null
      ? ((inCost * 0.8 + outCost * 0.4) / 1000).toFixed(4)
      : null;

  // Similar models from same provider
  const siblings = models.filter(m => m.provider === model.provider && m.id !== model.id).slice(0, 6);

  return (
    <div className="p-6 lg:p-10 max-w-6xl mx-auto">
      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="space-y-7">

        <Link to="/builder" className="inline-flex items-center gap-2 text-[13px] text-[#6B7280] hover:text-[#5B00E8] transition-colors group">
          <ArrowLeft className="w-4 h-4 group-hover:-translate-x-0.5 transition-transform" />
          Back to Builder
        </Link>

        {/* ── Hero header ── */}
        <div className="rounded-2xl bg-white overflow-hidden" style={{ border: '1.5px solid rgba(91,0,232,0.12)', boxShadow: '0 6px 32px rgba(91,0,232,0.08)' }}>
          <div className="h-2" style={{ background: `linear-gradient(90deg, ${color}, ${color}80)` }} />
          <div className="p-7 flex items-start justify-between gap-4 flex-wrap">
            <div className="min-w-0">
              <div className="flex items-center gap-3 mb-3">
                <span className="text-[10px] font-bold uppercase tracking-[0.18em] px-2 py-1 rounded-md" style={{ background: `${color}12`, color, border: `1px solid ${color}30` }}>
                  {model.provider}
                </span>
                {model.is_active ? (
                  <span className="text-[10px] font-bold uppercase tracking-[0.18em] flex items-center gap-1 text-[#059669]">
                    <CheckCircle2 className="w-3 h-3" /> Active
                  </span>
                ) : (
                  <span className="text-[10px] font-bold uppercase tracking-[0.18em] text-[#9CA3AF]">Inactive</span>
                )}
              </div>
              <h1 className="font-mono text-[26px] font-extrabold text-[#0D0D0D] leading-tight tracking-tight">
                {model.model_name}
              </h1>
              <p className="text-[12px] text-[#6B7280] mt-2 max-w-xl">
                {model.capabilities.length} capabilities · pulled from registry · click any spec source below to verify.
              </p>
            </div>
            {docsHref && (
              <a href={docsHref} target="_blank" rel="noopener noreferrer"
                className="flex items-center gap-2 h-10 px-5 rounded-xl text-[13px] font-semibold text-white transition-all hover:scale-[1.02]"
                style={{ background: color, boxShadow: `0 4px 16px ${color}55` }}>
                {model.provider} docs <ExternalLink className="w-3.5 h-3.5" />
              </a>
            )}
          </div>
        </div>

        {/* ── Spec grid ── */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          <SpecCard
            label="Input cost" icon={DollarSign} color="#059669"
            value={inCost != null ? `$${inCost.toFixed(2)} / 1M` : '—'}
            sub="per million tokens"
          />
          <SpecCard
            label="Output cost" icon={DollarSign} color="#D97706"
            value={outCost != null ? `$${outCost.toFixed(2)} / 1M` : '—'}
            sub="per million tokens"
          />
          <SpecCard
            label="P50 latency" icon={Zap} color="#3B82F6"
            value={model.latency_p50_ms != null ? `${model.latency_p50_ms}ms` : '—'}
            sub="median response time"
          />
          <SpecCard
            label="P95 latency" icon={Zap} color="#7C3AED"
            value={model.latency_p95_ms != null ? `${model.latency_p95_ms}ms` : '—'}
            sub="95th percentile"
          />
        </div>

        {/* ── Per-request economics ── */}
        {costPer1kReq && (
          <div className="rounded-2xl bg-white p-6" style={{ border: '1.5px solid rgba(91,0,232,0.12)', boxShadow: '0 4px 20px rgba(91,0,232,0.06)' }}>
            <div className="flex items-center gap-2 mb-4">
              <DollarSign className="w-4 h-4 text-[#059669]" />
              <h2 className="text-[14px] font-bold text-[#0D0D0D]">Estimated cost at typical query mix</h2>
              <span className="text-[10px] text-[#9CA3AF] ml-auto">(800 input + 400 output tokens / call)</span>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {[
                { label: 'Per 1K requests',  value: `$${costPer1kReq}` },
                { label: 'Per 10K requests', value: `$${(parseFloat(costPer1kReq) * 10).toFixed(2)}` },
                { label: 'Per 100K requests', value: `$${(parseFloat(costPer1kReq) * 100).toFixed(2)}` },
                { label: 'Per 1M requests',  value: `$${(parseFloat(costPer1kReq) * 1000).toFixed(2)}` },
              ].map(c => (
                <div key={c.label}>
                  <p className="text-[10px] font-bold uppercase tracking-wider text-[#9CA3AF] mb-1">{c.label}</p>
                  <p className="font-mono text-[22px] font-extrabold text-[#0D0D0D] leading-none">{c.value}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ── Quality benchmarks ── */}
        {(elo || mmlu || humaneval) && (
          <div className="rounded-2xl bg-white p-6" style={{ border: '1.5px solid rgba(91,0,232,0.12)', boxShadow: '0 4px 20px rgba(91,0,232,0.06)' }}>
            <div className="flex items-center gap-2 mb-4">
              <Award className="w-4 h-4 text-[#D97706]" />
              <h2 className="text-[14px] font-bold text-[#0D0D0D]">Quality benchmarks</h2>
              {model.latency_source && (
                <a href={model.latency_source} target="_blank" rel="noopener noreferrer"
                  className="ml-auto flex items-center gap-1 text-[11px] font-semibold text-[#5B00E8] hover:underline">
                  source <ExternalLink className="w-3 h-3" />
                </a>
              )}
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {elo != null && <BenchRow label="Chatbot Arena ELO" score={elo} hi={1400} color="#5B00E8" />}
              {mmlu != null && <BenchRow label="MMLU (academic)" score={mmlu} hi={100} color="#3B82F6" />}
              {humaneval != null && <BenchRow label="HumanEval (code)" score={humaneval} hi={100} color="#059669" />}
            </div>
          </div>
        )}

        {/* ── Capabilities ── */}
        <div className="rounded-2xl bg-white p-6" style={{ border: '1.5px solid rgba(91,0,232,0.12)', boxShadow: '0 4px 20px rgba(91,0,232,0.06)' }}>
          <div className="flex items-center gap-2 mb-4">
            <Star className="w-4 h-4 text-[#5B00E8]" />
            <h2 className="text-[14px] font-bold text-[#0D0D0D]">Supported capabilities</h2>
          </div>
          <div className="flex flex-wrap gap-2">
            {model.capabilities.map(cap => (
              <span key={cap} className="text-[11px] font-semibold px-3 py-1.5 rounded-full"
                style={{ background: 'rgba(91,0,232,0.08)', color: '#5B00E8', border: '1px solid rgba(91,0,232,0.18)' }}>
                {cap}
              </span>
            ))}
          </div>
        </div>

        {/* ── Pricing source ── */}
        {model.pricing_source && (
          <div className="rounded-xl px-5 py-3 flex items-center gap-2 text-[12px]"
            style={{ background: 'rgba(91,0,232,0.04)', border: '1px solid rgba(91,0,232,0.12)' }}>
            <ExternalLink className="w-3.5 h-3.5 text-[#5B00E8]" />
            <span className="text-[#6B7280]">Pricing source:</span>
            <a href={model.pricing_source} target="_blank" rel="noopener noreferrer" className="font-semibold text-[#5B00E8] hover:underline truncate">
              {model.pricing_source}
            </a>
          </div>
        )}

        {/* ── Sibling models ── */}
        {siblings.length > 0 && (
          <div className="rounded-2xl bg-white p-6" style={{ border: '1.5px solid rgba(91,0,232,0.12)', boxShadow: '0 4px 20px rgba(91,0,232,0.06)' }}>
            <div className="flex items-center gap-2 mb-4">
              <Cpu className="w-4 h-4 text-[#5B00E8]" />
              <h2 className="text-[14px] font-bold text-[#0D0D0D]">Other models from {model.provider}</h2>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
              {siblings.map(s => (
                <Link key={s.id} to={`/models/${encodeURIComponent(s.model_name)}`}
                  className="rounded-xl p-4 transition-all hover:shadow-md"
                  style={{ background: '#F9FAFB', border: '1.5px solid rgba(91,0,232,0.08)' }}>
                  <p className="font-mono text-[13px] font-bold text-[#0D0D0D] truncate">{s.model_name}</p>
                  <p className="text-[11px] text-[#6B7280] mt-1.5">
                    {s.pricing?.input_per_1m_tokens != null ? `$${s.pricing.input_per_1m_tokens}/1M in` : '—'}
                    {' · '}
                    {s.latency_p95_ms != null ? `${s.latency_p95_ms}ms p95` : '—'}
                  </p>
                </Link>
              ))}
            </div>
          </div>
        )}
      </motion.div>
    </div>
  );
}

function SpecCard({ label, icon: Icon, color, value, sub }: { label: string; icon: any; color: string; value: string; sub: string }) {
  return (
    <div className="rounded-2xl p-4 bg-white" style={{ border: '1.5px solid rgba(91,0,232,0.1)', boxShadow: '0 2px 14px rgba(91,0,232,0.05)' }}>
      <div className="flex items-start gap-2 mb-2">
        <div className="w-7 h-7 rounded-lg flex items-center justify-center" style={{ background: `${color}12`, border: `1px solid ${color}28` }}>
          <Icon className="w-3.5 h-3.5" style={{ color }} />
        </div>
        <p className="text-[10px] font-bold uppercase tracking-wider text-[#9CA3AF] flex-1 truncate mt-1">{label}</p>
      </div>
      <p className="font-mono text-[18px] font-extrabold text-[#0D0D0D] leading-none">{value}</p>
      <p className="text-[10px] text-[#9CA3AF] mt-1.5">{sub}</p>
    </div>
  );
}

function BenchRow({ label, score, hi, color }: { label: string; score: number; hi: number; color: string }) {
  const pct = Math.min(100, Math.max(2, (score / hi) * 100));
  return (
    <div>
      <div className="flex items-center justify-between text-[11px] mb-1.5">
        <span className="text-[#6B7280] font-medium">{label}</span>
        <span className="font-mono font-bold" style={{ color }}>{score}</span>
      </div>
      <div className="w-full h-2 rounded-full" style={{ background: '#EDE9FF' }}>
        <motion.div initial={{ width: 0 }} animate={{ width: `${pct}%` }} transition={{ duration: 0.7 }}
          className="h-2 rounded-full" style={{ background: color }} />
      </div>
    </div>
  );
}
