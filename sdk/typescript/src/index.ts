/**
 * Archon TypeScript SDK
 *
 * Provides `ArchonClient` for interacting with the Archon API.
 * Supports both Node.js and browser environments.
 *
 * @example
 * ```typescript
 * import { ArchonClient } from '@archon/sdk';
 *
 * const client = new ArchonClient({ apiKey: 'arch_xxx' });
 * const result = await client.architect('A legal Q&A bot');
 * console.log(result.architectureDiagram);
 * ```
 */

// ── Types ─────────────────────────────────────────────────────

export interface ArchonConfig {
  apiKey: string;
  baseUrl?: string;
  timeout?: number;
}

export interface DetectedTask {
  task: string;
  confidence: number;
  description: string;
}

export interface ModelScore {
  costScore: number;
  latencyScore: number;
  qualityScore: number;
  taskFitScore: number;
  composite: number;
}

export interface ModelRecommendation {
  provider: string;
  modelName: string;
  task: string;
  scores: ModelScore;
  pricing: Record<string, number>;
  pricingSource: string;
  rationale: string;
}

export interface BenchmarkCitation {
  metric: string;
  value: string;
  source: string;
  retrievedAt?: string;
}

export interface EvalScore {
  faithfulness?: number;
  answerRelevancy?: number;
  contextPrecision?: number;
  contextRecall?: number;
  composite?: number;
  isLowConfidence: boolean;
}

export interface AnalyzeResult {
  inputText: string;
  detectedTasks: DetectedTask[];
  queryId: string;
  requestId?: string;
}

export interface RecommendResult {
  queryId: string;
  recommendations: ModelRecommendation[];
  totalEstimatedMonthlyCost?: number;
  requestId?: string;
}

export interface CostBreakdown {
  modelName: string;
  provider: string;
  role: string;
  monthlyCostUsd: number;
  costPerRequestUsd: number;
  pricingSource: string;
}

export interface LatencyBreakdown {
  step: string;
  p50Ms: number;
  p95Ms: number;
  source: string;
}

export interface ArchitectResult {
  status: string;
  blueprintId?: string;
  jobId?: string;
  inputText?: string;
  detectedTasks?: DetectedTask[];
  recommendations?: ModelRecommendation[];
  architectureJson?: Record<string, any>;
  architectureDiagram?: string;
  costEstimate?: Record<string, any>;
  latencyEstimate?: Record<string, any>;
  explanation?: string;
  benchmarkCitations?: BenchmarkCitation[];
  evalScore?: EvalScore;
  confidenceFlag?: string;
  requestId?: string;
}

export interface EstimateResult {
  totalMonthlyCostUsd: number;
  totalP95LatencyMs: number;
  costBreakdown: CostBreakdown[];
  latencyBreakdown: LatencyBreakdown[];
  benchmarkCitations: BenchmarkCitation[];
  monthlyRequestVolume: number;
  requestId?: string;
}

export interface ExplainResult {
  blueprintId: string;
  explanation: string;
  tradeoffs: Record<string, any>[];
  alternativesConsidered: Record<string, any>[];
  requestId?: string;
}

export interface ModelEntry {
  id: string;
  provider: string;
  modelName: string;
  capabilities: string[];
  pricing: Record<string, number>;
  pricingSource: string;
  isActive: boolean;
  modelVersion?: string;
  latencyP50Ms?: number;
  latencyP95Ms?: number;
  qualityScores?: Record<string, number>;
  pricingFetchedAt?: string;
}

export interface ModelsResult {
  models: ModelEntry[];
  total: number;
  cacheTtlSeconds: number;
  requestId?: string;
}

// ── Errors ────────────────────────────────────────────────────

export class ArchonError extends Error {
  statusCode?: number;
  requestId?: string;

  constructor(message: string, statusCode?: number, requestId?: string) {
    super(message);
    this.name = 'ArchonError';
    this.statusCode = statusCode;
    this.requestId = requestId;
  }
}

export class ArchonAuthError extends ArchonError {
  constructor(requestId?: string) {
    super('Invalid or missing API key.', 401, requestId);
    this.name = 'ArchonAuthError';
  }
}

export class ArchonRateLimitError extends ArchonError {
  retryAfter: number;

  constructor(retryAfter: number = 60, requestId?: string) {
    super('Rate limit exceeded.', 429, requestId);
    this.name = 'ArchonRateLimitError';
    this.retryAfter = retryAfter;
  }
}

// ── Client ────────────────────────────────────────────────────

const DEFAULT_BASE_URL = 'https://api.archon.dev';
const MAX_RETRIES = 3;

/**
 * Archon API client for TypeScript/JavaScript.
 *
 * @example
 * ```typescript
 * const client = new ArchonClient({ apiKey: 'arch_xxx' });
 * const result = await client.architect('An AI code review tool');
 * console.log(result.architectureDiagram);
 * ```
 */
export class ArchonClient {
  private baseUrl: string;
  private timeout: number;
  private headers: Record<string, string>;

  constructor(config: ArchonConfig) {
    this.baseUrl = (config.baseUrl || DEFAULT_BASE_URL).replace(/\/$/, '');
    this.timeout = config.timeout || 60000;
    this.headers = {
      'Authorization': `Bearer ${config.apiKey}`,
      'Content-Type': 'application/json',
    };
  }

  /** Detect AI tasks from a natural-language product idea. */
  async analyze(inputText: string): Promise<AnalyzeResult> {
    const data = await this.request('POST', '/v1/analyze', { input_text: inputText });
    return {
      inputText: data.input_text,
      detectedTasks: data.detected_tasks,
      queryId: data.query_id,
      requestId: data.request_id,
    };
  }

  /** Get model recommendations for detected AI tasks. */
  async recommend(
    queryId: string,
    detectedTasks: Array<{ task: string; confidence: number }>,
    options?: { budgetMonthlyUsd?: number; preferOpenSource?: boolean },
  ): Promise<RecommendResult> {
    const body: Record<string, any> = {
      query_id: queryId,
      detected_tasks: detectedTasks,
      prefer_open_source: options?.preferOpenSource || false,
    };
    if (options?.budgetMonthlyUsd !== undefined) {
      body.budget_monthly_usd = options.budgetMonthlyUsd;
    }
    const data = await this.request('POST', '/v1/recommend', body);
    return {
      queryId: data.query_id,
      recommendations: data.recommendations?.map((r: any) => ({
        provider: r.provider,
        modelName: r.model_name,
        task: r.task,
        scores: r.scores,
        pricing: r.pricing,
        pricingSource: r.pricing_source,
        rationale: r.rationale,
      })) || [],
      totalEstimatedMonthlyCost: data.total_estimated_monthly_cost,
      requestId: data.request_id,
    };
  }

  /** Generate a complete AI architecture blueprint. */
  async architect(inputText: string, asyncMode = false): Promise<ArchitectResult> {
    const data = await this.request('POST', '/v1/architect', {
      input_text: inputText,
      async_mode: asyncMode,
    });
    return {
      status: data.status,
      blueprintId: data.blueprint_id,
      jobId: data.job_id,
      inputText: data.input_text,
      architectureJson: data.architecture_json,
      architectureDiagram: data.architecture_diagram,
      costEstimate: data.cost_estimate,
      latencyEstimate: data.latency_estimate,
      explanation: data.explanation,
      confidenceFlag: data.confidence_flag,
      requestId: data.request_id,
    };
  }

  /** Estimate cost and latency for an architecture. */
  async estimate(options: {
    blueprintId?: string;
    architectureJson?: Record<string, any>;
    monthlyRequestVolume?: number;
  }): Promise<EstimateResult> {
    const body: Record<string, any> = {
      monthly_request_volume: options.monthlyRequestVolume || 10000,
    };
    if (options.blueprintId) body.blueprint_id = options.blueprintId;
    if (options.architectureJson) body.architecture_json = options.architectureJson;

    const data = await this.request('POST', '/v1/estimate', body);
    return {
      totalMonthlyCostUsd: data.total_monthly_cost_usd,
      totalP95LatencyMs: data.total_p95_latency_ms,
      costBreakdown: data.cost_breakdown,
      latencyBreakdown: data.latency_breakdown,
      benchmarkCitations: data.benchmark_citations,
      monthlyRequestVolume: data.monthly_request_volume,
      requestId: data.request_id,
    };
  }

  /** Get a plain-English explanation of a blueprint. */
  async explain(blueprintId: string): Promise<ExplainResult> {
    const data = await this.request('POST', '/v1/explain', { blueprint_id: blueprintId });
    return {
      blueprintId: data.blueprint_id,
      explanation: data.explanation,
      tradeoffs: data.tradeoffs || [],
      alternativesConsidered: data.alternatives_considered || [],
      requestId: data.request_id,
    };
  }

  /** List all models in the registry. */
  async listModels(): Promise<ModelsResult> {
    const data = await this.request('GET', '/v1/models');
    return {
      models: data.models?.map((m: any) => ({
        id: m.id,
        provider: m.provider,
        modelName: m.model_name,
        capabilities: m.capabilities,
        pricing: m.pricing,
        pricingSource: m.pricing_source,
        isActive: m.is_active,
      })) || [],
      total: data.total,
      cacheTtlSeconds: data.cache_ttl_seconds,
      requestId: data.request_id,
    };
  }

  /** Internal HTTP request with exponential backoff on 429s. */
  private async request(
    method: string,
    path: string,
    body?: Record<string, any>,
  ): Promise<any> {
    const url = `${this.baseUrl}${path}`;

    for (let attempt = 0; attempt <= MAX_RETRIES; attempt++) {
      const controller = new AbortController();
      const timer = setTimeout(() => controller.abort(), this.timeout);

      try {
        const response = await fetch(url, {
          method,
          headers: this.headers,
          body: body ? JSON.stringify(body) : undefined,
          signal: controller.signal,
        });

        clearTimeout(timer);

        if (response.status === 429) {
          if (attempt < MAX_RETRIES) {
            const retryAfter = parseInt(response.headers.get('Retry-After') || '5');
            await this.backoff(attempt, retryAfter);
            continue;
          }
          throw new ArchonRateLimitError(
            parseInt(response.headers.get('Retry-After') || '60'),
            response.headers.get('X-Request-ID') || undefined,
          );
        }

        if (response.status === 401) {
          throw new ArchonAuthError(response.headers.get('X-Request-ID') || undefined);
        }

        if (!response.ok) {
          const data = await response.json().catch(() => ({}));
          throw new ArchonError(
            data.message || `HTTP ${response.status}`,
            response.status,
            response.headers.get('X-Request-ID') || undefined,
          );
        }

        return await response.json();
      } catch (error) {
        clearTimeout(timer);
        if (error instanceof ArchonError) throw error;
        if (attempt < MAX_RETRIES) {
          await this.backoff(attempt);
          continue;
        }
        throw new ArchonError(`Request failed: ${error}`);
      }
    }

    throw new ArchonError('Max retries exceeded.');
  }

  private async backoff(attempt: number, base = 1): Promise<void> {
    const delay = base * Math.pow(2, attempt) + Math.random();
    await new Promise((resolve) => setTimeout(resolve, delay * 1000));
  }
}
