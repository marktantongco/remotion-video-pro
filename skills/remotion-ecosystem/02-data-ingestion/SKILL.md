# 02 — Data Ingestion

Content sourcing for video data. Extracts structured data from web pages,
APIs, and documents to feed Remotion video compositions.

## Skills

| Skill | Role in Pipeline |
|-------|-----------------|
| **firecrawl-scrape** | Extract clean markdown from JS-rendered pages (49.2K installs) |
| **firecrawl-crawl** | Bulk site crawling with depth control |
| **spider** | Site scanning, link extraction, security auditing |
| **web-reader** | Page metadata extraction + content reading (z-ai-web-dev-sdk) |
| **web-search** | Real-time web search (z-ai-web-dev-sdk) |
| **browserbase-fetch** | Lightweight URL fetching with proxy support |

## Remotion Integration

All skills in this category operate at Stage 1 (ACQUIRE). Their output
becomes Remotion composition props.

### Data Flow

```
firecrawl-scrape (extract page content)
  → parseToVideoProps(markdown)
  → remotion-video-pro.render(props)
```

### Integration Hooks

**firecrawl-scrape → remotion-video-pro:**
```typescript
// Integration pattern
const content = await firecrawlScrape({
  url: productPageUrl,
  format: 'markdown',
  onlyMainContent: true,
});

const props = {
  title: content.match(/^# (.+)$/m)?.[1] || '',
  features: content.match(/^- (.+)$/gm) || [],
  description: content.substring(0, 500),
  // Feeds directly into Remotion composition
};

await remotionVideoPro.render({
  compositionId: 'ProductDemo',
  inputProps: props,
});
```

**spider → remotion-video-pro:**
- Competitive scanning output (features, pricing, reviews) becomes
  comparison video props
- Security scan findings can trigger compliance video compositions

**web-search → remotion-video-pro:**
- Market intelligence search results feed into trend/data videos
- Search snippets become video text overlays

## Output Schema

Every skill in this category should output data compatible with Remotion props:

```typescript
interface VideoDataSource {
  // Required by all Remotion compositions
  title: string;
  subtitle?: string;
  bodyText?: string;

  // Optional enrichment
  features?: string[];
  metrics?: Array<{ label: string; value: number }>;
  images?: string[];
  sourceUrl?: string;
  scrapedAt?: Date;
}
```
