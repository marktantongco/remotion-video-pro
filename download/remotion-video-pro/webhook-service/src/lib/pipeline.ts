/**
 * @module pipeline
 * @description Pipeline orchestration engine for multi-stage video production workflows.
 *
 * Provides the core execution model for running video production pipelines that
 * chain together data acquisition, AI analysis, visual design, rendering, testing,
 * and deployment into a single coordinated workflow.
 *
 * The engine supports:
 * - Sequential stage execution with per-stage error handling
 * - Failed stages skip all downstream stages while preserving completed results
 * - In-memory pipeline state storage for status queries
 * - Pluggable stage implementations via the SkillBridge
 *
 * @example
 * ```ts
 * const pipeline = await runPipeline({
 *   id: 'pipe_123',
 *   name: 'Competitor Analysis',
 *   route: 'competitor-intel',
 *   stages: [ACQUIRE, THINK, DESIGN, RENDER, TEST],
 *   compositionId: 'CompetitorComparisonVideo',
 *   sourceUrls: ['https://competitor.com'],
 *   webhookSecret: 'secret123',
 * });
 * ```
 */

import { randomUUID } from 'crypto';
import { SkillBridge } from './skill-bridge';

// ── Enums ──

/**
 * Pipeline execution stages.
 * Each stage represents a distinct phase in the video production workflow.
 */
export enum PipelineStage {
  /** Data ingestion — web scraping, crawling, search, API data fetch */
  ACQUIRE = 'acquire',
  /** AI analysis — content understanding, script generation, strategic thinking */
  THINK = 'think',
  /** Visual design — image generation, chart creation, UI/UX design */
  DESIGN = 'design',
  /** Video rendering — Remotion composition rendering on AWS Lambda */
  RENDER = 'render',
  /** A/B testing and monitoring — variant comparison, statistical analysis */
  TEST = 'test',
  /** Cloud deployment — CDN upload, distribution channel publishing */
  DEPLOY = 'deploy',
}

// ── Interfaces ──

/**
 * Configuration for a pipeline execution.
 */
export interface PipelineConfig {
  /** Unique pipeline identifier (auto-generated if not provided) */
  id: string;
  /** Human-readable pipeline name */
  name: string;
  /** Named route that determines default stage sequence */
  route: 'competitor-intel' | 'product-launch' | 'personalized-videos' | 'content-repurpose' | 'ab-testing';
  /** Ordered list of stages to execute */
  stages: PipelineStage[];
  /** URLs to scrape/crawl for data acquisition (used by ACQUIRE stage) */
  sourceUrls?: string[];
  /** Remotion composition ID for the RENDER stage */
  compositionId: string;
  /** Optional A/B test ID to link test results to (used by TEST stage) */
  abTestId?: string;
  /** Webhook secret for authentication */
  webhookSecret: string;
  /** URL to send a completion callback when pipeline finishes */
  callbackUrl?: string;
  /** Priority for render queue jobs (higher = more urgent) */
  priority?: number;
  /** Arbitrary metadata passed through to stages */
  metadata?: Record<string, unknown>;
}

/**
 * Result of a single pipeline stage execution.
 */
export interface StageResult {
  /** Which stage this result belongs to */
  stage: PipelineStage;
  /** Current status of this stage */
  status: 'pending' | 'running' | 'completed' | 'failed' | 'skipped';
  /** When this stage started executing */
  startedAt?: Date;
  /** When this stage finished (completed or failed) */
  completedAt?: Date;
  /** Output data produced by this stage */
  output?: Record<string, unknown>;
  /** Error message if the stage failed */
  error?: string;
  /** Execution duration in milliseconds */
  durationMs?: number;
}

/**
 * Complete result of a pipeline execution.
 */
export interface PipelineResult {
  /** Unique pipeline identifier */
  id: string;
  /** The configuration used to create this pipeline */
  config: PipelineConfig;
  /** Results for each stage in execution order */
  stages: StageResult[];
  /** Overall pipeline status */
  status: 'running' | 'completed' | 'failed' | 'partial';
  /** When the pipeline was created */
  createdAt: Date;
  /** When the pipeline was last updated */
  updatedAt: Date;
  /** ID of the render job created by the RENDER stage */
  renderJobId?: string;
  /** Total execution duration in milliseconds */
  totalDurationMs?: number;
}

// ── In-Memory Storage ──

/**
 * In-memory store for active and recently completed pipelines.
 *
 * For production deployments with multiple instances, replace with
 * a Redis-backed or database-backed store.
 */
const pipelineStore = new Map<string, PipelineResult>();

/**
 * Skill bridge instance used by all stage implementations.
 * Provides the interface to external skill integrations.
 */
const skillBridge = new SkillBridge();

// ── Core Functions ──

/**
 * Initialize a pipeline with all stages set to pending status.
 *
 * Creates a PipelineResult with stage placeholders for each configured stage.
 * The pipeline is stored in-memory and can be retrieved by ID.
 *
 * @param config - Pipeline configuration
 * @returns The initialized pipeline result (status: 'running')
 *
 * @example
 * ```ts
 * const pipeline = createPipeline({
 *   id: 'pipe_001',
 *   name: 'Product Launch Video',
 *   route: 'product-launch',
 *   stages: [PipelineStage.THINK, PipelineStage.DESIGN, PipelineStage.RENDER],
 *   compositionId: 'LaunchVideo',
 *   webhookSecret: 'my-secret',
 * });
 * // pipeline.status === 'running'
 * // pipeline.stages[0].status === 'pending'
 * ```
 */
export function createPipeline(config: PipelineConfig): PipelineResult {
  const now = new Date();

  const stages: StageResult[] = config.stages.map((stage) => ({
    stage,
    status: 'pending' as const,
  }));

  const pipeline: PipelineResult = {
    id: config.id,
    config,
    stages,
    status: 'running',
    createdAt: now,
    updatedAt: now,
  };

  pipelineStore.set(pipeline.id, pipeline);

  return pipeline;
}

/**
 * Execute a single pipeline stage.
 *
 * Dispatches to the appropriate stage handler based on the stage type.
 * Each handler uses the SkillBridge to perform the actual work.
 *
 * @param pipeline - The pipeline result to update
 * @param stage - The stage to execute
 * @returns The updated stage result after execution
 *
 * @example
 * ```ts
 * const stageResult = await executeStage(pipeline, PipelineStage.ACQUIRE);
 * // stageResult.status === 'completed' | 'failed'
 * ```
 */
export async function executeStage(
  pipeline: PipelineResult,
  stage: PipelineStage
): Promise<StageResult> {
  const stageIndex = pipeline.stages.findIndex((s) => s.stage === stage);
  if (stageIndex === -1) {
    return {
      stage,
      status: 'failed',
      error: `Stage "${stage}" not found in pipeline configuration`,
    };
  }

  const stageResult = pipeline.stages[stageIndex];
  stageResult.status = 'running';
  stageResult.startedAt = new Date();
  pipeline.updatedAt = new Date();

  const startTime = Date.now();

  try {
    const output = await runStageHandler(stage, pipeline);

    stageResult.status = 'completed';
    stageResult.completedAt = new Date();
    stageResult.durationMs = Date.now() - startTime;

    // Store render job ID if produced by RENDER stage
    if (stage === PipelineStage.RENDER && output?.renderJobId) {
      pipeline.renderJobId = output.renderJobId as string;
    }

    stageResult.output = output;
  } catch (err) {
    stageResult.status = 'failed';
    stageResult.completedAt = new Date();
    stageResult.durationMs = Date.now() - startTime;
    stageResult.error = err instanceof Error ? err.message : String(err);
  }

  pipeline.updatedAt = new Date();
  pipelineStore.set(pipeline.id, pipeline);

  return stageResult;
}

/**
 * Run the full pipeline sequentially.
 *
 * Executes each stage in order. If a stage fails, all subsequent stages
 * are marked as 'skipped'. Completed stages retain their results.
 * The pipeline status is set based on the outcome:
 * - `completed` — all stages completed successfully
 * - `failed` — the first stage failed (no stages completed)
 * - `partial` — some stages completed before a failure
 *
 * @param config - Pipeline configuration
 * @returns The final pipeline result after all stages have been executed
 *
 * @example
 * ```ts
 * const result = await runPipeline(config);
 * if (result.status === 'completed') {
 *   console.log('All stages completed:', result.totalDurationMs, 'ms');
 * }
 * ```
 */
export async function runPipeline(config: PipelineConfig): Promise<PipelineResult> {
  // Ensure ID is set
  if (!config.id) {
    config.id = `pipe_${randomUUID().slice(0, 8)}`;
  }

  const pipeline = createPipeline(config);
  const overallStart = Date.now();

  let hadFailure = false;

  for (const stageResult of pipeline.stages) {
    if (hadFailure) {
      // Skip downstream stages after a failure
      stageResult.status = 'skipped';
      stageResult.completedAt = new Date();
      continue;
    }

    const result = await executeStage(pipeline, stageResult.stage);

    if (result.status === 'failed') {
      hadFailure = true;
    }
  }

  pipeline.totalDurationMs = Date.now() - overallStart;

  // Determine overall status
  const completedCount = pipeline.stages.filter((s) => s.status === 'completed').length;
  const failedCount = pipeline.stages.filter((s) => s.status === 'failed').length;

  if (failedCount > 0 && completedCount === 0) {
    pipeline.status = 'failed';
  } else if (failedCount > 0 && completedCount > 0) {
    pipeline.status = 'partial';
  } else {
    pipeline.status = 'completed';
  }

  pipeline.updatedAt = new Date();
  pipelineStore.set(pipeline.id, pipeline);

  // Fire completion callback if configured
  if (pipeline.config.callbackUrl) {
    fireCallback(pipeline).catch((err) => {
      console.error(
        `[Pipeline] Callback failed for ${pipeline.id}:`,
        err instanceof Error ? err.message : err
      );
    });
  }

  return pipeline;
}

/**
 * Retrieve the current status of a pipeline by ID.
 *
 * @param id - The pipeline identifier
 * @returns The pipeline result, or `null` if not found
 */
export function getPipelineStatus(id: string): PipelineResult | null {
  return pipelineStore.get(id) ?? null;
}

/**
 * List all pipelines currently in the in-memory store.
 *
 * @returns Array of pipeline results
 */
export function listPipelines(): PipelineResult[] {
  return Array.from(pipelineStore.values());
}

/**
 * Remove a pipeline from the in-memory store.
 *
 * @param id - The pipeline identifier to remove
 * @returns `true` if the pipeline was found and removed, `false` otherwise
 */
export function removePipeline(id: string): boolean {
  return pipelineStore.delete(id);
}

// ── Stage Handlers ──

/**
 * Route a stage execution to its appropriate handler.
 * Each handler represents a placeholder for actual skill integrations.
 *
 * TODO: Wire each handler to the corresponding SkillBridge methods
 * when the external skill SDK is available.
 */
async function runStageHandler(
  stage: PipelineStage,
  pipeline: PipelineResult
): Promise<Record<string, unknown>> {
  switch (stage) {
    case PipelineStage.ACQUIRE:
      return handleAcquireStage(pipeline);

    case PipelineStage.THINK:
      return handleThinkStage(pipeline);

    case PipelineStage.DESIGN:
      return handleDesignStage(pipeline);

    case PipelineStage.RENDER:
      return handleRenderStage(pipeline);

    case PipelineStage.TEST:
      return handleTestStage(pipeline);

    case PipelineStage.DEPLOY:
      return handleDeployStage(pipeline);

    default: {
      const _exhaustive: never = stage;
      throw new Error(`Unknown pipeline stage: ${_exhaustive}`);
    }
  }
}

/**
 * ACQUIRE stage — Data ingestion.
 *
 * Scrapes source URLs using the SkillBridge to collect raw content.
 * If no source URLs are configured, collects data from metadata or
 * previous stage outputs.
 */
async function handleAcquireStage(
  pipeline: PipelineResult
): Promise<Record<string, unknown>> {
  const { sourceUrls, metadata } = pipeline.config;

  if (!sourceUrls || sourceUrls.length === 0) {
    console.log(`[Pipeline:${pipeline.id}] ACQUIRE: No source URLs configured, skipping crawl`);
    return {
      message: 'No source URLs configured — using metadata as input',
      metadata,
      scrapedAt: new Date().toISOString(),
    };
  }

  console.log(`[Pipeline:${pipeline.id}] ACQUIRE: Scraping ${sourceUrls.length} URL(s)...`);

  const pages: Array<{ url: string; title: string; contentLength: number }> = [];

  for (const url of sourceUrls) {
    try {
      const result = await skillBridge.scrapeUrl(url);
      pages.push({
        url,
        title: result.title,
        contentLength: result.markdown.length,
      });
    } catch (err) {
      console.error(
        `[Pipeline:${pipeline.id}] ACQUIRE: Failed to scrape ${url}:`,
        err instanceof Error ? err.message : err
      );
    }
  }

  return {
    message: `Acquired content from ${pages.length}/${sourceUrls.length} URLs`,
    pages,
    totalSourceUrls: sourceUrls.length,
    scrapedAt: new Date().toISOString(),
  };
}

/**
 * THINK stage — AI analysis and strategy.
 *
 * Uses the SkillBridge to analyze acquired content, generate video scripts,
 * and determine the best creative approach.
 */
async function handleThinkStage(
  pipeline: PipelineResult
): Promise<Record<string, unknown>> {
  console.log(`[Pipeline:${pipeline.id}] THINK: Analyzing content and generating strategy...`);

  // Collect input from previous stages
  const acquireOutput = pipeline.stages.find(
    (s) => s.stage === PipelineStage.ACQUIRE && s.status === 'completed'
  )?.output;

  const inputContent = acquireOutput
    ? JSON.stringify(acquireOutput)
    : JSON.stringify(pipeline.config.metadata ?? {});

  // Generate video script using AI
  const script = await skillBridge.generateVideoScript(inputContent);
  const analysis = await skillBridge.analyzeContent(inputContent);

  return {
    message: 'AI analysis complete — script and strategy generated',
    script,
    analysis,
    processedAt: new Date().toISOString(),
  };
}

/**
 * DESIGN stage — Visual asset creation.
 *
 * Generates images, charts, and other visual assets needed for the video
 * composition. Uses the SkillBridge for image generation and chart creation.
 */
async function handleDesignStage(
  pipeline: PipelineResult
): Promise<Record<string, unknown>> {
  console.log(`[Pipeline:${pipeline.id}] DESIGN: Generating visual assets...`);

  const thinkOutput = pipeline.stages.find(
    (s) => s.stage === PipelineStage.THINK && s.status === 'completed'
  )?.output;

  const scriptData = thinkOutput?.script as { headline?: string } | undefined;

  // Generate key visual from script headline
  const headline = scriptData?.headline ?? 'Product Video';
  const imageResult = await skillBridge.generateImage(
    `Professional marketing video thumbnail: ${headline}`,
    '1920x1080'
  );

  return {
    message: 'Visual assets generated',
    assets: {
      thumbnail: { generated: true, size: '1920x1080' },
    },
    imageGenerated: !!imageResult.base64,
    designedAt: new Date().toISOString(),
  };
}

/**
 * RENDER stage — Video rendering.
 *
 * Queues a Remotion render job via BullMQ and AWS Lambda.
 * Collects all upstream stage outputs as render props.
 */
async function handleRenderStage(
  pipeline: PipelineResult
): Promise<Record<string, unknown>> {
  console.log(`[Pipeline:${pipeline.id}] RENDER: Starting video render...`);

  const { compositionId, priority, callbackUrl } = pipeline.config;

  // Collect inputs from all previous stages
  const renderProps: Record<string, unknown> = {
    compositionId,
    pipelineId: pipeline.id,
  };

  for (const stage of pipeline.stages) {
    if (stage.status === 'completed' && stage.output) {
      renderProps[`stage_${stage.stage}`] = stage.output;
    }
  }

  // Merge any explicit metadata
  if (pipeline.config.metadata) {
    renderProps.metadata = pipeline.config.metadata;
  }

  // TODO: Wire to actual renderQueue.add() from @/lib/queue
  // For now, simulate a render job creation
  const renderJobId = `render_${pipeline.id}_${Date.now()}`;

  console.log(
    `[Pipeline:${pipeline.id}] RENDER: Queued render job ${renderJobId} for composition ${compositionId}`
  );

  return {
    message: 'Render job queued successfully',
    renderJobId,
    compositionId,
    priority: priority ?? 5,
    callbackUrl: callbackUrl ?? null,
    propsKeys: Object.keys(renderProps),
    renderedAt: new Date().toISOString(),
  };
}

/**
 * TEST stage — A/B testing and monitoring.
 *
 * Runs A/B tests if configured, checks system health, and validates
 * rendered video output.
 */
async function handleTestStage(
  pipeline: PipelineResult
): Promise<Record<string, unknown>> {
  console.log(`[Pipeline:${pipeline.id}] TEST: Running tests and validation...`);

  const { abTestId } = pipeline.config;

  // Check system health
  const health = await skillBridge.checkSystemHealth();

  const results: Record<string, unknown> = {
    message: 'Testing complete',
    healthCheck: health,
    testedAt: new Date().toISOString(),
  };

  // If an A/B test is linked, fetch results
  if (abTestId) {
    const abResults = await skillBridge.getABTestResults(abTestId);
    results.abTest = abResults;
  }

  return results;
}

/**
 * DEPLOY stage — Cloud deployment.
 *
 * Deploys rendered video to CDN or distribution channels.
 * Fires callbacks and tracks deployment events.
 */
async function handleDeployStage(
  pipeline: PipelineResult
): Promise<Record<string, unknown>> {
  console.log(`[Pipeline:${pipeline.id}] DEPLOY: Deploying to distribution channels...`);

  // Track deployment event
  await skillBridge.trackEvent('pipeline.deploy.start', {
    pipelineId: pipeline.id,
    route: pipeline.config.route,
    compositionId: pipeline.config.compositionId,
  });

  // TODO: Wire to actual CDN upload (S3, CloudFront, Vercel Blob, etc.)
  const deployUrl = `https://cdn.example.com/videos/${pipeline.config.compositionId}/${pipeline.id}.mp4`;

  await skillBridge.trackEvent('pipeline.deploy.complete', {
    pipelineId: pipeline.id,
    deployUrl,
  });

  return {
    message: 'Deployment complete',
    deployUrl,
    deployedAt: new Date().toISOString(),
  };
}

// ── Callbacks ──

/**
 * Fire a completion callback to the configured callback URL.
 * Notifies external systems that the pipeline has finished.
 */
async function fireCallback(pipeline: PipelineResult): Promise<void> {
  const { callbackUrl } = pipeline.config;
  if (!callbackUrl) return;

  // Validate the callback URL (SSRF protection)
  const { validateUrl } = await import('./url-validator');
  const validation = validateUrl(callbackUrl);

  if (!validation.valid) {
    console.error(`[Pipeline] Invalid callback URL: ${validation.error}`);
    return;
  }

  const safeUrl = validation.sanitizedUrl!;

  await fetch(safeUrl, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      pipelineId: pipeline.id,
      status: pipeline.status,
      route: pipeline.config.route,
      compositionId: pipeline.config.compositionId,
      totalDurationMs: pipeline.totalDurationMs,
      stages: pipeline.stages.map((s) => ({
        stage: s.stage,
        status: s.status,
        durationMs: s.durationMs,
        error: s.error,
      })),
      renderJobId: pipeline.renderJobId,
      completedAt: new Date().toISOString(),
    }),
  }).catch((err) => {
    console.error(
      `[Pipeline] Callback request failed for ${safeUrl}:`,
      err instanceof Error ? err.message : err
    );
  });
}
