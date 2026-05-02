# MCP Builder

## Context

Use this skill when the user wants to build a Model Context Protocol (MCP) server. MCP servers expose tools, resources, and prompts that AI agents can invoke. This skill covers the full lifecycle from planning through evaluation.

**Trigger phrases:** "build an MCP server," "create an MCP tool," "MCP integration," "add MCP support."

---

## Instructions

### Phase 1: Research & Planning

1. **Clarify scope.** Identify every tool the server will expose. For each tool, document:
   - Tool name (lowercase snake_case)
   - One-sentence description
   - Required input parameters with types
   - Expected output shape
   - Whether the tool is read-only, destructive, or idempotent

2. **Choose language and runtime:**
   - **TypeScript:** Use `@modelcontextprotocol/sdk`. Best for complex servers, HTTP transport, existing Node ecosystems.
   - **Python:** Use `fastmcp` library. Best for data pipelines, scripts, rapid prototyping.

3. **Choose transport:**
   - **stdio:** Default for local CLI usage. The MCP client launches the server as a subprocess.
   - **HTTP (Streamable):** For remote or multi-client deployments. Requires `express` or similar in TypeScript.

4. **Design input/output schemas** using JSON Schema. Every parameter must have a `type`, `description`, and appropriate constraints (`enum`, `minLength`, `pattern`, etc.).

### Phase 2: Implementation

5. **Initialize the project:**
   ```
   // TypeScript
   mkdir my-mcp-server && cd my-mcp-server
   npm init -y && npm install @modelcontextprotocol/sdk zod

   // Python
   mkdir my-mcp-server && cd my-mcp-server
   pip install fastmcp
   ```

6. **Create project structure:**
   ```
   src/
     index.ts          # Entry point, server bootstrap
     tools/
       tool-name.ts    # One file per tool
     schemas/
       tool-name.ts    # Zod/JSON Schema definitions
   package.json
   tsconfig.json
   ```

7. **Register tools** with proper annotations:
   ```typescript
   server.tool(
     "tool_name",
     "Description of what the tool does",
     { param1: z.string().describe("Param description") },
     async ({ param1 }) => {
       return { content: [{ type: "text", text: "Result" }] };
     },
     {
       readOnlyHint: true,        // Does not modify state
       destructiveHint: false,    // Cannot cause irreversible damage
       idempotentHint: true,      // Same input = same output
     }
   );
   ```

8. **Implement error handling.** Return structured error messages:
   ```typescript
   return {
     content: [{ type: "text", text: `Error: ${message}` }],
     isError: true,
   };
   ```

9. **Add resources** for static data the client can read (optional).
10. **Add prompts** for reusable prompt templates the client can invoke (optional).

### Phase 3: Review & Testing

11. **Lint and type-check:** Run `tsc --noEmit` (TypeScript) or `mypy` (Python).
12. **Test with MCP Inspector:**
    ```bash
    npx @modelcontextprotocol/inspector node dist/index.js
    ```
    Verify each tool returns correct output for valid and invalid inputs.
13. **Test edge cases:** empty inputs, missing required fields, very large payloads.
14. **Validate schemas** match the JSON Schema spec using a schema validator.

### Phase 4: Evaluation

15. **Run the evaluation checklist:**
    - [ ] All tools registered with correct annotations
    - [ ] Input schemas have descriptions for every parameter
    - [ ] Output follows `{ content: [{ type: "text", text: "..." }] }` format
    - [ ] Errors use `isError: true` and descriptive messages
    - [ ] Transport works on both stdio and HTTP (if applicable)
    - [ ] No hardcoded secrets; use environment variables
    - [ ] MCP Inspector passes all manual tests

---

## Constraints

- Every tool MUST have a `description` and annotated hints (`readOnlyHint`, `destructiveHint`, `idempotentHint`).
- Tool names MUST be lowercase snake_case, max 64 characters.
- Input schemas MUST use JSON Schema format (Zod is acceptable as a builder).
- Output MUST use the MCP `content` array format. Never return raw strings.
- Errors MUST use `isError: true`. Never throw unhandled exceptions to the client.
- NEVER expose destructive operations without `destructiveHint: true`.
- NEVER hardcode API keys, tokens, or secrets. Always read from environment variables.
- TypeScript servers MUST compile cleanly with `strict: true` in tsconfig.
- Python servers MUST type-hint all tool functions.

---

## Examples

### Example 1: Weather MCP Server (TypeScript)

```
Server: weather-mcp
Transport: stdio
Tools:
  - get_weather (readOnly: true, destructive: false, idempotent: true)
    Input: { city: string, units?: "celsius" | "fahrenheit" }
    Output: { content: [{ type: "text", text: "Paris: 22C, Partly Cloudy" }] }

  - get_forecast (readOnly: true, destructive: false, idempotent: true)
    Input: { city: string, days: number (1-7) }
    Output: { content: [{ type: "text", text: JSON.stringify(forecastData) }] }
```

### Example 2: File Operations MCP Server (Python)

```
Server: file-ops-mcp
Transport: HTTP (Streamable)
Tools:
  - read_file (readOnly: true, destructive: false, idempotent: true)
    Input: { path: string }
    Output: File contents as text

  - write_file (readOnly: false, destructive: true, idempotent: true)
    Input: { path: string, content: string }
    Output: Confirmation message

  - list_directory (readOnly: true, destructive: false, idempotent: true)
    Input: { path: string }
    Output: JSON array of file entries
```
