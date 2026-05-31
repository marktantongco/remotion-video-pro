---
name: agents-deploy
description: Use when deploying your agent to AWS, or when a deploy has failed. Handles pre-flight validation, CDK/IAM/quota error diagnosis, version management, rollback, and canary deployments.
remotion_stage: DEPLOY
integration_type: deployment
pipeline_routes: [competitor-intel, product-launch, personalized-videos, ab-testing]
---

# AWS Agents Deploy — Remotion Integration Guide

## Overview

The AWS Agents Deploy skill manages AgentCore deployment to AWS via the `agentcore` CLI with CDK/IAM validation. In the Remotion Video Pro pipeline, it deploys Remotion Lambda rendering workers, the AgentCore runtime that orchestrates pipeline skills, and ensures IAM permissions align with S3 output buckets and render callback endpoints.

## Pipeline Role

Operates in the DEPLOY stage to provision AWS infrastructure that supports Remotion rendering at scale. This includes deploying AgentCore runtimes that invoke pipeline skills, configuring Lambda concurrency for Remotion renders, and validating that Bedrock model access is enabled in the target region for the THINK stage.

## Integration Pattern

Deploy the AgentCore runtime and validate Remotion Lambda rendering infrastructure:

```typescript
// agentcore/agentcore.json — pipeline orchestration agent config
{
  "agent": {
    "name": "video-pipeline-orchestrator",
    "foundationModel": "us.anthropic.claude-sonnet-4-20250514",
    "instruction": "Orchestrate Remotion video pipeline routes..."
  },
  "memory": {
    "shortTerm": { "enabled": true },
    "longTerm": { "enabled": false }
  },
  "tools": [
    { "name": "render-video", "type": "lambda", "arn": "${RENDER_LAMBDA_ARN}" },
    { "name": "generate-props", "type": "lambda", "arn": "${PROPS_LAMBDA_ARN}" }
  ]
}

// aws-targets.json — multi-environment deployment
[
  { "name": "staging", "account": "123456789012", "region": "us-east-1" },
  { "name": "production", "account": "987654321098", "region": "us-east-1" }
]
```

```bash
# Pre-flight validation before pipeline deploy
agentcore validate
agentcore deploy --dry-run          # preview resources
agentcore deploy --diff             # diff against current stack
agentcore deploy --target staging -y
```

## Data Contract

| Field | Type | Source | Destination |
|-------|------|--------|-------------|
| `foundationModel` | `string` | agentcore.json | Bedrock (THINK stage) |
| `RENDER_LAMBDA_ARN` | `string` | CloudFormation output | AgentCore tool registration |
| `PROPS_LAMBDA_ARN` | `string` | CloudFormation output | AgentCore tool registration |
| `aws-target` | `object[]` | aws-targets.json | CDK deployment target |

## Route Participation

| Route | AgentCore Role | Lambda Workers |
|-------|---------------|----------------|
| competitor-intel | Orchestrates scrape + script skills | 1 concurrent |
| product-launch | Orchestrates full batch pipeline | 10 concurrent |
| personalized-videos | Per-user personalization agent | 20 concurrent |
| ab-testing | Variant generation + metrics agent | 5 concurrent |

## Configuration

| Variable | Required | Description |
|----------|----------|-------------|
| `AWS_REGION` | Yes | Must match aws-targets.json region |
| `BEDROCK_MODEL_ACCESS` | Yes | Claude model enabled in target region |
| `RENDER_LAMBDA_TIMEOUT` | No | Seconds (default 120 for 30fps videos) |
| `RENDER_CONCURRENCY` | No | Max simultaneous Lambda renders |

## Example Pipeline Usage

```bash
agentcore validate                                           # Pre-flight
agentcore deploy --target staging -y                        # Staging
agentcore status                                            # Verify
agentcore deploy --target production -y                     # Production
```
