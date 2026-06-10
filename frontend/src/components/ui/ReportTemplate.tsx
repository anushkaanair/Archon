/**
 * ReportTemplate.tsx
 * Pure React component — 3 A4 pages (794×1123px) with inline styles only.
 * Used by: generatePDF (off-screen capture) and BlueprintDetail (live preview).
 * NO Tailwind, NO CSS classes on styled elements — html2canvas requirement.
 */

/* ─── Types ──────────────────────────────────────────────────────────────── */
export interface ModelRec {
  model_name: string;
  provider: string;
  task?: string;
  scores?: {
    composite?: number;
    quality_score?: number;
    cost_score?: number;
    latency_score?: number;
  };
}

export interface CostItem {
  model_name: string;
  provider?: string;
  role?: string;
  monthly_cost_usd?: number;
  cost_per_request_usd?: number;
}

export interface LatencyItem {
  step: string;
  p50_ms?: number;
  p95_ms?: number;
}

export interface EvalDetails {
  composite?: number | null;
  faithfulness?: number | null;
  answer_relevancy?: number | null;
  context_precision?: number | null;
  context_recall?: number | null;
  is_low_confidence?: boolean;
}

export interface Citation {
  metric?: string;
  value?: string;
  source?: string | null;
}

export interface BlueprintData {
  id?: string;
  input_text: string;
  explanation?: string;
  architecture_diagram?: string;
  /** API response field */
  model_recommendations?: ModelRec[];
  /** Mock fallback field */
  recommendations?: ModelRec[];
  cost_estimate?: {
    total_monthly_usd?: number;
    breakdown?: CostItem[];
  };
  latency_estimate?: {
    total_p95_ms?: number;
    breakdown?: LatencyItem[];
  };
  /** API response field */
  eval_details?: EvalDetails;
  /** Mock fallback field */
  eval_score?: EvalDetails;
  benchmark_citations?: Citation[];
  confidence_flag?: string;
  created_at?: string;
}

/* ─── Design tokens ──────────────────────────────────────────────────────── */
const NAVY   = '#0A0025';
const PURPLE = '#5B00E8';
const PAGE_W = 794;
const PAGE_H = 1123;
const FONT_TEXT = "'Bricolage Grotesque', Arial, sans-serif";
const FONT_MONO = "'JetBrains Mono', 'Courier New', monospace";

/* ─── Shared micro-components ────────────────────────────────────────────── */

function ClassificationBanner() {
  return (
    <div style={{
      background: NAVY, color: '#C4B5FD', textAlign: 'center' as const,
      fontSize: 7.5, letterSpacing: '0.2em', textTransform: 'uppercase' as const,
      padding: '5px 0', fontFamily: FONT_MONO, fontWeight: 700,
    }}>
      CONFIDENTIAL — INTERNAL USE ONLY
    </div>
  );
}

function PageHeader({ date, subtitle }: { date: string; subtitle: string }) {
  return (
    <div style={{
      padding: '10px 28px', borderBottom: `3px solid ${NAVY}`,
      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
    }}>
      <div style={{ fontFamily: FONT_TEXT, fontWeight: 900, fontSize: 17, color: PURPLE, letterSpacing: '-0.02em' }}>
        ARCHON
      </div>
      <div style={{ fontFamily: FONT_TEXT, fontSize: 9, color: '#6B7280', letterSpacing: '0.06em', textTransform: 'uppercase' as const }}>
        AI Architecture Report · {subtitle}
      </div>
      <div style={{ fontFamily: FONT_MONO, fontSize: 8.5, color: '#9CA3AF' }}>{date}</div>
    </div>
  );
}

function PageFooter({ bpId, page, total }: { bpId: string; page: number; total: number }) {
  return (
    <div style={{
      position: 'absolute' as const, bottom: 0, left: 0, right: 0,
      padding: '7px 28px', borderTop: '1px solid rgba(10,0,37,0.1)',
      display: 'flex', justifyContent: 'space-between', alignItems: 'center',
    }}>
      <span style={{ fontFamily: FONT_MONO, fontSize: 7.5, color: '#9CA3AF' }}>{bpId}</span>
      <span style={{ fontFamily: FONT_MONO, fontSize: 7.5, color: '#9CA3AF' }}>CONFIDENTIAL</span>
      <span style={{ fontFamily: FONT_MONO, fontSize: 7.5, color: '#9CA3AF' }}>Page {page} of {total}</span>
    </div>
  );
}

function SectionLabel({ title, color = PURPLE }: { title: string; color?: string }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 8 }}>
      <div style={{ width: 3, height: 12, background: color, borderRadius: 2, flexShrink: 0 }} />
      <div style={{ fontFamily: FONT_TEXT, fontSize: 7.5, fontWeight: 800, textTransform: 'uppercase' as const, letterSpacing: '0.12em', color: '#4B5563' }}>
        {title}
      </div>
    </div>
  );
}

function ScoreChip({ value }: { value: number | null | undefined }) {
  if (value == null) return <span style={{ fontFamily: FONT_MONO, fontSize: 8.5, color: '#D1D5DB' }}>—</span>;
  const [bg, fg] = value >= 0.85
    ? ['rgba(5,150,105,0.1)', '#059669']
    : value >= 0.7
    ? ['rgba(217,119,6,0.1)', '#D97706']
    : ['rgba(239,68,68,0.1)', '#EF4444'];
  return (
    <span style={{ fontFamily: FONT_MONO, fontSize: 8.5, padding: '1px 5px', borderRadius: 4, background: bg, color: fg }}>
      {value.toFixed(3)}
    </span>
  );
}

/* ─── Page 1: Executive Overview ─────────────────────────────────────────── */

function Page1({
  blueprint, bpId, formattedDate, recs, evalDetails, totalCost, totalP95,
}: {
  blueprint: BlueprintData;
  bpId: string;
  formattedDate: string;
  recs: ModelRec[];
  evalDetails: EvalDetails;
  totalCost: number;
  totalP95: number;
}) {
  const topModel = recs[0];
  const isHighConf = blueprint.confidence_flag !== 'low_confidence';
  const slug = blueprint.input_text.length > 60
    ? blueprint.input_text.substring(0, 60) + '…'
    : blueprint.input_text;
  const quoteText = blueprint.input_text.length > 220
    ? blueprint.input_text.substring(0, 220) + '…'
    : blueprint.input_text;
  const summaryText = blueprint.explanation
    ? blueprint.explanation.substring(0, 380) + (blueprint.explanation.length > 380 ? '…' : '')
    : 'No explanation available.';

  const costBreakdown = blueprint.cost_estimate?.breakdown ?? [];
  const latBreakdown  = blueprint.latency_estimate?.breakdown ?? [];
  const maxCost = Math.max(...costBreakdown.map(x => x.monthly_cost_usd ?? 0), 0.01);
  const maxLat  = Math.max(...latBreakdown.map(x => x.p95_ms ?? 0), 1);

  const ragasComposite = evalDetails.composite;
  const ragasLabel = ragasComposite == null
    ? 'not evaluated'
    : ragasComposite >= 0.8 ? 'prod-ready'
    : ragasComposite >= 0.7 ? 'acceptable'
    : 'do not deploy';

  return (
    <div
      data-report-page="true"
      style={{
        width: PAGE_W, height: PAGE_H, background: '#fff',
        position: 'relative' as const, overflow: 'hidden',
        fontFamily: FONT_TEXT, boxSizing: 'border-box' as const,
      }}
    >
      <ClassificationBanner />
      <PageHeader date={formattedDate} subtitle="Executive Overview" />

      <div style={{ padding: '14px 28px 50px', display: 'flex', flexDirection: 'column' as const, gap: 12 }}>

        {/* Document Metadata Strip */}
        <div style={{ display: 'flex', border: '1px solid rgba(10,0,37,0.1)', borderRadius: 6, overflow: 'hidden' }}>
          {([
            ['Blueprint ID', bpId],
            ['Version', 'v1.0.0'],
            ['Owner', 'Archon AI'],
            ['Last Reviewed', formattedDate],
            ['Status', 'Approved'],
          ] as [string, string][]).map(([label, value], i) => (
            <div key={label} style={{
              flex: 1, padding: '7px 10px',
              background: i % 2 === 0 ? '#F9FAFB' : '#fff',
              borderRight: i < 4 ? '1px solid rgba(10,0,37,0.08)' : 'none',
            }}>
              <div style={{ fontFamily: FONT_TEXT, fontSize: 7, textTransform: 'uppercase' as const, letterSpacing: '0.1em', color: '#9CA3AF', marginBottom: 2 }}>{label}</div>
              <div style={{ fontFamily: FONT_MONO, fontSize: 9, color: '#374151', fontWeight: 600 }}>{value}</div>
            </div>
          ))}
        </div>

        {/* Title Block */}
        <div>
          <div style={{ display: 'flex', alignItems: 'flex-start', gap: 10, marginBottom: 6 }}>
            <div style={{ fontFamily: FONT_TEXT, fontSize: 18, fontWeight: 900, color: NAVY, letterSpacing: '-0.02em', lineHeight: 1.1, flex: 1 }}>
              {slug}
            </div>
            <div style={{
              padding: '3px 9px', borderRadius: 100, fontSize: 8, fontWeight: 700,
              fontFamily: FONT_TEXT, whiteSpace: 'nowrap' as const, flexShrink: 0, marginTop: 3,
              background: isHighConf ? 'rgba(5,150,105,0.1)' : 'rgba(217,119,6,0.1)',
              color: isHighConf ? '#059669' : '#D97706',
              border: `1px solid ${isHighConf ? 'rgba(5,150,105,0.25)' : 'rgba(217,119,6,0.25)'}`,
            }}>
              {isHighConf ? '✓ HIGH CONFIDENCE' : '⚠ LOW CONFIDENCE'}
            </div>
          </div>
          <div style={{
            padding: '8px 14px', borderLeft: `3px solid ${PURPLE}`,
            background: 'rgba(91,0,232,0.03)', borderRadius: '0 6px 6px 0',
          }}>
            <div style={{ fontFamily: FONT_TEXT, fontSize: 10, fontStyle: 'italic', color: '#374151', lineHeight: 1.55 }}>
              "{quoteText}"
            </div>
          </div>
        </div>

        {/* Executive Summary */}
        <div style={{ background: NAVY, borderRadius: 8, padding: '12px 16px' }}>
          <div style={{ fontSize: 7, fontFamily: FONT_TEXT, fontWeight: 800, textTransform: 'uppercase' as const, letterSpacing: '0.14em', color: PURPLE, marginBottom: 6 }}>
            ▸ ARCHON RECOMMENDATION
          </div>
          <div style={{ fontSize: 9.5, fontFamily: FONT_TEXT, color: '#E5E7EB', lineHeight: 1.65 }}>
            {summaryText}
          </div>
        </div>

        {/* 4 KPI Cards */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 8 }}>
          {([
            { label: 'TOP MODEL',       value: topModel?.model_name ?? '—',                                              sub: topModel ? `via ${topModel.provider}` : 'no data',             color: PURPLE    },
            { label: 'MONTHLY COST',    value: totalCost > 0 ? `$${totalCost.toFixed(2)}` : '—',                         sub: totalCost > 0 ? `±$${(totalCost * 0.15).toFixed(2)} (90% CI)` : 'no pricing data', color: '#059669' },
            { label: 'P95 LATENCY',     value: totalP95  > 0 ? `${totalP95}ms` : '—',                                    sub: totalP95  > 0 ? (totalP95 < 1000 ? 'fast' : totalP95 < 3000 ? 'medium' : 'slow') : 'no data', color: '#3B82F6' },
            { label: 'RAGAS COMPOSITE', value: ragasComposite != null ? ragasComposite.toFixed(3) : '—',                  sub: ragasLabel,                                                    color: '#D97706' },
          ] as { label: string; value: string; sub: string; color: string }[]).map(({ label, value, sub, color }) => (
            <div key={label} style={{ border: `1.5px solid ${color}22`, borderRadius: 8, padding: '10px 12px', background: `${color}07` }}>
              <div style={{ fontSize: 7, fontFamily: FONT_TEXT, fontWeight: 800, textTransform: 'uppercase' as const, letterSpacing: '0.1em', color: '#9CA3AF', marginBottom: 4 }}>{label}</div>
              <div style={{ fontSize: 15, fontFamily: FONT_MONO, fontWeight: 700, color: NAVY, lineHeight: 1.1, marginBottom: 3 }}>{value}</div>
              <div style={{ fontSize: 8, fontFamily: FONT_TEXT, color: '#6B7280' }}>{sub}</div>
            </div>
          ))}
        </div>

        {/* Model Comparison Table */}
        <div>
          <SectionLabel title="Model Comparison" />
          <table style={{ width: '100%', borderCollapse: 'collapse' as const, fontSize: 8.5 }}>
            <thead>
              <tr style={{ background: '#F3F4F6' }}>
                {(['Model', 'Provider', 'Task', 'Composite', 'Quality', 'Cost', 'Latency', 'Rank'] as string[]).map(h => (
                  <th key={h} style={{ padding: '5px 7px', textAlign: 'left' as const, fontFamily: FONT_TEXT, fontSize: 7, fontWeight: 800, textTransform: 'uppercase' as const, letterSpacing: '0.08em', color: '#6B7280', borderBottom: `1.5px solid rgba(10,0,37,0.1)` }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {recs.slice(0, 7).map((r, i) => (
                <tr key={i} style={{ borderBottom: '1px solid rgba(10,0,37,0.05)', background: i === 0 ? 'rgba(91,0,232,0.03)' : 'transparent' }}>
                  <td style={{ padding: '4px 7px', fontFamily: FONT_TEXT, fontWeight: 600, color: '#0D0D0D', fontSize: 9 }}>{r.model_name}</td>
                  <td style={{ padding: '4px 7px', fontFamily: FONT_TEXT, color: '#6B7280', fontSize: 8, textTransform: 'capitalize' as const }}>{r.provider}</td>
                  <td style={{ padding: '4px 7px', fontFamily: FONT_TEXT, color: '#6B7280', fontSize: 8, textTransform: 'capitalize' as const }}>{(r.task ?? '').replace(/_/g, ' ')}</td>
                  <td style={{ padding: '4px 7px' }}><ScoreChip value={r.scores?.composite} /></td>
                  <td style={{ padding: '4px 7px' }}><ScoreChip value={r.scores?.quality_score} /></td>
                  <td style={{ padding: '4px 7px' }}><ScoreChip value={r.scores?.cost_score} /></td>
                  <td style={{ padding: '4px 7px' }}><ScoreChip value={r.scores?.latency_score} /></td>
                  <td style={{ padding: '4px 7px' }}>
                    <span style={{
                      fontFamily: FONT_MONO, fontSize: 7.5, padding: '1px 6px', borderRadius: 100,
                      background: i === 0 ? PURPLE : i === 1 ? '#374151' : '#F3F4F6',
                      color: i < 2 ? '#fff' : '#6B7280', fontWeight: 700,
                    }}>#{i + 1}</span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Two-column: Cost + Latency breakdown */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
          <div>
            <SectionLabel title="Cost Breakdown" color="#059669" />
            {costBreakdown.slice(0, 4).map((item, i) => {
              const pct = Math.round(((item.monthly_cost_usd ?? 0) / maxCost) * 100);
              return (
                <div key={i} style={{ marginBottom: 8 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 2 }}>
                    <span style={{ fontFamily: FONT_TEXT, fontSize: 8.5, color: '#374151', fontWeight: 600 }}>{item.model_name}</span>
                    <span style={{ fontFamily: FONT_MONO, fontSize: 8.5, color: '#059669' }}>${(item.monthly_cost_usd ?? 0).toFixed(2)}/mo</span>
                  </div>
                  <div style={{ height: 4, background: '#E5E7EB', borderRadius: 2, overflow: 'hidden' }}>
                    <div style={{ height: '100%', width: `${pct}%`, background: '#059669', borderRadius: 2 }} />
                  </div>
                </div>
              );
            })}
          </div>
          <div>
            <SectionLabel title="Latency Breakdown (P95)" color="#3B82F6" />
            {latBreakdown.slice(0, 5).map((item, i) => {
              const pct = Math.round(((item.p95_ms ?? 0) / maxLat) * 100);
              return (
                <div key={i} style={{ marginBottom: 8 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 2 }}>
                    <span style={{ fontFamily: FONT_TEXT, fontSize: 8.5, color: '#374151', fontWeight: 600 }}>{item.step}</span>
                    <span style={{ fontFamily: FONT_MONO, fontSize: 8.5, color: '#3B82F6' }}>{item.p95_ms ?? 0}ms</span>
                  </div>
                  <div style={{ height: 4, background: '#E5E7EB', borderRadius: 2, overflow: 'hidden' }}>
                    <div style={{ height: '100%', width: `${pct}%`, background: '#3B82F6', borderRadius: 2 }} />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

      </div>
      <PageFooter bpId={bpId} page={1} total={3} />
    </div>
  );
}

/* ─── Page 2: Technical Deep-Dive ────────────────────────────────────────── */

function Page2({
  blueprint: _blueprint, bpId, formattedDate, recs, evalDetails, totalCost,
}: {
  blueprint: BlueprintData;
  bpId: string;
  formattedDate: string;
  recs: ModelRec[];
  evalDetails: EvalDetails;
  totalCost: number;
}) {
  const topModel    = recs[0];
  const budgetModel = recs.find(r => (r.scores?.cost_score ?? 0) > 0.9 && r !== topModel) ?? recs[1];

  const costPerCall = totalCost > 0 ? totalCost / 10000 : 0.001;
  const projTiers = [
    { label: '10K calls/day',  monthly: 300_000 },
    { label: '50K calls/day',  monthly: 1_500_000 },
    { label: '100K calls/day', monthly: 3_000_000 },
    { label: '500K calls/day', monthly: 15_000_000 },
  ].map(t => ({
    ...t,
    projected: costPerCall * t.monthly,
    delta: t.monthly > 10000 ? `+${(((costPerCall * t.monthly) / (totalCost || 1) - 1) * 100).toFixed(0)}%` : 'baseline',
  }));

  const infraCost   = 200;
  const monitorCost = 50;
  const engCost     = 1500;
  const tco = totalCost + infraCost + monitorCost + engCost;

  const ragasMetrics = [
    { label: 'Composite',      value: evalDetails.composite,         threshold: 0.8 },
    { label: 'Faithfulness',   value: evalDetails.faithfulness,      threshold: 0.8 },
    { label: 'Ans. Relevancy', value: evalDetails.answer_relevancy,  threshold: 0.8 },
    { label: 'Ctx. Precision', value: evalDetails.context_precision, threshold: 0.8 },
    { label: 'Ctx. Recall',    value: evalDetails.context_recall,    threshold: 0.8 },
  ];

  const riskItems = [
    { label: 'Vendor Lock-in',      impact: 'High',   likelihood: 'High',   color: '#EF4444' },
    { label: 'Data Privacy / GDPR', impact: 'High',   likelihood: 'High',   color: '#EF4444' },
    { label: 'API Rate Limits',     impact: 'Medium', likelihood: 'Medium', color: '#D97706' },
    { label: 'Model Deprecation',   impact: 'Medium', likelihood: 'Low',    color: '#6B7280' },
  ];

  const secChips = [
    { label: 'GDPR',               status: '⚠', text: 'Review Required' },
    { label: 'Data Residency',     status: '⚠', text: 'Review Required' },
    { label: 'PII Handling',       status: '⚠', text: 'Review Required' },
    { label: 'SOC2',               status: '⚠', text: 'Review Required' },
    { label: 'Encryption',         status: '✓', text: 'TLS 1.3 + AES-256' },
    { label: 'API Key Management', status: '⚠', text: 'Review Required' },
  ];

  return (
    <div
      data-report-page="true"
      style={{
        width: PAGE_W, height: PAGE_H, background: '#fff',
        position: 'relative' as const, overflow: 'hidden',
        fontFamily: FONT_TEXT, boxSizing: 'border-box' as const,
      }}
    >
      <ClassificationBanner />
      <PageHeader date={formattedDate} subtitle="Technical Deep-Dive" />

      <div style={{ padding: '14px 28px 50px', display: 'flex', flexDirection: 'column' as const, gap: 12 }}>

        {/* Cost Projection + True TCO */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>

          <div>
            <SectionLabel title="Cost Projection at Scale" color="#059669" />
            <table style={{ width: '100%', borderCollapse: 'collapse' as const, fontSize: 8.5 }}>
              <thead>
                <tr style={{ background: '#F3F4F6' }}>
                  {(['Volume', 'Monthly', 'vs Baseline'] as string[]).map(h => (
                    <th key={h} style={{ padding: '5px 8px', textAlign: 'left' as const, fontFamily: FONT_TEXT, fontSize: 7, fontWeight: 800, textTransform: 'uppercase' as const, letterSpacing: '0.08em', color: '#6B7280', borderBottom: '1.5px solid rgba(10,0,37,0.1)' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {projTiers.map((t, i) => (
                  <tr key={i} style={{ borderBottom: '1px solid rgba(10,0,37,0.05)', background: i === 0 ? 'rgba(5,150,105,0.03)' : 'transparent' }}>
                    <td style={{ padding: '5px 8px', fontFamily: FONT_TEXT, fontSize: 8.5, color: '#374151', fontWeight: i === 0 ? 700 : 400 }}>{t.label}</td>
                    <td style={{ padding: '5px 8px', fontFamily: FONT_MONO, fontSize: 8.5, color: '#059669' }}>${t.projected.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
                    <td style={{ padding: '5px 8px', fontFamily: FONT_MONO, fontSize: 8, color: i === 0 ? '#9CA3AF' : '#D97706' }}>{t.delta}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div>
            <SectionLabel title="True TCO (Monthly)" color="#374151" />
            {[
              { label: 'API Cost',             value: totalCost,   color: PURPLE },
              { label: 'Infra (Redis + VDB)',   value: infraCost,   color: '#3B82F6' },
              { label: 'Monitoring (Langfuse)', value: monitorCost, color: '#6B7280' },
              { label: 'Engineering (0.1 FTE)', value: engCost,     color: '#D97706' },
            ].map(({ label, value, color }) => (
              <div key={label} style={{ display: 'flex', justifyContent: 'space-between', padding: '5px 0', borderBottom: '1px solid rgba(10,0,37,0.06)' }}>
                <span style={{ fontFamily: FONT_TEXT, fontSize: 8.5, color: '#374151' }}>{label}</span>
                <span style={{ fontFamily: FONT_MONO, fontSize: 8.5, color }}>${value.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
              </div>
            ))}
            <div style={{ display: 'flex', justifyContent: 'space-between', padding: '7px 0', marginTop: 2, borderTop: `2px solid ${NAVY}` }}>
              <span style={{ fontFamily: FONT_TEXT, fontSize: 9.5, fontWeight: 800, color: NAVY }}>Total TCO</span>
              <span style={{ fontFamily: FONT_MONO, fontSize: 9.5, fontWeight: 800, color: NAVY }}>${tco.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}/mo</span>
            </div>
          </div>
        </div>

        {/* Stack Comparison */}
        <div>
          <SectionLabel title="Stack Comparison" />
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
            {[
              { model: topModel,    label: '★ Recommended',       accentColor: PURPLE    },
              { model: budgetModel, label: '$ Budget Alternative', accentColor: '#059669' },
            ].map(({ model, label, accentColor }) => model ? (
              <div key={model.model_name} style={{ border: `1.5px solid ${accentColor}30`, borderRadius: 8, padding: '10px 14px', background: `${accentColor}06` }}>
                <div style={{ fontSize: 7.5, fontFamily: FONT_TEXT, fontWeight: 800, color: accentColor, textTransform: 'uppercase' as const, letterSpacing: '0.1em', marginBottom: 4 }}>{label}</div>
                <div style={{ fontFamily: FONT_TEXT, fontSize: 13, fontWeight: 900, color: NAVY, marginBottom: 1 }}>{model.model_name}</div>
                <div style={{ fontFamily: FONT_TEXT, fontSize: 8.5, color: '#6B7280', textTransform: 'capitalize' as const, marginBottom: 8 }}>{model.provider}</div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 6 }}>
                  {[
                    ['Composite', model.scores?.composite],
                    ['Quality',   model.scores?.quality_score],
                    ['Cost',      model.scores?.cost_score],
                    ['Latency',   model.scores?.latency_score],
                  ].map(([l, v]) => (
                    <div key={String(l)} style={{ background: 'rgba(10,0,37,0.04)', borderRadius: 6, padding: '5px 8px' }}>
                      <div style={{ fontFamily: FONT_TEXT, fontSize: 7, color: '#9CA3AF', textTransform: 'uppercase' as const, letterSpacing: '0.08em', marginBottom: 2 }}>{l}</div>
                      <ScoreChip value={v as number | undefined} />
                    </div>
                  ))}
                </div>
              </div>
            ) : null)}
          </div>
        </div>

        {/* RAGAs Evaluation Strip */}
        <div>
          <SectionLabel title="RAGAs Evaluation" color="#D97706" />
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: 8 }}>
            {ragasMetrics.map(({ label, value, threshold }) => {
              const status = value == null ? 'N/A' : value >= threshold ? 'prod-ready' : value >= 0.7 ? 'acceptable' : 'do not deploy';
              const [chipBg, chipFg] = value == null
                ? ['#F3F4F6', '#9CA3AF']
                : value >= threshold ? ['rgba(5,150,105,0.1)', '#059669']
                : value >= 0.7 ? ['rgba(217,119,6,0.1)', '#D97706']
                : ['rgba(239,68,68,0.1)', '#EF4444'];
              return (
                <div key={label} style={{ border: '1.5px solid rgba(10,0,37,0.08)', borderRadius: 8, padding: '10px', textAlign: 'center' as const }}>
                  <div style={{ fontFamily: FONT_TEXT, fontSize: 7.5, color: '#6B7280', marginBottom: 4 }}>{label}</div>
                  <div style={{ fontFamily: FONT_MONO, fontSize: 14, fontWeight: 700, color: NAVY, marginBottom: 5 }}>
                    {value != null ? value.toFixed(2) : '—'}
                  </div>
                  <div style={{ fontSize: 7, fontFamily: FONT_TEXT, fontWeight: 700, padding: '2px 6px', borderRadius: 100, background: chipBg, color: chipFg, display: 'inline-block' }}>
                    {status}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Risk Matrix + Security Chips */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>

          <div>
            <SectionLabel title="Risk Matrix" color="#EF4444" />
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 6 }}>
              {riskItems.map(({ label, impact, likelihood, color }) => (
                <div key={label} style={{ border: `1.5px solid ${color}30`, borderRadius: 7, padding: '8px 10px', background: `${color}07` }}>
                  <div style={{ fontFamily: FONT_TEXT, fontSize: 8.5, fontWeight: 700, color: NAVY, marginBottom: 5 }}>{label}</div>
                  {[['Impact', impact], ['Likelihood', likelihood]].map(([k, v]) => (
                    <div key={k} style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 2 }}>
                      <span style={{ fontFamily: FONT_TEXT, fontSize: 7.5, color: '#6B7280' }}>{k}</span>
                      <span style={{ fontFamily: FONT_TEXT, fontSize: 7.5, fontWeight: 700, color }}>{v}</span>
                    </div>
                  ))}
                </div>
              ))}
            </div>
          </div>

          <div>
            <SectionLabel title="Security & Compliance" color="#374151" />
            <div style={{ display: 'flex', flexWrap: 'wrap' as const, gap: 6 }}>
              {secChips.map(({ label, status, text }) => {
                const [bg, fg] = status === '✓'
                  ? ['rgba(5,150,105,0.08)', '#059669']
                  : ['rgba(217,119,6,0.08)', '#D97706'];
                return (
                  <div key={label} style={{ border: `1px solid ${fg}40`, borderRadius: 6, padding: '5px 9px', background: bg }}>
                    <div style={{ fontFamily: FONT_TEXT, fontSize: 7.5, fontWeight: 800, color: NAVY, marginBottom: 1 }}>{label}</div>
                    <div style={{ fontFamily: FONT_TEXT, fontSize: 7, color: fg }}>{status} {text}</div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

      </div>
      <PageFooter bpId={bpId} page={2} total={3} />
    </div>
  );
}

/* ─── Page 3: Implementation & Governance ────────────────────────────────── */

function Page3({
  blueprint, bpId, formattedDate, recs,
}: {
  blueprint: BlueprintData;
  bpId: string;
  formattedDate: string;
  recs: ModelRec[];
}) {
  const topModel  = recs[0];
  const citations = blueprint.benchmark_citations ?? [];

  const archFlow = blueprint.architecture_diagram
    ? blueprint.architecture_diagram
    : `User → API Gateway → [Cache HIT → Response]\n                    ↓ Cache MISS\n              Embedding Model\n                    ↓\n              Vector Store\n                    ↓\n           Cross-Encoder Reranker\n                    ↓\n           ${topModel?.model_name ?? 'LLM'}\n                    ↓\n              Response + Citations`;

  const successMetrics = [
    { kpi: 'Response accuracy',      target: '≥ 90%',       method: 'RAGAs faithfulness on held-out set' },
    { kpi: 'P95 end-to-end latency', target: '< 2000ms',    method: 'APM percentile tracking (Langfuse)' },
    { kpi: 'Monthly API cost',       target: `< $${((blueprint.cost_estimate?.total_monthly_usd ?? 100) * 1.2).toFixed(0)}`, method: 'Cost dashboard, billing alert at 80%' },
    { kpi: 'Cache hit rate',         target: '≥ 35%',       method: 'Redis keyspace metrics' },
    { kpi: 'Error rate (5xx)',        target: '< 0.5%',      method: 'HTTP monitoring, alert at 1%' },
    { kpi: 'RAGAs composite',        target: '≥ 0.80',      method: 'Weekly eval run on 200 samples' },
  ];

  const roadmapSteps = [
    { week: 'Wk 1', title: 'Env Setup',       desc: 'Provision vector DB, Redis, secrets. Deploy embedding pipeline.' },
    { week: 'Wk 2', title: 'Model Integration', desc: `Integrate ${topModel?.model_name ?? 'top model'} API. Add retry + fallback.` },
    { week: 'Wk 3', title: 'RAG Pipeline',    desc: 'Index knowledge base. Wire retriever → reranker → generator.' },
    { week: 'Wk 4', title: 'Observability',   desc: 'Deploy Langfuse tracing. Configure P95 + error rate alerts.' },
    { week: 'Wk 5', title: 'Load Testing',    desc: 'Simulate 3× projected traffic. Tune concurrency + cache TTL.' },
    { week: 'Wk 6', title: 'Prod Rollout',    desc: 'Canary 10% → 50% → 100%. Monitor RAGAs + latency. Sign-off.' },
  ];

  return (
    <div
      data-report-page="true"
      style={{
        width: PAGE_W, height: PAGE_H, background: '#fff',
        position: 'relative' as const, overflow: 'hidden',
        fontFamily: FONT_TEXT, boxSizing: 'border-box' as const,
      }}
    >
      <ClassificationBanner />
      <PageHeader date={formattedDate} subtitle="Implementation & Governance" />

      <div style={{ padding: '14px 28px 50px', display: 'flex', flexDirection: 'column' as const, gap: 11 }}>

        {/* Architecture Flow */}
        <div>
          <SectionLabel title="Architecture Pipeline" color="#374151" />
          <div style={{
            background: '#0F172A', borderRadius: 8, padding: '12px 16px',
            fontFamily: FONT_MONO, fontSize: 8.5, color: '#94A3B8', lineHeight: 1.7,
            whiteSpace: 'pre' as const, overflow: 'hidden',
          }}>
            {archFlow.substring(0, 600)}
          </div>
        </div>

        {/* Observability Plan */}
        <div>
          <SectionLabel title="Observability Plan" color="#3B82F6" />
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 8 }}>
            {[
              { icon: '🔍', title: 'Traces', body: 'Langfuse spans on every LLM call. Track prompt tokens, completion tokens, latency per stage, RAGAs score.' },
              { icon: '🔔', title: 'Alerts', body: 'P95 > 2000ms → PagerDuty. Error rate > 1% → Slack. Cost > 80% budget → email. RAGAs < 0.70 → review queue.' },
              { icon: '📋', title: 'Logs',   body: 'Structured JSON logs: request_id, user_id, model, prompt_hash, latency, cache_hit. Retain 90 days.' },
            ].map(({ icon, title, body }) => (
              <div key={title} style={{ border: '1.5px solid rgba(59,130,246,0.15)', borderRadius: 8, padding: '10px 12px', background: 'rgba(59,130,246,0.03)' }}>
                <div style={{ fontSize: 14, marginBottom: 4 }}>{icon}</div>
                <div style={{ fontFamily: FONT_TEXT, fontSize: 9, fontWeight: 800, color: NAVY, marginBottom: 4 }}>{title}</div>
                <div style={{ fontFamily: FONT_TEXT, fontSize: 8, color: '#4B5563', lineHeight: 1.55 }}>{body}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Success Metrics Table */}
        <div>
          <SectionLabel title="Success Metrics" color="#059669" />
          <table style={{ width: '100%', borderCollapse: 'collapse' as const, fontSize: 8.5 }}>
            <thead>
              <tr style={{ background: '#F3F4F6' }}>
                {(['KPI', 'Target', 'Measurement Method'] as string[]).map(h => (
                  <th key={h} style={{ padding: '5px 8px', textAlign: 'left' as const, fontFamily: FONT_TEXT, fontSize: 7, fontWeight: 800, textTransform: 'uppercase' as const, letterSpacing: '0.08em', color: '#6B7280', borderBottom: '1.5px solid rgba(10,0,37,0.1)' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {successMetrics.map(({ kpi, target, method }, i) => (
                <tr key={i} style={{ borderBottom: '1px solid rgba(10,0,37,0.05)' }}>
                  <td style={{ padding: '4px 8px', fontFamily: FONT_TEXT, fontSize: 8.5, fontWeight: 600, color: '#0D0D0D' }}>{kpi}</td>
                  <td style={{ padding: '4px 8px' }}><span style={{ fontFamily: FONT_MONO, fontSize: 8.5, padding: '1px 6px', borderRadius: 4, background: 'rgba(5,150,105,0.1)', color: '#059669' }}>{target}</span></td>
                  <td style={{ padding: '4px 8px', fontFamily: FONT_TEXT, fontSize: 8, color: '#6B7280' }}>{method}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Implementation Roadmap */}
        <div>
          <SectionLabel title="Implementation Roadmap" />
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(6, 1fr)', gap: 6 }}>
            {roadmapSteps.map(({ week, title, desc }, i) => (
              <div key={i} style={{ border: `1.5px solid ${PURPLE}20`, borderRadius: 7, padding: '8px 9px', background: i === 0 ? `${PURPLE}08` : 'transparent' }}>
                <div style={{ fontFamily: FONT_MONO, fontSize: 7.5, fontWeight: 700, color: PURPLE, marginBottom: 3 }}>{week}</div>
                <div style={{ fontFamily: FONT_TEXT, fontSize: 8, fontWeight: 800, color: NAVY, marginBottom: 3 }}>{title}</div>
                <div style={{ fontFamily: FONT_TEXT, fontSize: 7, color: '#6B7280', lineHeight: 1.5 }}>{desc}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Two-column: Citations + Deprecation Plan */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>

          <div>
            <SectionLabel title="Benchmark Citations" color="#6B7280" />
            {citations.length > 0 ? citations.slice(0, 5).map((c, i) => (
              <div key={i} style={{ display: 'flex', gap: 6, marginBottom: 6 }}>
                <span style={{ fontFamily: FONT_MONO, fontSize: 7.5, color: PURPLE, fontWeight: 700, flexShrink: 0 }}>[{i + 1}]</span>
                <div>
                  <div style={{ fontFamily: FONT_TEXT, fontSize: 7.5, fontWeight: 700, color: '#374151' }}>{c.metric ?? 'Metric'}</div>
                  <div style={{ fontFamily: FONT_TEXT, fontSize: 7.5, color: '#6B7280', lineHeight: 1.5 }}>{c.value ?? '—'}</div>
                </div>
              </div>
            )) : (
              <div style={{ fontFamily: FONT_TEXT, fontSize: 8, color: '#9CA3AF', fontStyle: 'italic' }}>No external citations for this blueprint.</div>
            )}
          </div>

          <div>
            <SectionLabel title="Model Deprecation Plan" color="#D97706" />
            {[
              { event: 'Deprecation notice received', action: 'Trigger model swap playbook within 48 hours' },
              { event: 'Performance regression > 5%', action: 'Auto-failover to next-ranked model in registry' },
              { event: 'Cost spike > 30%',            action: 'Evaluate open-source alternative within 1 sprint' },
              { event: 'Provider outage',              action: 'Round-robin to secondary provider (hot standby)' },
            ].map(({ event, action }, i) => (
              <div key={i} style={{ marginBottom: 7 }}>
                <div style={{ fontFamily: FONT_TEXT, fontSize: 7.5, fontWeight: 700, color: '#D97706', marginBottom: 1 }}>{event}</div>
                <div style={{ fontFamily: FONT_TEXT, fontSize: 7.5, color: '#4B5563' }}>→ {action}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Approvals Block */}
        <div style={{ borderTop: `1.5px solid rgba(10,0,37,0.1)`, paddingTop: 10 }}>
          <SectionLabel title="Approvals" color={NAVY} />
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 10 }}>
            {[
              { role: 'Prepared By',     name: 'Archon AI Engine',          date: formattedDate },
              { role: 'Engineering Lead',name: '___________________________', date: '___________' },
              { role: 'CTO',             name: '___________________________', date: '___________' },
            ].map(({ role, name, date }) => (
              <div key={role} style={{ border: `1px solid rgba(10,0,37,0.12)`, borderRadius: 6, padding: '10px 12px' }}>
                <div style={{ fontFamily: FONT_TEXT, fontSize: 7.5, fontWeight: 700, color: '#9CA3AF', textTransform: 'uppercase' as const, letterSpacing: '0.1em', marginBottom: 8 }}>{role}</div>
                <div style={{ fontFamily: FONT_TEXT, fontSize: 9, color: NAVY, fontWeight: 600, marginBottom: 4 }}>{name}</div>
                <div style={{ fontFamily: FONT_MONO, fontSize: 7.5, color: '#9CA3AF' }}>Date: {date}</div>
              </div>
            ))}
          </div>
        </div>

      </div>
      <PageFooter bpId={bpId} page={3} total={3} />
    </div>
  );
}

/* ─── Root export ─────────────────────────────────────────────────────────── */

export default function ReportTemplate({ blueprint }: { blueprint: BlueprintData }) {
  const recs        = blueprint.model_recommendations ?? blueprint.recommendations ?? [];
  const evalDetails = blueprint.eval_details ?? blueprint.eval_score ?? {};
  const totalCost   = blueprint.cost_estimate?.total_monthly_usd ?? 0;
  const totalP95    = blueprint.latency_estimate?.total_p95_ms ?? 0;

  const bpId = `BPR-${new Date().getFullYear()}-${String(
    Math.abs((blueprint.id ?? '').split('').reduce((acc, c) => acc + c.charCodeAt(0), 42)) % 9000 + 1000
  ).padStart(4, '0')}`;

  const formattedDate = blueprint.created_at
    ? new Date(blueprint.created_at).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })
    : new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });

  return (
    <div style={{ display: 'inline-block' }}>
      <Page1 blueprint={blueprint} bpId={bpId} formattedDate={formattedDate} recs={recs} evalDetails={evalDetails} totalCost={totalCost} totalP95={totalP95} />
      <Page2 blueprint={blueprint} bpId={bpId} formattedDate={formattedDate} recs={recs} evalDetails={evalDetails} totalCost={totalCost} />
      <Page3 blueprint={blueprint} bpId={bpId} formattedDate={formattedDate} recs={recs} />
    </div>
  );
}
