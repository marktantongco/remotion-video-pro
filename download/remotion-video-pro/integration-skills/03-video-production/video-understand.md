---
name: video-understand
description: Implement specialized video understanding capabilities using the z-ai-web-dev-sdk. Use this skill when the user needs to analyze video content, understand motion and temporal sequences, extract information from video frames, describe video scenes, or perform video-based AI analysis. Optimized for MP4, AVI, MOV, and other common video formats.
remotion_stage: ACQUIRE
integration_type: data_source
pipeline_routes: [content-repurpose]
---

# Video Understand — Remotion Integration Guide

## Overview
Video content analysis using the z-ai-web-dev-sdk vision API. Analyzes existing videos to extract scene descriptions, timelines, action sequences, and content classifications. Feeds structured analysis data into downstream pipeline stages for repurposing workflows.

## Pipeline Role
Extends Rule 04 (audio-sync) by extracting temporal metadata from source videos. In the content-repurpose route, this skill runs as the ACQUIRE stage, analyzing source video content to generate structured data that the THINK stage transforms into repurposing scripts and the RENDER stage uses for composition props.

## Integration Pattern
Video analysis feeding structured data into the pipeline state:

```typescript
import ZAI from 'z-ai-web-dev-sdk';

async function analyzeSourceForRepurposing(videoUrl: string) {
  const zai = await ZAI.create();

  const response = await zai.chat.completions.createVision({
    messages: [{
      role: 'user',
      content: [
        { type: 'text', text: `Analyze this video for repurposing. Provide:
1. Scene breakdown with timestamps
2. Key talking points per scene
3. Visual highlights suitable for social clips
4. Suggested clip durations for 9:16 format
5. Overall mood and tone classification` },
        { type: 'video_url', video_url: { url: videoUrl } },
      ],
    }],
    thinking: { type: 'enabled' },
  });

  const analysis = response.choices[0]?.message?.content;
  return { analysis, sourceUrl: videoUrl, analyzedAt: new Date().toISOString() };
}
```

## Data Contract

| Direction | Field | Type | Description |
|-----------|-------|------|-------------|
| Input | `videoUrl` | string | Source video URL or local path |
| Input | `analysisDepth` | 'summary' \| 'detailed' \| 'full' | Analysis granularity |
| Output | `scenes` | object[] | Timestamped scene breakdown |
| Output | `talkingPoints` | string[] | Key points extracted per scene |
| Output | `clipSuggestions` | object[] | Recommended social clip segments |
| Output | `mood` | string | Overall tone classification |

## Route Participation

| Route | Stage | Role | Notes |
|-------|-------|------|-------|
| content-repurpose | ACQUIRE | Source video analyzer | Extracts structured data for repurposing |

## Configuration
- **Formats supported**: MP4, AVI, MOV, WebM, MKV, FLV
- **Thinking mode**: `enabled` for temporal reasoning, `disabled` for quick summaries
- **Batch processing**: 1s delay between requests to avoid rate limits
- **Long videos**: Sample at intervals rather than full analysis

## Example Pipeline Usage
```bash
curl -X POST /api/pipeline \
  -H "x-webhook-secret: $SECRET" \
  -d '{"route":"content-repurpose","compositionId":"BlogToVideo",
    "sourceUrls":["https://cdn.example.com/webinar.mp4"]}'
```
The ACQUIRE stage analyzes the source video, extracting scene data that drives automatic clip generation in the RENDER stage.
