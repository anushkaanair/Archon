/**
 * Generates a realistic-looking demo blueprint when the backend is offline.
 * Analyses the prompt text for keywords to pick relevant tasks and models.
 */
export function generateMockBlueprint(promptText: string, requestVolume = 10000) {
  const lc = promptText.toLowerCase();

  /* ── Detect tasks ── */
  const allTasks = [
    { kw: ['rag', 'retrieval', 'document', 'pdf', 'knowledge', 'vector', 'search'], task: 'retrieval_augmented_generation', conf: 0.96 },
    { kw: ['chat', 'support', 'customer', 'helpdesk', 'faq', 'conversation', 'bot', 'assistant'], task: 'conversational_ai', conf: 0.93 },
    { kw: ['code', 'coding', 'programming', 'review', 'github', 'debug', 'sql'], task: 'code_generation_review', conf: 0.91 },
    { kw: ['image', 'vision', 'photo', 'visual', 'picture', 'screenshot', 'multimodal'], task: 'multimodal_vision', conf: 0.88 },
    { kw: ['fraud', 'classify', 'classification', 'detect', 'risk', 'score', 'anomaly'], task: 'classification_detection', conf: 0.90 },
    { kw: ['summar', 'digest', 'extract', 'report', 'brief', 'tldr'], task: 'summarisation', conf: 0.89 },
    { kw: ['translat', 'multilingua', 'language', 'localiz'], task: 'translation', conf: 0.87 },
    { kw: ['embed', 'semantic', 'similar', 'cluster', 'recommend'], task: 'embedding_similarity', conf: 0.85 },
    { kw: ['audio', 'speech', 'transcri', 'whisper', 'voice', 'stt'], task: 'speech_to_text', conf: 0.82 },
  ];

  const detected = allTasks
    .filter(t => t.kw.some(k => lc.includes(k)))
    .slice(0, 3)
    .map(t => ({ task: t.task, confidence: t.conf }));

  if (detected.length === 0) {
    detected.push({ task: 'conversational_ai', confidence: 0.82 });
  }

  const primaryTask = detected[0].task;

  /* ── Model recommendations ── */
  const isCode     = lc.includes('code') || lc.includes('programming') || lc.includes('sql');
  const isCheap    = lc.includes('cheap') || lc.includes('cost') || lc.includes('budget') || lc.includes('open source') || lc.includes('open-source');
  const isRealtime = lc.includes('real-time') || lc.includes('100ms') || lc.includes('200ms') || lc.includes('stream');

  type ModelRec = {
    model_name: string;
    provider: string;
    task: string;
    scores: { composite: number; quality_score: number; cost_score: number; latency_score: number };
  };

  let recommendations: ModelRec[] = [];

  if (isCode) {
    recommendations = [
      { model_name: 'claude-sonnet-4',   provider: 'anthropic', task: primaryTask, scores: { composite: 0.96, quality_score: 0.97, cost_score: 0.72, latency_score: 0.88 } },
      { model_name: 'deepseek-coder-v2', provider: 'deepseek',  task: primaryTask, scores: { composite: 0.93, quality_score: 0.94, cost_score: 0.97, latency_score: 0.82 } },
      { model_name: 'gpt-4o',            provider: 'openai',    task: primaryTask, scores: { composite: 0.91, quality_score: 0.93, cost_score: 0.68, latency_score: 0.86 } },
      { model_name: 'qwen-2.5-coder-32b',provider: 'alibaba',   task: primaryTask, scores: { composite: 0.88, quality_score: 0.89, cost_score: 0.93, latency_score: 0.79 } },
      { model_name: 'claude-haiku-4',    provider: 'anthropic', task: primaryTask, scores: { composite: 0.83, quality_score: 0.80, cost_score: 0.96, latency_score: 0.97 } },
      { model_name: 'llama-3.3-70b',     provider: 'meta',      task: primaryTask, scores: { composite: 0.79, quality_score: 0.79, cost_score: 0.99, latency_score: 0.75 } },
    ];
  } else if (isRealtime || isCheap) {
    recommendations = [
      { model_name: 'claude-haiku-4',    provider: 'anthropic', task: primaryTask, scores: { composite: 0.94, quality_score: 0.88, cost_score: 0.97, latency_score: 0.99 } },
      { model_name: 'gpt-4o-mini',       provider: 'openai',    task: primaryTask, scores: { composite: 0.91, quality_score: 0.85, cost_score: 0.95, latency_score: 0.96 } },
      { model_name: 'gemini-2.0-flash',  provider: 'google',    task: primaryTask, scores: { composite: 0.89, quality_score: 0.83, cost_score: 0.94, latency_score: 0.97 } },
      { model_name: 'llama-3.3-70b',     provider: 'meta',      task: primaryTask, scores: { composite: 0.85, quality_score: 0.82, cost_score: 0.99, latency_score: 0.80 } },
      { model_name: 'mistral-medium-3',  provider: 'mistral',   task: primaryTask, scores: { composite: 0.82, quality_score: 0.80, cost_score: 0.92, latency_score: 0.85 } },
      { model_name: 'deepseek-v3',       provider: 'deepseek',  task: primaryTask, scores: { composite: 0.80, quality_score: 0.81, cost_score: 0.98, latency_score: 0.77 } },
    ];
  } else {
    recommendations = [
      { model_name: 'claude-sonnet-4',   provider: 'anthropic', task: primaryTask, scores: { composite: 0.96, quality_score: 0.97, cost_score: 0.74, latency_score: 0.88 } },
      { model_name: 'gpt-4o',            provider: 'openai',    task: primaryTask, scores: { composite: 0.93, quality_score: 0.93, cost_score: 0.70, latency_score: 0.87 } },
      { model_name: 'gemini-2.5-pro',    provider: 'google',    task: primaryTask, scores: { composite: 0.91, quality_score: 0.92, cost_score: 0.72, latency_score: 0.84 } },
      { model_name: 'claude-haiku-4',    provider: 'anthropic', task: primaryTask, scores: { composite: 0.87, quality_score: 0.83, cost_score: 0.97, latency_score: 0.97 } },
      { model_name: 'mistral-large-2',   provider: 'mistral',   task: primaryTask, scores: { composite: 0.82, quality_score: 0.81, cost_score: 0.85, latency_score: 0.83 } },
      { model_name: 'llama-3.3-70b',     provider: 'meta',      task: primaryTask, scores: { composite: 0.78, quality_score: 0.77, cost_score: 0.99, latency_score: 0.74 } },
    ];
  }

  /* ── Cost estimate ── */
  const topModel = recommendations[0];
  const perReq = topModel.scores.cost_score > 0.9 ? 0.00002 : topModel.scores.cost_score > 0.7 ? 0.0008 : 0.002;
  const monthlyTop = perReq * requestVolume;

  const cost_estimate = {
    total_monthly_usd: parseFloat((monthlyTop * 1.25).toFixed(2)),
    breakdown: [
      {
        model_name: topModel.model_name,
        provider: topModel.provider,
        role: 'primary',
        monthly_cost_usd: parseFloat(monthlyTop.toFixed(2)),
        cost_per_request_usd: parseFloat(perReq.toFixed(6)),
        pricing_source: '',
      },
      {
        model_name: 'text-embedding-3-small',
        provider: 'openai',
        role: 'embedding',
        monthly_cost_usd: parseFloat((monthlyTop * 0.18).toFixed(2)),
        cost_per_request_usd: 0.000020,
        pricing_source: 'https://openai.com/pricing',
      },
      {
        model_name: 'rerank-english-v3.0',
        provider: 'cohere',
        role: 'reranker',
        monthly_cost_usd: parseFloat((monthlyTop * 0.07).toFixed(2)),
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
      { step: 'Query embedding',   p50_ms: 45,       p95_ms: 90,       source: '' },
      { step: 'Vector retrieval',  p50_ms: 80,       p95_ms: 180,      source: '' },
      { step: 'Cross-encoder rerank', p50_ms: 95,    p95_ms: 210,      source: '' },
      { step: `${topModel.model_name} generation`, p50_ms: Math.round(baseGen * 0.6), p95_ms: baseGen, source: '' },
      { step: 'Post-processing',   p50_ms: 12,       p95_ms: 30,       source: '' },
    ],
  };

  /* ── Mermaid diagram ── */
  const isRag = detected.some(t => t.task === 'retrieval_augmented_generation');
  const architecture_diagram = isRag
    ? `flowchart LR
    U([User]) --> API[API Gateway]
    API --> EMB[Embedding Model\\ntext-embedding-3-small]
    EMB --> VS[(Vector Store\\nPinecone / pgvector)]
    VS --> RR[Cross-Encoder\\nReranker]
    RR --> LLM[${topModel.model_name}\\n${topModel.provider}]
    LLM --> OUT([Response + Citations])
    API --> CACHE[(Semantic Cache\\nRedis)]
    CACHE -.-> LLM`
    : `flowchart LR
    U([User]) --> API[API Gateway]
    API --> GUARD[Guardrails\\nInput validation]
    GUARD --> LLM[${topModel.model_name}\\n${topModel.provider}]
    LLM --> PARSE[Output Parser\\nJSON / Markdown]
    PARSE --> OUT([Structured Response])
    API --> CACHE[(Response Cache\\nRedis)]
    CACHE -.-> OUT`;

  /* ── Explanation ── */
  const taskLabel = primaryTask.replace(/_/g, ' ');
  const explanation = `Based on your requirements, we recommend a ${taskLabel} architecture centred on **${topModel.model_name}** from ${topModel.provider}. This model scored ${(topModel.scores.composite * 100).toFixed(0)}/100 on the composite benchmark across quality, cost, and latency dimensions — the highest in its class for this use case.

${isRag ? `The retrieval layer uses a hybrid search strategy (BM25 + dense vector) which outperforms dense-only retrieval by ~18% on recall benchmarks. A cross-encoder reranker then re-scores the top-k candidates before passing context to the generation model — this reduces hallucination rates by ~34% compared to naive RAG.

` : ''}The cost projection of $${cost_estimate.total_monthly_usd.toFixed(2)}/month assumes ${requestVolume.toLocaleString()} requests/month with average context lengths. Enabling semantic caching (Redis) can reduce LLM calls by 30–45% for repetitive query patterns, significantly lowering real-world cost.

${isRealtime ? 'For real-time latency requirements, we recommend streaming token output and deploying the embedding model on a co-located instance to avoid cross-region network hops. Targeting P95 < 700ms is achievable with the recommended stack.' : `For your scale, P95 latency of ${latency_estimate.total_p95_ms}ms is within acceptable bounds. If you need sub-1s responses, consider switching to ${recommendations[isCode ? 4 : 3]?.model_name ?? 'claude-haiku-4'} for the generation step at the cost of ~8% quality reduction.`}`;

  /* ── Eval scores ── */
  const eval_score = {
    composite: 0.91,
    faithfulness: 0.93,
    answer_relevancy: 0.90,
    context_precision: 0.88,
    context_recall: 0.92,
  };

  /* ── Citations ── */
  const benchmark_citations = [
    { metric: 'Composite benchmark', value: `${topModel.model_name} scored ${topModel.scores.composite.toFixed(2)} on Archon internal eval suite`, source: null },
    { metric: 'RAGAs faithfulness', value: '0.93 — evaluated on 250 held-out Q&A pairs', source: null },
  ];

  return {
    input_text: promptText,
    confidence_flag: 'high_confidence',
    detected_tasks: detected,
    recommendations,
    architecture_diagram,
    cost_estimate,
    latency_estimate,
    explanation,
    eval_score,
    benchmark_citations,
    _offline_demo: true,
  };
}
