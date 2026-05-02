# NVIDIA NIM API Builder - Build and run LLM inference via NVIDIA's hosted API (build.nvidia.com)

## Context

This skill enables AI agents to make authenticated requests to the NVIDIA NIM (NVIDIA Inference Microservices) API at `https://integrate.api.nvidia.com/v1/`. It supports a growing catalog of open-source and proprietary LLMs — including Meta Llama, Mistral, Google Gemma, NVIDIA Nemotron, and more — all served through a single OpenAI-compatible chat completions endpoint.

**When to use this skill:**
- You need to call an external LLM model for text generation, reasoning, summarization, or analysis
- The user explicitly requests NVIDIA NIM or references `build.nvidia.com`
- You need a cost-effective alternative to proprietary API providers with access to open-weight models
- You need to integrate NVIDIA-hosted model inference into a backend workflow, cron job, or automation pipeline

**When NOT to use this skill:**
- The task can be handled by the built-in z-ai-web-dev-sdk (use that first — it's faster and has no API key dependency)
- The user only wants general chat completions without specifying NVIDIA

## Instructions

### Step 1: Validate Prerequisites

Before making any API call, verify:
- The `NVIDIA_API_KEY` environment variable is available. If not, ask the user to provide it and set it via `export NVIDIA_API_KEY=nvapi-...`
- The target model is available on NVIDIA NIM. Check `https://build.nvidia.com/explore/discover` for the current catalog.

### Step 2: Construct the Request

Use the Python template below as the canonical reference. Adapt parameters as needed.

```python
import requests
import os

invoke_url = "https://integrate.api.nvidia.com/v1/chat/completions"
stream = False  # Set True for streaming output

headers = {
    "Authorization": f"Bearer {os.environ.get('NVIDIA_API_KEY', '')}",
    "Accept": "text/event-stream" if stream else "application/json",
    "Content-Type": "application/json"
}

payload = {
    "model": "meta/llama-4-maverick-17b-128e-instruct",
    "messages": [
        {"role": "system", "content": "You are a helpful assistant."},
        {"role": "user", "content": "<USER_PROMPT_HERE>"}
    ],
    "max_tokens": 512,
    "temperature": 1.00,
    "top_p": 1.00,
    "frequency_penalty": 0.00,
    "presence_penalty": 0.00,
    "stream": stream
}

response = requests.post(invoke_url, headers=headers, json=payload)

if stream:
    for line in response.iter_lines():
        if line:
            decoded = line.decode("utf-8")
            if decoded.startswith("data: ") and decoded != "data: [DONE]":
                print(decoded)
else:
    result = response.json()
    if "choices" in result and len(result["choices"]) > 0:
        print(result["choices"][0]["message"]["content"])
    else:
        print(result)
```

### Step 3: Choose the Right Model

Select the model based on the task requirements:

| Use Case | Recommended Model | Model ID |
|----------|-------------------|----------|
| General reasoning & chat | Meta Llama 4 Maverick | `meta/llama-4-maverick-17b-128e-instruct` |
| Fast lightweight tasks | Meta Llama 3.1 8B | `meta/llama-3.1-8b-instruct` |
| Heavy reasoning | Meta Llama 3.1 70B | `meta/llama-3.1-70b-instruct` |
| Code generation | DeepSeek Coder | `deepseek-ai/deepseek-coder-6.7b-instruct` |
| Multimodal (text + image) | Google Gemma | Check catalog for latest |
| NVIDIA-optimized | NVIDIA Nemotron | `nvidia/nemotron-4-340b-instruct` |

Always check `https://build.nvidia.com/explore/discover` for the latest available models, pricing, and rate limits.

### Step 4: Handle Responses

- **Non-streaming**: Parse `response.json()["choices"][0]["message"]["content"]`
- **Streaming**: Iterate `response.iter_lines()`, filter `data: ` prefixed lines, stop at `data: [DONE]`
- **Error handling**: Always wrap in try/except. Common HTTP status codes:
  - `400` — Invalid request payload or model name
  - `401` — Missing or invalid API key
  - `429` — Rate limit exceeded (back off and retry)
  - `500` — NVIDIA service error (retry with exponential backoff)

### Step 5: Integrate Into Workflows

This API call can be embedded into:
- **Cron jobs**: Periodic AI-generated reports, summaries, or monitoring alerts
- **Backend routes**: Next.js API routes that proxy requests to NVIDIA NIM
- **Automation scripts**: Batch processing of prompts with results saved to files
- **Chains**: Use the output of one call as input to the next for multi-step reasoning

### Step 6: Save Results

All outputs from NVIDIA NIM API calls should be saved to `/home/z/my-project/download/` or the appropriate project output directory. Never leave results only in terminal output.

## Constraints

- **NEVER** hardcode API keys in source files. Always read from environment variables.
- **NEVER** expose the `NVIDIA_API_KEY` in logs, error messages, or output files.
- **NEVER** use this skill for tasks that can be handled by the built-in z-ai-web-dev-sdk — that SDK is always the first choice for AI completions within this environment.
- **NEVER** make requests to NVIDIA NIM from client-side code (browser). All API calls must go through a backend proxy or server-side script.
- **ALWAYS** respect NVIDIA's rate limits and terms of service.
- **ALWAYS** use streaming (`stream: True`) for long-form generation to avoid timeouts.
- **ALWAYS** set a reasonable `max_tokens` value. Do not request unnecessarily large token counts.
- This skill is for **text generation only**. For image generation, use the built-in `z-ai-web-dev-sdk` image generation tools.

## Examples

### Example 1: Single Prompt — Batch Summarization

```python
import requests, os, json

invoke_url = "https://integrate.api.nvidia.com/v1/chat/completions"

headers = {
    "Authorization": f"Bearer {os.environ['NVIDIA_API_KEY']}",
    "Content-Type": "application/json"
}

articles = [
    "AI adoption in healthcare is accelerating...",
    "New breakthroughs in quantum computing..."
]

results = []
for article in articles:
    payload = {
        "model": "meta/llama-4-maverick-17b-128e-instruct",
        "messages": [
            {"role": "system", "content": "Summarize the following article in 2 sentences."},
            {"role": "user", "content": article}
        ],
        "max_tokens": 128,
        "temperature": 0.3
    }
    resp = requests.post(invoke_url, headers=headers, json=payload)
    summary = resp.json()["choices"][0]["message"]["content"]
    results.append({"article": article[:50], "summary": summary})

with open("/home/z/my-project/download/summaries.json", "w") as f:
    json.dump(results, f, indent=2)

print(f"Saved {len(results)} summaries to download/summaries.json")
```

### Example 2: Streaming Response — Interactive Generation

```python
import requests, os

invoke_url = "https://integrate.api.nvidia.com/v1/chat/completions"

headers = {
    "Authorization": f"Bearer {os.environ['NVIDIA_API_KEY']}",
    "Accept": "text/event-stream",
    "Content-Type": "application/json"
}

payload = {
    "model": "meta/llama-4-maverick-17b-128e-instruct",
    "messages": [
        {"role": "user", "content": "Explain transformer architecture in simple terms."}
    ],
    "max_tokens": 512,
    "temperature": 0.7,
    "stream": True
}

response = requests.post(invoke_url, headers=headers, json=payload, stream=True)

full_text = ""
for line in response.iter_lines():
    if line:
        decoded = line.decode("utf-8")
        if decoded.startswith("data: ") and decoded != "data: [DONE]":
            import json
            chunk = json.loads(decoded[6:])
            delta = chunk["choices"][0].get("delta", {}).get("content", "")
            if delta:
                full_text += delta
                print(delta, end="", flush=True)

print(f"\n\nTotal length: {len(full_text)} characters")
```

### Example 3: Next.js API Route Proxy

```typescript
// app/api/nvidia/route.ts
import { NextRequest, NextResponse } from 'next/server';

export async function POST(req: NextRequest) {
  const { messages, model = 'meta/llama-4-maverick-17b-128e-instruct', max_tokens = 512 } = await req.json();

  const response = await fetch('https://integrate.api.nvidia.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${process.env.NVIDIA_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model,
      messages,
      max_tokens,
      temperature: 0.7,
      stream: false,
    }),
  });

  const data = await response.json();
  return NextResponse.json(data);
}
```
