import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  ArrowLeft, Loader2, AlertCircle, Network, DollarSign,
  Zap, Brain, Star, ChevronDown, ChevronUp, ArrowRight,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import MermaidDiagram from '../components/ui/MermaidDiagram';
import CostTable from '../components/ui/CostTable';
import LatencyTable from '../components/ui/LatencyTable';
import ScoreGauge from '../components/ui/ScoreGauge';
import DownloadButton from '../components/ui/DownloadButton';

// ─── Collapsible section (same as Builder) ───────────────────────────────────
function Section({ title, icon: Icon, children, defaultOpen = true }: {
  title: string; icon: any; children: React.ReactNode; defaultOpen?: boolean;
}) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div className="bg-surface/70 border border-white/5 rounded-2xl overflow-hidden">
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between px-6 py-4 hover:bg-white/3 transition-colors"
      >
        <h2 className="text-base font-semibold text-white flex items-center gap-2">
          <Icon className="w-4 h-4 text-archon-mist" />
          {title}
        </h2>
        {open ? <ChevronUp className="w-4 h-4 text-white/30" /> : <ChevronDown className="w-4 h-4 text-white/30" />}
      </button>
      {open && <div className="px-6 pb-6">{children}</div>}
    </div>
  );
}

// ─── Score badge ──────────────────────────────────────────────────────────────
function ScoreBadge({ score }: { score: number | null | undefined }) {
  if (score == null) return <span className="text-white/30 text-xs font-mono">N/A</span>;
  const color =
    score >= 0.7 ? 'text-semantic-success bg-semantic-success/10' :
    score >= 0.4 ? 'text-semantic-warning bg-semantic-warning/10' :
                  'text-semantic-danger bg-semantic-danger/10';
  return (
    <span className={`text-xs font-mono px-2 py-0.5 rounded ${color}`}>
      {score.toFixed(3)}
    </span>
  );
}

// ─── Main component ───────────────────────────────────────────────────────────
export default function BlueprintDetail() {
  const { id } = useParams<{ id: string }>();
  const { token } = useAuth();
  const apiKey = token || 'arch_test_key_dev';

  const [bp, setBp] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!id) return;
    fetch(`/v1/blueprints/${id}`, {
      headers: { Authorization: `Bearer ${apiKey}` },
    })
      .then(r => {
        if (!r.ok) throw new Error(`HTTP ${r.status}`);
        return r.json();
      })
      .then(data => { setBp(data); setLoading(false); })
      .catch(e => { setError(e.message || 'Failed to load blueprint.'); setLoading(false); });
  }, [id]);

  if (loading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-archon-mist animate-spin" />
      </div>
    );
  }

  if (error || !bp) {
    return (
      <div className="space-y-6">
        <Link to="/dashboard" className="inline-flex items-center gap-2 text-sm text-white/50 hover:text-white transition-colors">
          <ArrowLeft className="w-4 h-4" /> Back to Dashboard
        </Link>
        <div className="flex items-start gap-3 bg-semantic-danger/10 border border-semantic-danger/30 rounded-xl px-5 py-4 text-sm text-semantic-danger">
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

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-6 max-w-5xl"
    >
      {/* Back nav */}
      <Link
        to="/dashboard"
        className="inline-flex items-center gap-2 text-sm text-white/50 hover:text-white transition-colors"
      >
        <ArrowLeft className="w-4 h-4" /> Back to Dashboard
      </Link>

      {/* Header */}
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-2xl font-semibold text-white">Architecture Blueprint</h1>
          <p className="text-sm text-white/40 mt-1 max-w-2xl">{input_text}</p>
          {formattedDate && (
            <p className="text-xs text-white/25 mt-1">Generated {formattedDate}</p>
          )}
        </div>
        <div className="flex items-center gap-3 flex-shrink-0">
          <DownloadButton blueprintData={bp} inputText={input_text} />
        </div>
      </div>

      {/* Low confidence warning */}
      {isLowConf && (
        <div className="flex items-start gap-3 bg-semantic-warning/10 border border-semantic-warning/30 rounded-xl px-5 py-4 text-sm text-semantic-warning">
          <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
          <span>
            <strong>Low Confidence Flag</strong> — RAGAs evaluation scored below 0.7. Review the recommendations carefully before production use.
          </span>
        </div>
      )}

      {/* Architecture Diagram */}
      {architecture_diagram && (
        <Section title="Architecture Diagram" icon={Network}>
          <MermaidDiagram chart={architecture_diagram} />
        </Section>
      )}

      {/* Model Recommendations */}
      {recs.length > 0 && (
        <Section title={`Recommended Models (${recs.length})`} icon={Star}>
          <div className="overflow-hidden rounded-xl border border-white/5">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-white/5 text-xs font-medium text-white/40 uppercase tracking-wider">
                  <th className="px-5 py-3 text-left">Model</th>
                  <th className="px-5 py-3 text-left">Task</th>
                  <th className="px-5 py-3 text-right">Composite</th>
                  <th className="px-5 py-3 text-right">Cost</th>
                  <th className="px-5 py-3 text-right">Quality</th>
                  <th className="px-5 py-3 text-right">Latency</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {recs.map((r: any, i: number) => (
                  <tr key={i} className={`hover:bg-white/3 transition-colors ${i === 0 ? 'bg-archon-core/5' : ''}`}>
                    <td className="px-5 py-3.5">
                      <div className="font-medium text-white flex items-center gap-2">
                        {i === 0 && <Star className="w-3.5 h-3.5 text-archon-mist fill-archon-mist" />}
                        {r.model_name}
                      </div>
                      <div className="text-xs text-white/40 capitalize mt-0.5">{r.provider}</div>
                    </td>
                    <td className="px-5 py-3.5 text-xs text-white/50 capitalize">{r.task?.replace('_', ' ')}</td>
                    <td className="px-5 py-3.5 text-right"><ScoreBadge score={r.scores?.composite} /></td>
                    <td className="px-5 py-3.5 text-right"><ScoreBadge score={r.scores?.cost_score} /></td>
                    <td className="px-5 py-3.5 text-right"><ScoreBadge score={r.scores?.quality_score} /></td>
                    <td className="px-5 py-3.5 text-right"><ScoreBadge score={r.scores?.latency_score} /></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Section>
      )}

      {/* Cost Estimate */}
      {costEst.breakdown?.length > 0 && (
        <Section title="Cost Estimate" icon={DollarSign}>
          <CostTable
            breakdown={costEst.breakdown}
            totalMonthly={costEst.total_monthly_usd ?? 0}
            requestVolume={10000}
          />
        </Section>
      )}

      {/* Latency Estimate */}
      {latEst.breakdown?.length > 0 && (
        <Section title="Latency Estimate" icon={Zap}>
          <LatencyTable breakdown={latEst.breakdown} totalP95={latEst.total_p95_ms ?? 0} />
        </Section>
      )}

      {/* RAGAs Eval */}
      <Section title="RAGAs Evaluation" icon={Brain} defaultOpen={false}>
        <div className="flex items-center gap-8 flex-wrap">
          <ScoreGauge score={evalScore.composite ?? null} label="Composite" size="lg" />
          <div className="grid grid-cols-2 gap-4">
            {[
              { label: 'Faithfulness', key: 'faithfulness' },
              { label: 'Answer Relevancy', key: 'answer_relevancy' },
              { label: 'Context Precision', key: 'context_precision' },
              { label: 'Context Recall', key: 'context_recall' },
            ].map(({ label, key }) => (
              <ScoreGauge key={key} score={evalScore[key] ?? null} label={label} size="sm" />
            ))}
          </div>
          {evalScore.is_low_confidence && (
            <p className="text-xs text-semantic-warning/80 max-w-xs">
              These scores are null because RAGAs evaluation requires an LLM API key. Add <code className="bg-white/5 px-1 rounded">OPENAI_API_KEY</code> or <code className="bg-white/5 px-1 rounded">ANTHROPIC_API_KEY</code> in .env.
            </p>
          )}
        </div>
      </Section>

      {/* Explanation */}
      {explanation && (
        <Section title="Explanation & Tradeoffs" icon={Brain}>
          <div className="prose prose-invert max-w-none">
            <p className="text-sm text-white/70 leading-relaxed whitespace-pre-wrap">{explanation}</p>
          </div>
        </Section>
      )}

      {/* Citations */}
      {citations.length > 0 && (
        <Section title={`Benchmark Citations (${citations.length})`} icon={ArrowRight} defaultOpen={false}>
          <ul className="space-y-2">
            {citations.map((c: any, i: number) => (
              <li key={i} className="flex items-start gap-3 text-xs text-white/50">
                <span className="text-archon-mist font-mono">[{i + 1}]</span>
                <div>
                  <span className="text-white/70">{c.metric}:</span> {c.value}
                  {c.source && (
                    <a href={c.source} target="_blank" rel="noopener noreferrer"
                      className="ml-2 text-archon-mist hover:text-white underline underline-offset-2">
                      {c.source}
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
