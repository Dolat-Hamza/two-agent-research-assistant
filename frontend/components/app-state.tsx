"use client";

import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useRef,
  useState,
} from "react";
import { useAgentStream } from "@/hooks/use-agent-stream";
import { friendlyStep } from "@/lib/mock-data";
import type {
  AgentEvent,
  AgentName,
  AnyAgentEvent,
  ChatMessage,
  PlannerMessage,
  SearchResult,
  ToolCall,
} from "@/lib/agui-types";

export type RunStatus = "idle" | "ready" | "streaming" | "error";

export type AppState = {
  status: RunStatus;
  activeAgent: AgentName;
  step: string;
  toolCalls: ToolCall[];
  events: AgentEvent[];
  messages: ChatMessage[];
  threadId: string;
  errorMessage?: string;
  sendMessage: (text: string) => void;
  cancelRun: () => void;
  clearThread: () => void;
};

const AppStateContext = createContext<AppState | null>(null);

function newId(prefix: string) {
  return `${prefix}_${Math.random().toString(36).slice(2, 10)}`;
}

function fmtTs(): string {
  const d = new Date();
  const p = (n: number) => String(n).padStart(2, "0");
  return `${p(d.getHours())}:${p(d.getMinutes())}:${p(d.getSeconds())}`;
}

function agentTagFor(active: AgentName): "planner" | "search" | undefined {
  if (active === "planner") return "planner";
  if (active === "search") return "search";
  return undefined;
}

export function AppStateProvider({ children }: { children: React.ReactNode }) {
  const [status, setStatus] = useState<RunStatus>("ready");
  const [activeAgent, setActiveAgent] = useState<AgentName>("idle");
  const [step, setStep] = useState<string>("idle");
  const [toolCalls, setToolCalls] = useState<ToolCall[]>([]);
  const [events, setEvents] = useState<AgentEvent[]>([]);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [errorMessage, setErrorMessage] = useState<string | undefined>();
  // Lives in state so clearThread can rotate it — without that, "New chat"
  // resets the UI but the planner still resumes the prior conversation.
  // threadId is never rendered, only sent in the request body, so a
  // server/client mismatch from Math.random doesn't cause a hydration error.
  const [threadId, setThreadId] = useState<string>(() => newId("thr"));
  const assistantMsgIdRef = useRef<string | null>(null);
  // Tool calls land before the assistant message exists, so buffer them and
  // attach to the assistant bubble when TEXT_MESSAGE_START fires.
  const pendingToolRef = useRef<{ name: string; query: string; results?: SearchResult[] } | null>(
    null,
  );

  const { send, cancel } = useAgentStream();

  const appendEvent = useCallback((ev: AgentEvent) => {
    setEvents((prev) => [...prev, ev]);
  }, []);

  const handleEvent = useCallback(
    (e: AnyAgentEvent, ctx: { currentActive: { value: AgentName } }) => {
      switch (e.type) {
        case "RUN_STARTED": {
          appendEvent({
            id: newId("e"),
            ts: fmtTs(),
            type: e.type,
            title: "Run started",
            detail: `run_id=${e.data.run_id}`,
            agent: "planner",
          });
          break;
        }
        case "STEP_STARTED": {
          appendEvent({
            id: newId("e"),
            ts: fmtTs(),
            type: e.type,
            title: e.data.name,
            agent: agentTagFor(ctx.currentActive.value),
          });
          break;
        }
        case "STEP_FINISHED": {
          appendEvent({
            id: newId("e"),
            ts: fmtTs(),
            type: e.type,
            title: `${e.data.name} ✓`,
            agent: agentTagFor(ctx.currentActive.value),
          });
          break;
        }
        case "STATE_DELTA": {
          ctx.currentActive.value = e.data.active_agent;
          setActiveAgent(e.data.active_agent);
          setStep(friendlyStep(e.data.step));
          setToolCalls(e.data.tool_calls ?? []);
          appendEvent({
            id: newId("e"),
            ts: fmtTs(),
            type: e.type,
            title: `${e.data.active_agent} · ${friendlyStep(e.data.step)}`,
            agent: agentTagFor(e.data.active_agent),
          });
          break;
        }
        case "TOOL_CALL_START": {
          const args = (e.data.arguments as { query?: string }) ?? {};
          // Buffer the call so the assistant bubble (created later by
          // TEXT_MESSAGE_START) can render the expandable tool-call card.
          pendingToolRef.current = {
            name: e.data.tool_name,
            query: String(args.query ?? ""),
          };
          appendEvent({
            id: newId("e"),
            ts: fmtTs(),
            type: e.type,
            title: `${e.data.tool_name}()`,
            detail: args.query ? `"${args.query}"` : undefined,
            agent: "search",
          });
          break;
        }
        case "TOOL_CALL_END": {
          const results = e.data.result?.results ?? [];
          if (pendingToolRef.current) {
            pendingToolRef.current.results = results;
          }
          appendEvent({
            id: newId("e"),
            ts: fmtTs(),
            type: e.type,
            title: "tool returned",
            detail: `${results.length} result${results.length === 1 ? "" : "s"}`,
            agent: "search",
          });
          break;
        }
        case "TEXT_MESSAGE_START": {
          const id = newId("m");
          assistantMsgIdRef.current = id;
          const tool = pendingToolRef.current;
          pendingToolRef.current = null;
          setMessages((prev) => [
            ...prev,
            {
              id,
              role: "assistant",
              agent: "planner",
              content: "",
              streaming: true,
              tool:
                tool && tool.results
                  ? { name: tool.name, query: tool.query, results: tool.results }
                  : undefined,
            },
          ]);
          appendEvent({
            id: newId("e"),
            ts: fmtTs(),
            type: e.type,
            title: "assistant message open",
            agent: "planner",
          });
          break;
        }
        case "TEXT_MESSAGE_CONTENT": {
          const id = assistantMsgIdRef.current;
          if (!id) break;
          setMessages((prev) =>
            prev.map((m) =>
              m.id === id && m.role === "assistant"
                ? { ...m, content: m.content + e.data.delta }
                : m,
            ),
          );
          break;
        }
        case "TEXT_MESSAGE_END": {
          const id = assistantMsgIdRef.current;
          if (id) {
            setMessages((prev) =>
              prev.map((m) =>
                m.id === id && m.role === "assistant" ? { ...m, streaming: false } : m,
              ),
            );
          }
          appendEvent({
            id: newId("e"),
            ts: fmtTs(),
            type: e.type,
            title: "assistant message closed",
            agent: "planner",
          });
          break;
        }
        case "RUN_FINISHED": {
          appendEvent({
            id: newId("e"),
            ts: fmtTs(),
            type: e.type,
            title: "Run finished",
            agent: "planner",
          });
          break;
        }
        case "RUN_ERROR": {
          setErrorMessage(e.data.message);
          appendEvent({
            id: newId("e"),
            ts: fmtTs(),
            type: e.type,
            title: "Run error",
            detail: e.data.message,
            agent: "planner",
          });
          break;
        }
      }
    },
    [appendEvent],
  );

  const sendMessage = useCallback(
    (text: string) => {
      if (!text.trim() || status === "streaming") return;

      // Reset transient state for a clean run, then append the user message.
      // Note: events are NOT cleared here — they accumulate across turns in
      // the same thread so the activity log shows the whole conversation's
      // history. Use "New chat" / clearThread to wipe.
      setErrorMessage(undefined);
      setStatus("streaming");
      setActiveAgent("idle");
      setStep("starting…");
      setToolCalls([]);
      assistantMsgIdRef.current = null;
      pendingToolRef.current = null;

      const userMsg: ChatMessage = { id: newId("m"), role: "user", content: text };
      const nextMessages = [...messages, userMsg];
      setMessages(nextMessages);

      // Build the planner request body from the full conversation.
      // TODO(B3-integration): assistant turns carry a `tool` field with the
      // search results that produced them. Once the real Planner Agent lands,
      // decide with backend whether tool context should be folded into prior
      // assistant `content`, sent as a separate field, or re-fetched server-side.
      const planner: PlannerMessage[] = nextMessages.map((m) => ({
        role: m.role,
        content: m.content,
      }));

      // Local context object so STATE_DELTA can pass the latest active agent
      // through to subsequent STEP_* events without round-tripping React state.
      const ctx = { currentActive: { value: "idle" as AgentName } };

      void send(
        { thread_id: threadId, messages: planner },
        {
          onEvent: (e) => handleEvent(e, ctx),
          onError: (err) => {
            setStatus("error");
            setErrorMessage(err.message);
            setActiveAgent("idle");
          },
          onDone: () => {
            setStatus("ready");
            setActiveAgent("idle");
            setStep("idle");
          },
        },
      );
    },
    [messages, status, threadId, send, handleEvent],
  );

  const cancelRun = useCallback(() => {
    cancel();
    setStatus("ready");
    setActiveAgent("idle");
    setStep("cancelled");
    // Finalize any streaming assistant bubble so the UI stops blinking.
    const id = assistantMsgIdRef.current;
    if (id) {
      setMessages((prev) =>
        prev.map((m) =>
          m.id === id && m.role === "assistant" ? { ...m, streaming: false } : m,
        ),
      );
    }
  }, [cancel]);

  const clearThread = useCallback(() => {
    cancel();
    setMessages([]);
    setEvents([]);
    setToolCalls([]);
    setActiveAgent("idle");
    setStep("idle");
    setStatus("ready");
    setErrorMessage(undefined);
    // Rotate threadId so the planner treats the next message as a fresh
    // conversation rather than resuming the old context.
    setThreadId(newId("thr"));
    assistantMsgIdRef.current = null;
  }, [cancel]);

  const value = useMemo<AppState>(
    () => ({
      status,
      activeAgent,
      step,
      toolCalls,
      events,
      messages,
      threadId,
      errorMessage,
      sendMessage,
      cancelRun,
      clearThread,
    }),
    [status, activeAgent, step, toolCalls, events, messages, threadId, errorMessage, sendMessage, cancelRun, clearThread],
  );

  return <AppStateContext.Provider value={value}>{children}</AppStateContext.Provider>;
}

export function useAppState() {
  const ctx = useContext(AppStateContext);
  if (!ctx) throw new Error("useAppState must be used inside AppStateProvider");
  return ctx;
}
