/**
 * Generates a realistic-looking demo blueprint when the backend is offline.
 * Keyword-analyses the prompt to pick tasks and models from a 30+ model catalog.
 */

/* ─── Full model catalog ─────────────────────────────────────────────────── */
type ModelEntry = {
  model_name: string;
  provider: string;
  scores: { composite: number; quality_score: number; cost_score: number; latency_score: number };
};

/** Every model we know about, scored across quality / cost / latency (0–1 each).
 *  cost_score:    1.0 = essentially free,  0.0 = very expensive
 *  latency_score: 1.0 = sub-100ms typical, 0.0 = very slow
 */
const ALL_MODELS: ModelEntry[] = [
  /* ── Anthropic ── */
  { model_name: 'claude-opus-4',      provider: 'anthropic', scores: { composite: 0.91, quality_score: 0.99, cost_score: 0.38, latency_score: 0.65 } },
  { model_name: 'claude-sonnet-4',    provider: 'anthropic', scores: { composite: 0.95, quality_score: 0.97, cost_score: 0.73, latency_score: 0.87 } },
  { model_name: 'claude-haiku-4',     provider: 'anthropic', scores: { composite: 0.92, quality_score: 0.84, cost_score: 0.97, latency_score: 0.99 } },

  /* ── OpenAI ── */
  { model_name: 'o3',                 provider: 'openai',    scores: { composite: 0.89, quality_score: 0.98, cost_score: 0.42, latency_score: 0.58 } },
  { model_name: 'o4-mini',            provider: 'openai',    scores: { composite: 0.90, quality_score: 0.91, cost_score: 0.82, latency_score: 0.88 } },
  { model_name: 'gpt-4o',             provider: 'openai',    scores: { composite: 0.92, quality_score: 0.93, cost_score: 0.70, latency_score: 0.86 } },
  { model_name: 'gpt-4o-mini',        provider: 'openai',    scores: { composite: 0.87, quality_score: 0.84, cost_score: 0.95, latency_score: 0.95 } },

  /* ── Google ── */
  { model_name: 'gemini-2.5-pro',     provider: 'google',    scores: { composite: 0.92, quality_score: 0.94, cost_score: 0.72, latency_score: 0.83 } },
  { model_name: 'gemini-2.5-flash',   provider: 'google',    scores: { composite: 0.89, quality_score: 0.86, cost_score: 0.93, latency_score: 0.96 } },
  { model_name: 'gemini-2.0-flash',   provider: 'google',    scores: { composite: 0.87, quality_score: 0.82, cost_score: 0.94, latency_score: 0.97 } },
  { model_name: 'gemini-1.5-pro',     provider: 'google',    scores: { composite: 0.85, quality_score: 0.87, cost_score: 0.76, latency_score: 0.80 } },

  /* ── xAI ── */
  { model_name: 'grok-3',             provider: 'xai',       scores: { composite: 0.90, quality_score: 0.91, cost_score: 0.67, latency_score: 0.82 } },
  { model_name: 'grok-3-mini',        provider: 'xai',       scores: { composite: 0.85, quality_score: 0.83, cost_score: 0.90, latency_score: 0.88 } },

  /* ── DeepSeek ── */
  { model_name: 'deepseek-r1',        provider: 'deepseek',  scores: { composite: 0.88, quality_score: 0.91, cost_score: 0.93, latency_score: 0.68 } },
  { model_name: 'deepseek-v3',        provider: 'deepseek',  scores: { composite: 0.83, quality_score: 0.83, cost_score: 0.97, latency_score: 0.72 } },
  { model_name: 'deepseek-coder-v2',  provider: 'deepseek',  scores: { composite: 0.93, quality_score: 0.95, cost_score: 0.97, latency_score: 0.82 } },

  /* ── Meta ── */
  { model_name: 'llama-3.1-405b',     provider: 'meta',      scores: { composite: 0.82, quality_score: 0.84, cost_score: 0.88, latency_score: 0.66 } },
  { model_name: 'llama-3.3-70b',      provider: 'meta',      scores: { composite: 0.80, quality_score: 0.79, cost_score: 0.99, latency_score: 0.73 } },
  { model_name: 'llama-3.2-3b',       provider: 'meta',      scores: { composite: 0.72, quality_score: 0.66, cost_score: 1.00, latency_score: 0.98 } },

  /* ── Mistral ── */
  { model_name: 'mistral-large-2',    provider: 'mistral',   scores: { composite: 0.83, quality_score: 0.82, cost_score: 0.85, latency_score: 0.82 } },
  { model_name: 'mistral-medium-3',   provider: 'mistral',   scores: { composite: 0.81, quality_score: 0.79, cost_score: 0.92, latency_score: 0.84 } },
  { model_name: 'mistral-nemo',       provider: 'mistral',   scores: { composite: 0.78, quality_score: 0.74, cost_score: 0.97, latency_score: 0.91 } },
  { model_name: 'codestral-2501',     provider: 'mistral',   scores: { composite: 0.87, quality_score: 0.88, cost_score: 0.93, latency_score: 0.84 } },

  /* ── Cohere ── */
  { model_name: 'command-r-plus',     provider: 'cohere',    scores: { composite: 0.84, quality_score: 0.83, cost_score: 0.86, latency_score: 0.82 } },
  { model_name: 'command-r',          provider: 'cohere',    scores: { composite: 0.79, quality_score: 0.76, cost_score: 0.96, latency_score: 0.87 } },

  /* ── Amazon ── */
  { model_name: 'nova-pro',           provider: 'amazon',    scores: { composite: 0.84, quality_score: 0.83, cost_score: 0.81, latency_score: 0.85 } },
  { model_name: 'nova-lite',          provider: 'amazon',    scores: { composite: 0.79, quality_score: 0.75, cost_score: 0.98, latency_score: 0.93 } },
  { model_name: 'nova-micro',         provider: 'amazon',    scores: { composite: 0.74, quality_score: 0.68, cost_score: 0.99, latency_score: 0.96 } },

  /* ── Microsoft ── */
  { model_name: 'phi-4',              provider: 'microsoft', scores: { composite: 0.80, quality_score: 0.78, cost_score: 0.97, latency_score: 0.87 } },
  { model_name: 'phi-4-mini',         provider: 'microsoft', scores: { composite: 0.76, quality_score: 0.72, cost_score: 0.99, latency_score: 0.93 } },

  /* ── Alibaba ── */
  { model_name: 'qwen-2.5-72b',       provider: 'alibaba',   scores: { composite: 0.83, quality_score: 0.83, cost_score: 0.91, latency_score: 0.76 } },
  { model_name: 'qwen-2.5-coder-32b', provider: 'alibaba',   scores: { composite: 0.87, quality_score: 0.88, cost_score: 0.94, latency_score: 0.78 } },
  { model_name: 'qwen-2.5-7b',        provider: 'alibaba',   scores: { composite: 0.74, quality_score: 0.70, cost_score: 0.99, latency_score: 0.93 } },

  /* ── Perplexity ── */
  { model_name: 'sonar-large',        provider: 'perplexity',scores: { composite: 0.80, quality_score: 0.80, cost_score: 0.84, latency_score: 0.86 } },
  { model_name: 'sonar-small',        provider: 'perplexity',scores: { composite: 0.74, quality_score: 0.72, cost_score: 0.95, latency_score: 0.93 } },
];

/* ─── Helpers ────────────────────────────────────────────────────────────── */

/** Pick models that best fit a profile, sorted by composite score. */
function selectModels(
  prioritise: ('quality' | 'cost' | 'latency')[],
  preferred: string[],   // model_names to rank first
  exclude:   string[],   // model_names to skip
  count = 18,
): ModelEntry[] {
  // Build a weighted composite for ranking
  const weightMap: Record<string, number> = { quality: 0.4, cost: 0.35, latency: 0.25 };
  const reweighted = (m: ModelEntry) =>
    prioritise.reduce((sum, k) => sum + weightMap[k] * m.scores[`${k}_score` as keyof typeof m.scores], 0);

  const pool = ALL_MODELS
    .filter(m => !exclude.includes(m.model_name))
    .map(m => ({ ...m, _rank: reweighted(m) }))
    .sort((a, b) => {
      // Preferred models float to the top
      const pa = preferred.includes(a.model_name) ? 1 : 0;
      const pb = preferred.includes(b.model_name) ? 1 : 0;
      if (pb !== pa) return pb - pa;
      return b._rank - a._rank;
    });

  return pool.slice(0, count).map(({ _rank: _r, ...m }) => m);
}

/* ─── Main export ────────────────────────────────────────────────────────── */
export function generateMockBlueprint(promptText: string, requestVolume = 10000) {
  const lc = promptText.toLowerCase();

  /* ── Detect use-case flags ── */
  const isCode      = ['code', 'coding', 'programming', 'review', 'github', 'debug', 'sql', 'refactor', 'typescript', 'python', 'rust'].some(k => lc.includes(k));
  const isRealtime  = ['real-time', 'realtime', '100ms', '200ms', '500ms', 'stream', 'latency', 'fast response'].some(k => lc.includes(k));
  const isCheap     = ['cheap', 'cost', 'budget', 'open source', 'open-source', 'free', 'affordable'].some(k => lc.includes(k));
  const isReasoning = ['reason', 'logic', 'math', 'complex', 'multi-step', 'chain of thought', 'cot', 'analysis', 'research'].some(k => lc.includes(k));
  const isRag       = ['rag', 'retrieval', 'document', 'pdf', 'knowledge', 'vector', 'search', 'embedding', 'citation'].some(k => lc.includes(k));

  /* ── Detect tasks ── */
  const allTasks = [
    { kw: ['rag', 'retrieval', 'document', 'pdf', 'knowledge', 'vector', 'search'],              task: 'retrieval_augmented_generation', conf: 0.96 },
    { kw: ['chat', 'support', 'customer', 'helpdesk', 'faq', 'conversation', 'bot', 'assistant'],task: 'conversational_ai',               conf: 0.93 },
    { kw: ['code', 'coding', 'programming', 'review', 'github', 'debug', 'sql'],                 task: 'code_generation_review',          conf: 0.91 },
    { kw: ['image', 'vision', 'photo', 'visual', 'picture', 'screenshot', 'multimodal'],         task: 'multimodal_vision',               conf: 0.88 },
    { kw: ['fraud', 'classify', 'classification', 'detect', 'risk', 'score', 'anomaly'],         task: 'classification_detection',        conf: 0.90 },
    { kw: ['summar', 'digest', 'extract', 'report', 'brief', 'tldr'],                            task: 'summarisation',                   conf: 0.89 },
    { kw: ['translat', 'multilingua', 'language', 'localiz'],                                    task: 'translation',                     conf: 0.87 },
    { kw: ['embed', 'semantic', 'similar', 'cluster', 'recommend'],                              task: 'embedding_similarity',            conf: 0.85 },
    { kw: ['audio', 'speech', 'transcri', 'whisper', 'voice', 'stt'],                            task: 'speech_to_text',                  conf: 0.82 },
    { kw: ['reason', 'logic', 'math', 'complex', 'multi-step', 'research'],                      task: 'complex_reasoning',               conf: 0.88 },
  ];

  const detected = allTasks
    .filter(t => t.kw.some(k => lc.includes(k)))
    .slice(0, 3)
    .map(t => ({ task: t.task, confidence: t.conf }));

  if (detected.length === 0) {
    detected.push({ task: 'conversational_ai', confidence: 0.82 });
  }

  const primaryTask = detected[0].task;

  /* ── Select models based on profile ── */
  let recommendations: (ModelEntry & { task: string })[];

  if (isReasoning) {
    // Reasoning workloads: quality first, o3/deepseek-r1/claude-opus boost
    const base = selectModels(
      ['quality', 'latency', 'cost'],
      ['o3', 'deepseek-r1', 'claude-opus-4', 'claude-sonnet-4', 'o4-mini', 'gpt-4o', 'gemini-2.5-pro', 'grok-3'],
      [],
    );
    recommendations = base.map(m => ({ ...m, task: primaryTask }));
  } else if (isCode) {
    // Code workloads: quality + cost sweet spot, specialist code models first
    const base = selectModels(
      ['quality', 'cost', 'latency'],
      ['deepseek-coder-v2', 'claude-sonnet-4', 'o4-mini', 'codestral-2501', 'qwen-2.5-coder-32b', 'gpt-4o', 'deepseek-r1', 'gemini-2.5-pro', 'grok-3', 'phi-4'],
      [],
    );
    recommendations = base.map(m => ({ ...m, task: primaryTask }));
  } else if (isRealtime || isCheap) {
    // Low-latency / budget: cost + latency first
    const base = selectModels(
      ['cost', 'latency', 'quality'],
      ['claude-haiku-4', 'gpt-4o-mini', 'gemini-2.0-flash', 'gemini-2.5-flash', 'mistral-nemo', 'phi-4-mini', 'nova-micro', 'llama-3.2-3b', 'qwen-2.5-7b', 'o4-mini', 'grok-3-mini', 'nova-lite', 'command-r'],
      [],
    );
    recommendations = base.map(m => ({ ...m, task: primaryTask }));
  } else {
    // General / balanced
    const base = selectModels(
      ['quality', 'cost', 'latency'],
      ['claude-sonnet-4', 'gpt-4o', 'gemini-2.5-pro', 'grok-3', 'o4-mini', 'deepseek-r1', 'claude-haiku-4', 'command-r-plus', 'nova-pro', 'mistral-large-2', 'llama-3.1-405b', 'gemini-2.5-flash'],
      [],
    );
    recommendations = base.map(m => ({ ...m, task: primaryTask }));
  }

  /* ── Cost estimate ── */
  const topModel = recommendations[0];
  const perReq   = topModel.scores.cost_score > 0.9 ? 0.00002
                 : topModel.scores.cost_score > 0.7 ? 0.0008
                 : 0.002;
  const monthlyTop = perReq * requestVolume;

  const cost_estimate = {
    total_monthly_usd: parseFloat((monthlyTop * 1.25).toFixed(2)),
    breakdown: [
      {
        model_name: topModel.model_name,
        provider:   topModel.provider,
        role: 'primary',
        monthly_cost_usd:     parseFloat(monthlyTop.toFixed(2)),
        cost_per_request_usd: parseFloat(perReq.toFixed(6)),
        pricing_source: '',
      },
      {
        model_name: 'text-embedding-3-small',
        provider:   'openai',
        role: 'embedding',
        monthly_cost_usd:     parseFloat((monthlyTop * 0.18).toFixed(2)),
        cost_per_request_usd: 0.000020,
        pricing_source: 'https://openai.com/pricing',
      },
      {
        model_name: 'rerank-english-v3.0',
        provider:   'cohere',
        role: 'reranker',
        monthly_cost_usd:     parseFloat((monthlyTop * 0.07).toFixed(2)),
        cost_per_request_usd: 0.000002,
        pricing_source: 'https://cohere.com/pricing',
      },
    ],
  };

  /* ── Latency estimate ── */
  const baseGen = isRealtime ? 420 : 1200;
  const latency_estimate = {
    total_p95_ms: isRealtime ? 680 : 2800,
    breakdown: [
      { step: 'Query embedding',        p50_ms: 45,                          p95_ms: 90,      source: '' },
      { step: 'Vector retrieval',       p50_ms: 80,                          p95_ms: 180,     source: '' },
      { step: 'Cross-encoder rerank',   p50_ms: 95,                          p95_ms: 210,     source: '' },
      { step: `${topModel.model_name} generation`, p50_ms: Math.round(baseGen * 0.6), p95_ms: baseGen, source: '' },
      { step: 'Post-processing',        p50_ms: 12,                          p95_ms: 30,      source: '' },
    ],
  };

  /* ── Architecture diagram ── */
  const modelLabel = topModel.model_name.replace(/-/g, '‑');
  const architecture_diagram = isRag
    ? `flowchart TD
    U([User Query]) --> API[API Gateway]
    API --> CACHE[(Semantic Cache)]
    API --> EMB[Embedding Model]
    EMB --> VS[(Vector Store)]
    VS --> RR[Cross-Encoder Reranker]
    RR --> LLM[${modelLabel}]
    LLM --> OUT([Response + Citations])
    CACHE -.->|cache hit| OUT`
    : `flowchart TD
    U([User]) --> API[API Gateway]
    API --> GUARD[Input Guardrails]
    GUARD --> LLM[${modelLabel}]
    LLM --> PARSE[Output Parser]
    PARSE --> OUT([Response])
    API --> CACHE[(Response Cache)]
    CACHE -.->|cache hit| OUT`;

  /* ── Explanation ── */
  const taskLabel = primaryTask.replace(/_/g, ' ');
  const explanation = `Based on your requirements, we recommend a ${taskLabel} architecture centred on **${topModel.model_name}** from ${topModel.provider}. This model scored ${(topModel.scores.composite * 100).toFixed(0)}/100 on the composite benchmark across quality, cost, and latency dimensions — the highest in its class for this use case.

${isRag ? `The retrieval layer uses a hybrid search strategy (BM25 + dense vector) which outperforms dense-only retrieval by ~18% on recall benchmarks. A cross-encoder reranker then re-scores the top-k candidates before passing context to the generation model — this reduces hallucination rates by ~34% compared to naive RAG.\n\n` : ''}The cost projection of $${cost_estimate.total_monthly_usd.toFixed(2)}/month assumes ${requestVolume.toLocaleString()} requests/month with average context lengths. Enabling semantic caching (Redis) can reduce LLM calls by 30–45% for repetitive query patterns, significantly lowering real-world cost.

${isRealtime ? 'For real-time latency requirements, we recommend streaming token output and deploying the embedding model on a co-located instance to avoid cross-region network hops. Targeting P95 < 700ms is achievable with the recommended stack.' : `For your scale, P95 latency of ${latency_estimate.total_p95_ms}ms is within acceptable bounds. If you need sub-1s responses, consider switching to a smaller model for the generation step at the cost of ~8% quality reduction.`}`;

  /* ── Eval scores ── */
  const eval_score = {
    composite:        0.91,
    faithfulness:     0.93,
    answer_relevancy: 0.90,
    context_precision:0.88,
    context_recall:   0.92,
  };

  /* ── Citations ── */
  const benchmark_citations = [
    { metric: 'Composite benchmark', value: `${topModel.model_name} scored ${topModel.scores.composite.toFixed(2)} on Archon internal eval suite`, source: null },
    { metric: 'RAGAs faithfulness',  value: '0.93 — evaluated on 250 held-out Q&A pairs', source: null },
  ];

  return {
    input_text:            promptText,
    confidence_flag:       'high_confidence',
    detected_tasks:        detected,
    recommendations,
    architecture_diagram,
    cost_estimate,
    latency_estimate,
    explanation,
    eval_score,
    benchmark_citations,
    _offline_demo:         true,
  };
}
