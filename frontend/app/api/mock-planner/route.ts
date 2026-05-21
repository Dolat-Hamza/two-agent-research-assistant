/**
 * Mock Planner Agent.
 *
 * Emits the AG-UI event sequence documented in contracts/README.md so the
 * frontend's full F2 / F3 wiring can be validated locally before B3 ships.
 * Once the real Planner Agent is running, point NEXT_PUBLIC_AGENT_URL at
 * /api/agent (or directly at http://localhost:8000/agent) and this file
 * becomes a fallback.
 */

import type { PlannerRequest } from "@/lib/agui-types";

export const runtime = "nodejs";

function sseFrame(event: string, data: unknown): string {
  return `event: ${event}\ndata: ${JSON.stringify(data)}\n\n`;
}

const ANSWER_PARAGRAPHS = [
  "Three open protocols dominate the current agent stack. MCP (Anthropic) standardises how an agent calls tools and reads external data — it ships in Claude, Cursor, and our own ServiceNow / Slack integrations.",
  "A2A (Google → Linux Foundation) gives every agent an Agent Card at /.well-known/agent-card.json and a JSON-RPC task lifecycle, so one agent can delegate to another regardless of framework.",
  "AG-UI (CopilotKit) is the streaming event protocol between the agent backend and a frontend. Sixteen event types: RUN_*, STEP_*, STATE_DELTA, TOOL_CALL_*, TEXT_MESSAGE_*. It is how the tokens you are reading right now reach your screen.",
];

export async function POST(req: Request) {
  const body = (await req.json()) as PlannerRequest;
  const lastUserMessage = [...(body.messages ?? [])].reverse().find((m) => m.role === "user");
  const query = lastUserMessage?.content?.trim() || "AI agent protocols";

  const encoder = new TextEncoder();
  const runId = `run_${Math.random().toString(36).slice(2, 10)}`;
  const toolCallId = `call_${Math.random().toString(36).slice(2, 10)}`;
  const messageId = `msg_${Math.random().toString(36).slice(2, 10)}`;

  const stream = new ReadableStream({
    async start(controller) {
      const send = (event: string, data: unknown) =>
        controller.enqueue(encoder.encode(sseFrame(event, data)));
      const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

      try {
        send("RUN_STARTED", { run_id: runId, thread_id: body.thread_id });
        await sleep(120);

        send("STEP_STARTED", { name: "Decomposing question" });
        send("STATE_DELTA", {
          active_agent: "planner",
          step: "thinking…",
          tool_calls: [],
        });
        await sleep(500);

        send("STEP_FINISHED", { name: "Decomposing question" });
        send("STEP_STARTED", { name: "Delegating to Search Agent (A2A)" });
        send("STATE_DELTA", {
          active_agent: "search",
          step: "preparing search…",
          tool_calls: [
            { id: toolCallId, name: "web_search", status: "running", query, resultsCount: null },
          ],
        });
        await sleep(400);

        send("TOOL_CALL_START", {
          tool_call_id: toolCallId,
          tool_name: "web_search",
          arguments: { query },
        });
        send("STATE_DELTA", {
          active_agent: "search",
          step: "searching the web…",
          tool_calls: [
            { id: toolCallId, name: "web_search", status: "running", query, resultsCount: null },
          ],
        });
        await sleep(900);

        const results = [
          {
            title: "AG-UI Protocol — Agent–User Interaction over SSE",
            url: "docs.ag-ui.com",
            snippet:
              "16 standard event types for streaming agent runs to a frontend. First-party support in LangGraph, CrewAI, Google ADK, Mastra.",
          },
          {
            title: "A2A specification — Linux Foundation",
            url: "google.github.io/A2A",
            snippet:
              "Agent Card discovery + task lifecycle (submitted → working → completed). Adopted by Salesforce, SAP, ServiceNow, Deutsche Bank.",
          },
          {
            title: "Model Context Protocol — modelcontextprotocol.io",
            url: "modelcontextprotocol.io",
            snippet:
              "Open standard from Anthropic for connecting AI models to tools, resources, and prompts. HTTP/SSE or stdio transport.",
          },
        ];

        send("TOOL_CALL_END", {
          tool_call_id: toolCallId,
          tool_name: "web_search",
          result: { results },
        });
        send("STATE_DELTA", {
          active_agent: "search",
          step: "search complete",
          tool_calls: [
            { id: toolCallId, name: "web_search", status: "done", query, resultsCount: results.length },
          ],
        });
        await sleep(180);

        send("STEP_FINISHED", { name: "Delegating to Search Agent (A2A)" });
        send("STATE_DELTA", {
          active_agent: "planner",
          step: "writing answer…",
          tool_calls: [
            { id: toolCallId, name: "web_search", status: "done", query, resultsCount: results.length },
          ],
        });
        await sleep(220);

        send("TEXT_MESSAGE_START", { message_id: messageId, role: "assistant" });
        const text = ANSWER_PARAGRAPHS.join("\n\n");
        // Stream as small chunks (~3 chars) so the typing cadence is visible.
        for (let i = 0; i < text.length; i += 3) {
          send("TEXT_MESSAGE_CONTENT", { message_id: messageId, delta: text.slice(i, i + 3) });
          await sleep(14);
        }
        send("TEXT_MESSAGE_END", { message_id: messageId });

        send("STATE_DELTA", {
          active_agent: "idle",
          step: "done",
          tool_calls: [
            { id: toolCallId, name: "web_search", status: "done", query, resultsCount: results.length },
          ],
        });
        send("RUN_FINISHED", { run_id: runId });
      } catch (err) {
        send("RUN_ERROR", { message: (err as Error).message || "Unknown error" });
      } finally {
        controller.close();
      }
    },
  });

  return new Response(stream, {
    status: 200,
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache, no-transform",
      Connection: "keep-alive",
      "X-Accel-Buffering": "no",
    },
  });
}
