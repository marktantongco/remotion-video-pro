/**
 * @module pipeline-routes
 * @description Predefined pipeline route configurations for common video production workflows.
 *
 * Each route defines a named sequence of pipeline stages, default settings,
 * and documentation for external integrators. Routes are referenced by the
 * `/api/pipeline` endpoint to configure multi-stage video production flows.
 *
 * Available routes:
 * - `competitor-intel` — Monitor competitor content and generate comparison videos
 * - `product-launch` — End-to-end video campaign for new product launches
 * - `personalized-videos` — Batch-render personalized videos from user data
 * - `content-repurpose` — Transform existing content into multiple video formats
 * - `ab-testing` — Run A/B tests on video variants with statistical analysis
 */

import { PipelineStage } from './pipeline';

// ── Types ──

/**
 * Configuration for a named pipeline route.
 */
export interface PipelineRouteConfig {
  /** Ordered list of stages to execute */
  stages: PipelineStage[];
  /** Human-readable description of what this pipeline does */
  description: string;
  /** Whether source URLs are required for this route */
  requiresSourceUrls: boolean;
  /** Whether an A/B test ID is required */
  requiresAbTestId: boolean;
  /** Default priority for jobs in this pipeline */
  defaultPriority: number;
  /** Expected output types from this pipeline */
  outputTypes: string[];
}

// ── Route Definitions ──

/**
 * Predefined pipeline route configurations.
 *
 * Each route maps a named workflow to a specific sequence of pipeline stages.
 * Routes are designed for common video production use cases and can be
 * extended with custom stages or overridden via API parameters.
 */
export const PIPELINE_ROUTES: Record<string, PipelineRouteConfig> = {
  /**
   * Competitor Intelligence Pipeline
   *
   * Monitors competitor websites and content to generate comparison videos.
   * Useful for competitive analysis, market positioning, and content strategy.
   *
   * Flow: Acquire competitor data → Analyze content → Design comparison visuals → Render video → Test effectiveness
   *
   * @example
   * ```bash
   * curl -X POST /api/pipeline \
   *   -H "x-webhook-secret: $SECRET" \
   *   -d '{
   *     "route": "competitor-intel",
   *     "compositionId": "CompetitorComparisonVideo",
   *     "sourceUrls": ["https://competitor.com/product", "https://competitor.com/pricing"]
   *   }'
   * ```
   */
  'competitor-intel': {
    stages: [
      PipelineStage.ACQUIRE,
      PipelineStage.THINK,
      PipelineStage.DESIGN,
      PipelineStage.RENDER,
      PipelineStage.TEST,
    ],
    description:
      'Monitor competitor content, analyze positioning, and generate comparison videos. Uses web scraping and AI analysis to identify key differentiators.',
    requiresSourceUrls: true,
    requiresAbTestId: false,
    defaultPriority: 5,
    outputTypes: ['comparison-video', 'analysis-report', 'screenshot-diff'],
  },

  /**
   * Product Launch Pipeline
   *
   * End-to-end video production for product launches.
   * Generates marketing copy, designs visuals, renders the video, tests variants,
   * and deploys to distribution channels.
   *
   * Flow: Generate campaign strategy → Design visual assets → Render video → A/B test → Deploy to CDN
   *
   * @example
   * ```bash
   * curl -X POST /api/pipeline \
   *   -H "x-webhook-secret: $SECRET" \
   *   -d '{
   *     "route": "product-launch",
   *     "compositionId": "ProductLaunchVideo",
   *     "callbackUrl": "https://myapp.com/webhook/launch-complete"
   *   }'
   * ```
   */
  'product-launch': {
    stages: [
      PipelineStage.THINK,
      PipelineStage.DESIGN,
      PipelineStage.RENDER,
      PipelineStage.TEST,
      PipelineStage.DEPLOY,
    ],
    description:
      'End-to-end product launch video campaign. AI generates marketing strategy, designs visuals, renders video variants, runs A/B tests, and deploys winners.',
    requiresSourceUrls: false,
    requiresAbTestId: false,
    defaultPriority: 8,
    outputTypes: ['marketing-video', 'ab-test-report', 'cdn-url'],
  },

  /**
   * Personalized Videos Pipeline
   *
   * Batch-render personalized videos tailored to individual users or events.
   * Acquires user data from webhooks or APIs, generates personalized scripts,
   * designs custom visuals, and renders the final video.
   *
   * Flow: Ingest user data → Generate personalized script → Design custom visuals → Render video → Deploy
   *
   * @example
   * ```bash
   * curl -X POST /api/pipeline \
   *   -H "x-webhook-secret: $SECRET" \
   *   -d '{
   *     "route": "personalized-videos",
   *     "compositionId": "PersonalizedWelcomeVideo",
   *     "sourceUrls": ["https://api.myapp.com/users/123"],
   *     "metadata": { "userId": "123", "eventType": "signup" }
   *   }'
   * ```
   */
  'personalized-videos': {
    stages: [
      PipelineStage.ACQUIRE,
      PipelineStage.THINK,
      PipelineStage.DESIGN,
      PipelineStage.RENDER,
      PipelineStage.DEPLOY,
    ],
    description:
      'Batch-render personalized videos from user data. Ingests user profiles, generates tailored scripts, and delivers custom videos.',
    requiresSourceUrls: false,
    requiresAbTestId: false,
    defaultPriority: 6,
    outputTypes: ['personalized-video', 'user-data-report'],
  },

  /**
   * Content Repurpose Pipeline
   *
   * Transforms existing web content (articles, blog posts, landing pages) into
   * multiple video formats. Useful for content marketing and omnichannel distribution.
   *
   * Flow: Scrape source content → Analyze and extract key points → Design video assets → Render video → Test engagement → Deploy to channels
   *
   * @example
   * ```bash
   * curl -X POST /api/pipeline \
   *   -H "x-webhook-secret: $SECRET" \
   *   -d '{
   *     "route": "content-repurpose",
   *     "compositionId": "BlogToVideo",
   *     "sourceUrls": ["https://blog.example.com/my-article"],
   *     "callbackUrl": "https://myapp.com/webhook/repurpose-done"
   *   }'
   * ```
   */
  'content-repurpose': {
    stages: [
      PipelineStage.ACQUIRE,
      PipelineStage.THINK,
      PipelineStage.DESIGN,
      PipelineStage.RENDER,
      PipelineStage.TEST,
      PipelineStage.DEPLOY,
    ],
    description:
      'Transform existing web content into video formats. Scrapes articles/pages, extracts key points with AI, and renders optimized videos for social media.',
    requiresSourceUrls: true,
    requiresAbTestId: false,
    defaultPriority: 5,
    outputTypes: ['repurposed-video', 'social-clip', 'thumbnail', 'cdn-url'],
  },

  /**
   * A/B Testing Pipeline
   *
   * Generate multiple video variants and run statistical A/B tests to determine
   * the highest-performing creative. Includes chi-square significance testing
   * and automated winner selection.
   *
   * Flow: Generate variant strategies → Design multiple visual variants → Render all variants → Run A/B test → Deploy winner
   *
   * @example
   * ```bash
   * curl -X POST /api/pipeline \
   *   -H "x-webhook-secret: $SECRET" \
   *   -d '{
   *     "route": "ab-testing",
   *     "compositionId": "AdVariantVideo",
   *     "abTestId": "test_abc123",
   *     "metadata": { "variants": 3, "sampleSize": 1000 }
   *   }'
   * ```
   */
  'ab-testing': {
    stages: [
      PipelineStage.THINK,
      PipelineStage.DESIGN,
      PipelineStage.RENDER,
      PipelineStage.TEST,
      PipelineStage.DEPLOY,
    ],
    description:
      'Generate video variants and run A/B tests with statistical significance analysis. Automatically selects the winning creative based on engagement metrics.',
    requiresSourceUrls: false,
    requiresAbTestId: false,
    defaultPriority: 7,
    outputTypes: ['variant-videos', 'ab-test-report', 'chi-square-analysis', 'winner-deployment'],
  },
};

/**
 * Get all available pipeline route names.
 *
 * @returns Array of route identifier strings
 */
export function getAvailableRoutes(): string[] {
  return Object.keys(PIPELINE_ROUTES);
}

/**
 * Get the configuration for a specific pipeline route.
 *
 * @param route - The route identifier
 * @returns The route configuration, or `undefined` if the route doesn't exist
 */
export function getRouteConfig(route: string): PipelineRouteConfig | undefined {
  return PIPELINE_ROUTES[route];
}

/**
 * Validate that a route name exists and return its config.
 * Throws an error if the route is not found.
 *
 * @param route - The route identifier to validate
 * @returns The validated route configuration
 * @throws {Error} If the route does not exist
 */
export function validateRoute(route: string): PipelineRouteConfig {
  const config = PIPELINE_ROUTES[route];
  if (!config) {
    const available = Object.keys(PIPELINE_ROUTES).join(', ');
    throw new Error(
      `Unknown pipeline route "${route}". Available routes: ${available}`
    );
  }
  return config;
}
