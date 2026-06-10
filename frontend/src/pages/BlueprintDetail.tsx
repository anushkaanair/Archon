import { useEffect, useState, useMemo, useRef } from 'react';
import { useParams, Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ArrowLeft, Loader2, AlertCircle, DollarSign, Zap, Award, Cpu,
  ChevronDown, ChevronUp, ExternalLink, Sliders, RefreshCw, X,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import InteractiveArchDiagram from '../components/ui/InteractiveArchDiagram';
import type { ArchJson } from '../components/ui/InteractiveArchDiagram';

/* ─── Hero stat tile ──────────────────────────────────────────────────── */
function Stat({
  label, value, sub, color, icon: Icon,
}: {
  label: string; value: string; sub?: string; color: string; icon: any;
}) {
  return (
    <div className="rounded-2xl p-5 bg-white"
      style={{ border: '1.5px solid rgba(91,0,232,0.10)', boxShadow: '0 2px 14px rgba(91,0,232,0.05)' }}>
      <div className="flex items-center justify-between mb-2">
        <p className="text-[10px] font-bold uppercase tracking-[0.15em] text-[#9CA3AF]">{label}</p>
        <div className="w-8 h-8 rounded-lg flex items-center justify-center"
          style={{ background: `${color}14`, border: `1px solid ${color}30` }}>
          <Icon className="w-4 h-4" style={{ color }} />
        </div>
      </div>
      <p className="text-[24px] font-black leading-none text-[#0D0D0D] tracking-tight font-mono">{value}</p>
      {sub && <p className="text-[11px] text-[#9CA3AF] mt-1.5">{sub}</p>}
    </div>
  );
}

/* ─── Tab ──────────────────────────────────────────────────────────── */
function TabButton({ active, onClick, children, count }: {
  active: boolean; onClick: () => void; children: React.ReactNode; count?: number;
}) {
  return (
    <button onClick={onClick}
      className="flex items-center gap-2 h-9 px-4 rounded-xl text-[12.5px] font-semibold transition-all"
      style={{
        background: active ? '#0D0D0D' : 'transparent',
        color: active ? '#fff' : '#6B7280',
        border: active ? '1.5px solid #0D0D0D' : '1.5px solid rgba(91,0,232,0.12)',
      }}>
      {children}
      {count != null && (
        <span className="text-[10px] font-mono px-1.5 py-0.5 rounded"
          style={{
            background: active ? 'rgba(255,255,255,0.18)' : 'rgba(91,0,232,0.08)',
            color: active ? '#fff' : '#5B00E8',
          }}>
          {count}
        </span>
      )}
    </button>
  );
}

/* ─── Main ─────────────────────────────────────────────────────────────── */
export default function BlueprintDetail() {
  const { id } = useParams<{ id: string }>();
  const { token } = useAuth();
  const apiKey = token || 'arch_test_key_dev';

  const [bp, setBp]           = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [recalcing, setRecalcing] = useState(false);
  const [error, setError]     = useState('');

  // Constraint controls — bound to the original request so user can tweak
  const [reqVolume, setReqVolume]   = useState(10000);
  const [maxLatency, setMaxLatency] = useState(2000);
  const [budget, setBudget]         = useState(0); // 0 = no budget cap
  const [preferOss, setPreferOss]   = useState(false);

  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);
  const [activeTab, setActiveTab]           = useState<'cost' | 'latency' | 'quality' | 'why'>('cost');
  const [showCompare, setShowCompare]       = useState(false);

  // Avoid recalculating the initial load + debounce slider changes
  const initialized = useRef(false);
  const debounceTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  /* ── Initial load ── */
  useEffect(() => {
    if (!id) return;
    fetch(`/v1/blueprints/${id}`, { headers: { Authorization: `Bearer ${apiKey}` } })
      .then(async r => {
        const t = await r.text();
        if (!t.trim()) throw new Error('Empty response');
        return JSON.parse(t);
      })
      .then(data => {
        setBp(data);
        setLoading(false);
        initialized.current = true;
      })
      .catch(e => { setError(e.message || 'Failed to load blueprint.'); setLoading(false); });
  }, [id]);

  /* ── Debounced recalculate on constraint change ── */
  useEffect(() => {
    if (!initialized.current || !bp) return;
    if (debounceTimer.current) clearTimeout(debounceTimer.current);
    debounceTimer.current = setTimeout(async () => {
      setRecalcing(true);
      try {
        const res = await fetch('/v1/architect', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${apiKey}` },
          body: JSON.stringify({
            input_text: bp.input_text || bp.query?.input_text || 'Recalculate',
            async_mode: false,
            request_volume: reqVolume,
            max_latency_ms: maxLatency,
            budget_monthly_usd: budget > 0 ? budget : null,
            prefer_open_source: preferOss,
          }),
        });
        if (res.ok) {
          const data = await res.json();
          // Preserve the blueprint id and input_text so the URL still resolves
          setBp((prev: any) => ({ ...prev, ...data, blueprint_id: prev?.blueprint_id || data.blueprint_id }));
        }
      } catch { /* keep prior data on failure */ }
      finally { setRecalcing(false); }
    }, 1200);
    return () => { if (debounceTimer.current) clearTimeout(debounceTimer.current); };
  }, [reqVolume, maxLatency, budget, preferOss]);

  if (loading) {
    return (
      <div className="p-8 min-h-[60vh] flex items-center justify-center">
        <Loader2 className="w-7 h-7 text-[#5B00E8] animate-spin" />
      </div>
    );
  }

  if (error || !bp) {
    return (
      <div className="p-8 max-w-3xl mx-auto space-y-5">
        <Link to="/dashboard" className="inline-flex items-center gap-2 text-[13px] text-[#6B7280] hover:text-[#5B00E8]">
          <ArrowLeft className="w-4 h-4" /> Back to Dashboard
        </Link>
        <div className="flex items-start gap-3 rounded-xl px-5 py-4 text-[13px]"
          style={{ background: 'rgba(239,68,68,0.06)', border: '1.5px solid rgba(239,68,68,0.2)', color: '#EF4444' }}>
          <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
          {error || 'Blueprint not found.'}
        </div>
      </div>
    );
  }

  const archJson: ArchJson = (bp.architecture_json && bp.architecture_json.nodes)
    ? bp.architecture_json
    : { nodes: [], edges: [] };

  const recs      = bp.model_recommendations || [];
  const costEst   = bp.cost_estimate || {};
  const latEst    = bp.latency_estimate || {};
  const evalScore = bp.eval_details || bp.eval_score || {};
  const totalCost = costEst.total_monthly_usd ?? 0;
  const totalP95  = latEst.total_p95_ms ?? 0;
  const topModel  = recs[0];
  const composite = typeof evalScore === 'object' ? evalScore.composite : evalScore;

  const inputText = bp.input_text || bp.query?.input_text || '';
  const selectedNode = selectedNodeId
    ? archJson.nodes.find(n => n.id === selectedNodeId) ?? null
    : null;

  // Match the selected architecture node back to its model recommendation, when possible.
  const selectedRec = useMemo(() => {
    if (!selectedNode) return null;
    return recs.find((r: any) =>
      (r.model_name && selectedNode.id?.includes(r.model_name.replace(/[^a-z0-9]/gi, '_'))) ||
      (r.model_name && selectedNode.label?.includes(r.model_name)) ||
      r.role === selectedNode.type,
    );
  }, [selectedNode, recs]);

  return (
    <div className="p-6 lg:p-8 w-full">
      <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
        className="space-y-6 max-w-7xl mx-auto">

        {/* Back */}
        <Link to="/dashboard"
          className="inline-flex items-center gap-2 text-[13px] text-[#6B7280] hover:text-[#5B00E8] transition-colors group">
          <ArrowLeft className="w-4 h-4 group-hover:-translate-x-0.5 transition-transform" />
          Back to Dashboard
        </Link>

        {/* Header — minimal */}
        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div className="min-w-0 flex-1">
            <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-[#5B00E8] mb-2">Architecture Blueprint</p>
            <h1 className="text-[22px] font-extrabold text-[#0D0D0D] leading-tight mb-2">
              {inputText.length > 110 ? `${inputText.slice(0, 110)}…` : inputText || 'Untitled blueprint'}
            </h1>
            {recalcing && (
              <span className="inline-flex items-center gap-1.5 text-[11px] font-semibold text-[#5B00E8]">
                <RefreshCw className="w-3 h-3 animate-spin" /> Recalculating with new constraints…
              </span>
            )}
          </div>
        </div>

        {/* ── 4 stat tiles ── */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          <Stat label="Top model" icon={Cpu} color="#5B00E8"
            value={topModel?.model_name ? topModel.model_name.slice(0, 18) : '—'}
            sub={topModel?.provider || ''} />
          <Stat label="Cost" icon={DollarSign} color="#059669"
            value={`$${totalCost.toFixed(2)}`}
            sub={`per month at ${reqVolume.toLocaleString()} req`} />
          <Stat label="Latency P95" icon={Zap} color="#3B82F6"
            value={`${totalP95}ms`}
            sub="end-to-end p95" />
          <Stat label="Quality" icon={Award} color="#D97706"
            value={composite != null ? composite.toFixed(2) : '—'}
            sub="RAGAs composite" />
        </div>

        {/* ── Architecture graph + constraints sidebar ── */}
        <div className="grid grid-cols-1 lg:grid-cols-[1fr_320px] gap-5">
          {/* Left — graph + node detail */}
          <div className="space-y-4">
            <InteractiveArchDiagram
              arch={archJson}
              selectedId={selectedNodeId}
              onSelect={setSelectedNodeId}
            />
            <AnimatePresence>
              {selectedNode && (
                <motion.div
                  initial={{ opacity: 0, y: -4 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -4 }}
                  className="rounded-2xl p-5 bg-white"
                  style={{ border: '1.5px solid rgba(91,0,232,0.18)', boxShadow: '0 4px 24px rgba(91,0,232,0.10)' }}>
                  <div className="flex items-start justify-between gap-3 mb-3">
                    <div>
                      <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-[#5B00E8] mb-1">
                        {selectedNode.type || 'node'}
                      </p>
                      <h3 className="text-[15px] font-bold text-[#0D0D0D] leading-tight">
                        {selectedNode.label || selectedNode.id}
                      </h3>
                    </div>
                    <button onClick={() => setSelectedNodeId(null)}
                      className="w-7 h-7 rounded-lg flex items-center justify-center text-[#9CA3AF] hover:bg-[#F4F2FF] hover:text-[#374151] transition-all">
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                  {selectedNode.description && (
                    <p className="text-[12px] text-[#6B7280] leading-relaxed mb-3">
                      {selectedNode.description}
                    </p>
                  )}
                  {selectedRec && (
                    <div className="grid grid-cols-2 gap-3 pt-3 mt-2"
                      style={{ borderTop: '1px solid rgba(91,0,232,0.08)' }}>
                      <div>
                        <p className="text-[9px] font-bold uppercase tracking-wider text-[#9CA3AF] mb-1">Model</p>
                        <Link to={`/models/${encodeURIComponent(selectedRec.model_name)}`}
                          className="font-mono text-[12px] font-bold text-[#5B00E8] hover:underline">
                          {selectedRec.model_name}
                        </Link>
                      </div>
                      <div>
                        <p className="text-[9px] font-bold uppercase tracking-wider text-[#9CA3AF] mb-1">Provider</p>
                        <p className="text-[12px] font-semibold text-[#0D0D0D]">{selectedRec.provider}</p>
                      </div>
                      {selectedRec.scores?.cost_score != null && (
                        <div>
                          <p className="text-[9px] font-bold uppercase tracking-wider text-[#9CA3AF] mb-1">Cost score</p>
                          <p className="font-mono text-[12px] font-bold text-[#059669]">{selectedRec.scores.cost_score.toFixed(2)}</p>
                        </div>
                      )}
                      {selectedRec.scores?.quality_score != null && (
                        <div>
                          <p className="text-[9px] font-bold uppercase tracking-wider text-[#9CA3AF] mb-1">Quality score</p>
                          <p className="font-mono text-[12px] font-bold text-[#D97706]">{selectedRec.scores.quality_score.toFixed(2)}</p>
                        </div>
                      )}
                    </div>
                  )}
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Right — constraint controls */}
          <div className="rounded-2xl p-5 bg-white"
            style={{ border: '1.5px solid rgba(91,0,232,0.12)', boxShadow: '0 2px 16px rgba(91,0,232,0.06)' }}>
            <div className="flex items-center gap-2 mb-4">
              <div className="w-7 h-7 rounded-lg flex items-center justify-center"
                style={{ background: 'rgba(91,0,232,0.10)', border: '1px solid rgba(91,0,232,0.20)' }}>
                <Sliders className="w-3.5 h-3.5 text-[#5B00E8]" />
              </div>
              <p className="text-[13px] font-bold text-[#0D0D0D]">Constraints</p>
            </div>

            <div className="space-y-5">
              <Slider label="Requests / month" value={reqVolume} min={1000} max={5_000_000} step={1000}
                onChange={setReqVolume}
                format={v => v.toLocaleString()} />
              <Slider label="Max latency (ms)" value={maxLatency} min={200} max={10_000} step={100}
                onChange={setMaxLatency}
                format={v => `${v} ms`} />
              <Slider label="Monthly budget ($)" value={budget} min={0} max={5000} step={10}
                onChange={setBudget}
                format={v => v === 0 ? 'no cap' : `$${v}`} />

              <label className="flex items-center gap-3 cursor-pointer">
                <input type="checkbox" checked={preferOss} onChange={e => setPreferOss(e.target.checked)}
                  className="w-4 h-4 rounded accent-[#5B00E8]" />
                <span className="text-[12px] font-medium text-[#374151]">Prefer open-source models</span>
              </label>
            </div>

            <p className="text-[10px] text-[#9CA3AF] mt-5 leading-relaxed">
              Changes auto-recalculate after 1.2 s of inactivity.
            </p>
          </div>
        </div>

        {/* ── Tabs ── */}
        <div className="flex items-center gap-2 flex-wrap">
          <TabButton active={activeTab === 'cost'}    onClick={() => setActiveTab('cost')}>Cost</TabButton>
          <TabButton active={activeTab === 'latency'} onClick={() => setActiveTab('latency')}>Latency</TabButton>
          <TabButton active={activeTab === 'quality'} onClick={() => setActiveTab('quality')}>Quality</TabButton>
          <TabButton active={activeTab === 'why'}     onClick={() => setActiveTab('why')}>Why this stack</TabButton>
        </div>

        <AnimatePresence mode="wait">
          <motion.div
            key={activeTab}
            initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -6 }}
            transition={{ duration: 0.18 }}
            className="rounded-2xl p-6 bg-white"
            style={{ border: '1.5px solid rgba(91,0,232,0.10)', boxShadow: '0 2px 16px rgba(91,0,232,0.06)' }}>

            {activeTab === 'cost' && (
              <div className="space-y-4">
                <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-[#059669]">Monthly cost breakdown</p>
                {(costEst.breakdown || []).map((b: any, i: number) => (
                  <div key={i} className="flex items-center justify-between py-2"
                    style={{ borderBottom: '1px solid rgba(91,0,232,0.06)' }}>
                    <div>
                      <p className="text-[12.5px] font-semibold text-[#0D0D0D] font-mono">{b.model_name}</p>
                      <p className="text-[11px] text-[#9CA3AF]">{b.role} · {b.provider}</p>
                    </div>
                    <p className="text-[14px] font-mono font-bold text-[#059669]">
                      ${(b.monthly_cost_usd ?? 0).toFixed(2)}<span className="text-[10px] text-[#9CA3AF] font-normal">/mo</span>
                    </p>
                  </div>
                ))}
                {(costEst.breakdown || []).length === 0 && (
                  <p className="text-[12px] text-[#9CA3AF]">No cost breakdown available.</p>
                )}
              </div>
            )}

            {activeTab === 'latency' && (
              <div className="space-y-4">
                <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-[#3B82F6]">Per-step latency (p50 / p95)</p>
                {(latEst.breakdown || []).map((b: any, i: number) => {
                  const max = Math.max(...(latEst.breakdown || []).map((x: any) => x.p95_ms || 1));
                  const pct = ((b.p95_ms || 0) / max) * 100;
                  return (
                    <div key={i}>
                      <div className="flex items-center justify-between mb-1.5">
                        <p className="text-[12px] font-semibold text-[#374151]">{b.step}</p>
                        <p className="text-[11px] font-mono text-[#6B7280]">
                          p50 <span className="font-bold text-[#374151]">{b.p50_ms}ms</span>
                          {' · '}
                          p95 <span className="font-bold text-[#3B82F6]">{b.p95_ms}ms</span>
                        </p>
                      </div>
                      <div className="w-full h-2 rounded-full" style={{ background: 'rgba(91,0,232,0.06)' }}>
                        <motion.div initial={{ width: 0 }} animate={{ width: `${pct}%` }} transition={{ duration: 0.5 }}
                          className="h-2 rounded-full" style={{ background: 'linear-gradient(90deg, #3B82F6, #7C3AED)' }} />
                      </div>
                    </div>
                  );
                })}
                {(latEst.breakdown || []).length === 0 && (
                  <p className="text-[12px] text-[#9CA3AF]">No latency breakdown available.</p>
                )}
              </div>
            )}

            {activeTab === 'quality' && (
              <div className="grid grid-cols-2 gap-4">
                <QualityRow label="Faithfulness"      v={evalScore?.faithfulness} />
                <QualityRow label="Answer relevancy"  v={evalScore?.answer_relevancy} />
                <QualityRow label="Context precision" v={evalScore?.context_precision} />
                <QualityRow label="Context recall"    v={evalScore?.context_recall} />
                <div className="col-span-2 rounded-xl p-4"
                  style={{ background: 'rgba(91,0,232,0.04)', border: '1px solid rgba(91,0,232,0.12)' }}>
                  <p className="text-[10px] font-bold uppercase tracking-wider text-[#5B00E8] mb-1">Composite</p>
                  <p className="text-[28px] font-black font-mono text-[#0D0D0D]">
                    {composite != null ? composite.toFixed(3) : '—'}
                  </p>
                </div>
              </div>
            )}

            {activeTab === 'why' && (
              <div className="space-y-4">
                <p className="text-[13px] text-[#374151] leading-relaxed">{bp.explanation || '—'}</p>
                {(bp.benchmark_citations || []).slice(0, 4).map((c: any, i: number) => (
                  <a key={i} href={c.source} target="_blank" rel="noopener noreferrer"
                    className="flex items-start gap-2 rounded-lg px-3 py-2 hover:bg-[#F4F2FF] transition-colors">
                    <ExternalLink className="w-3.5 h-3.5 text-[#5B00E8] mt-0.5 flex-shrink-0" />
                    <div className="min-w-0">
                      <p className="text-[11px] font-semibold text-[#374151] truncate">{c.metric}</p>
                      <p className="text-[10px] text-[#9CA3AF] truncate">{c.value}</p>
                    </div>
                  </a>
                ))}
              </div>
            )}
          </motion.div>
        </AnimatePresence>

        {/* ── Compare more models (collapsed by default) ── */}
        <div className="rounded-2xl bg-white overflow-hidden"
          style={{ border: '1.5px solid rgba(91,0,232,0.10)' }}>
          <button onClick={() => setShowCompare(v => !v)}
            className="w-full flex items-center justify-between px-6 py-4 transition-colors hover:bg-[rgba(91,0,232,0.03)]">
            <div className="flex items-center gap-3">
              <div className="w-7 h-7 rounded-lg flex items-center justify-center"
                style={{ background: 'rgba(91,0,232,0.10)', border: '1px solid rgba(91,0,232,0.20)' }}>
                <Cpu className="w-3.5 h-3.5 text-[#5B00E8]" />
              </div>
              <span className="text-[13px] font-bold text-[#0D0D0D]">
                Compare {recs.length} ranked model{recs.length === 1 ? '' : 's'}
              </span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-[10px] text-[#9CA3AF]">
                {showCompare ? 'Hide' : 'Click to expand'}
              </span>
              {showCompare ? <ChevronUp className="w-4 h-4 text-[#5B00E8]" /> : <ChevronDown className="w-4 h-4 text-[#9CA3AF]" />}
            </div>
          </button>

          <AnimatePresence initial={false}>
            {showCompare && (
              <motion.div
                initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }}
                transition={{ duration: 0.22 }}>
                <div className="px-6 pb-6 space-y-2">
                  {recs.map((r: any, i: number) => (
                    <Link key={`${r.model_name}-${i}`} to={`/models/${encodeURIComponent(r.model_name)}`}
                      className="flex items-center justify-between gap-3 rounded-xl px-4 py-3 transition-all hover:bg-[#F4F2FF]"
                      style={{ background: i === 0 ? 'rgba(91,0,232,0.04)' : '#FAFAFC', border: '1px solid rgba(91,0,232,0.08)' }}>
                      <div className="flex items-center gap-3 min-w-0">
                        <span className="text-[10px] font-mono font-bold w-6 text-center flex-shrink-0"
                          style={{ color: i === 0 ? '#5B00E8' : '#9CA3AF' }}>
                          #{i + 1}
                        </span>
                        <div className="min-w-0">
                          <p className="font-mono text-[12px] font-bold text-[#0D0D0D] truncate">{r.model_name}</p>
                          <p className="text-[10px] text-[#9CA3AF]">{r.provider} · {r.task || r.role || 'model'}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-3 flex-shrink-0">
                        {r.scores?.cost_score != null && (
                          <Pill label="cost"    score={r.scores.cost_score}    color="#059669" />
                        )}
                        {r.scores?.latency_score != null && (
                          <Pill label="latency" score={r.scores.latency_score} color="#3B82F6" />
                        )}
                        {r.scores?.quality_score != null && (
                          <Pill label="quality" score={r.scores.quality_score} color="#D97706" />
                        )}
                      </div>
                    </Link>
                  ))}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

      </motion.div>
    </div>
  );
}

/* ─── Helpers ───────────────────────────────────────────────────────── */

function QualityRow({ label, v }: { label: string; v: number | null | undefined }) {
  const value = v == null ? null : v;
  const color = value == null ? '#9CA3AF' : value >= 0.7 ? '#059669' : value >= 0.4 ? '#D97706' : '#EF4444';
  return (
    <div className="rounded-xl p-4" style={{ background: '#FAFAFC', border: '1px solid rgba(91,0,232,0.08)' }}>
      <p className="text-[10px] font-bold uppercase tracking-wider text-[#9CA3AF] mb-2">{label}</p>
      <p className="text-[20px] font-black font-mono" style={{ color }}>
        {value == null ? '—' : value.toFixed(2)}
      </p>
    </div>
  );
}

function Pill({ label, score, color }: { label: string; score: number; color: string }) {
  return (
    <div className="text-center" title={label}>
      <p className="text-[9px] font-bold uppercase tracking-wider text-[#9CA3AF]">{label}</p>
      <p className="font-mono text-[12px] font-bold" style={{ color }}>{score.toFixed(2)}</p>
    </div>
  );
}

function Slider({
  label, value, min, max, step, onChange, format,
}: {
  label: string; value: number; min: number; max: number; step: number;
  onChange: (v: number) => void; format: (v: number) => string;
}) {
  return (
    <div>
      <div className="flex items-center justify-between mb-1.5">
        <p className="text-[11px] font-bold uppercase tracking-[0.12em] text-[#6B7280]">{label}</p>
        <p className="text-[12px] font-mono font-bold text-[#5B00E8]">{format(value)}</p>
      </div>
      <input type="range" min={min} max={max} step={step} value={value}
        onChange={e => onChange(Number(e.target.value))}
        className="w-full accent-[#5B00E8] cursor-pointer" />
    </div>
  );
}
