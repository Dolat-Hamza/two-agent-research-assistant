"use client";

import { useCallback, useRef } from "react";
import { AGENT_URL } from "@/lib/env";
import type { AnyAgentEvent, PlannerRequest } from "@/lib/agui-types";

/**
 * AG-UI SSE client.
 *
 * Posts to AGENT_URL with the documented planner request body, then parses
 * the `event: <type>\ndata: <json>\n\n` stream and forwards each frame to
 * the supplied onEvent callback.
 *
 * Why fetch + ReadableStream instead of `EventSource`:
 *   - EventSource only supports GET; the planner contract is POST.
 *   - We need to pass the full thread/messages body, so fetch + manual
 *     parsing is the standard pattern (same approach CopilotKit uses).
 */

type Handlers = {
  onEvent: (ev: AnyAgentEvent) => void;
  onError?: (err: Error) => void;
  onDone?: () => void;
};

export function useAgentStream() {
  // Track the in-flight request so we can cancel a run.
  const controllerRef = useRef<AbortController | null>(null);

  const send = useCallback(
    async (body: PlannerRequest, h: Handlers) => {
      // Cancel any previous in-flight run first.
      controllerRef.current?.abort();
      const controller = new AbortController();
      controllerRef.current = controller;

      try {
        const resp = await fetch(AGENT_URL, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Accept: "text/event-stream",
          },
          body: JSON.stringify(body),
          signal: controller.signal,
        });

        if (!resp.ok || !resp.body) {
          throw new Error(`Planner returned ${resp.status} ${resp.statusText}`);
        }

        const reader = resp.body.getReader();
        const decoder = new TextDecoder();
        let buffer = "";

        // Stream loop — parse SSE frames as they arrive.
        while (true) {
          const { value, done } = await reader.read();
          if (done) break;

          buffer += decoder.decode(value, { stream: true });

          // SSE frames are separated by double-newline.
          let frameEnd: number;
          while ((frameEnd = buffer.indexOf("\n\n")) !== -1) {
            const frame = buffer.slice(0, frameEnd);
            buffer = buffer.slice(frameEnd + 2);
            const parsed = parseSseFrame(frame);
            if (parsed) h.onEvent(parsed);
          }
        }
        h.onDone?.();
      } catch (err) {
        if ((err as Error).name === "AbortError") return; // user cancelled — not an error
        h.onError?.(err as Error);
      } finally {
        if (controllerRef.current === controller) controllerRef.current = null;
      }
    },
    [],
  );

  const cancel = useCallback(() => {
    controllerRef.current?.abort();
    controllerRef.current = null;
  }, []);

  return { send, cancel };
}

/**
 * Parse one SSE frame into a typed AG-UI event.
 *   event: STATE_DELTA
 *   data: {"active_agent":"search","step":"searching…","tool_calls":[…]}
 */
function parseSseFrame(frame: string): AnyAgentEvent | null {
  // Normalise CRLF (real servers) and CR-only to LF so the split below works.
  const lines = frame.replace(/\r\n?/g, "\n").split("\n");
  let event = "";
  let data = "";
  for (const line of lines) {
    if (line.startsWith("event:")) event = line.slice(6).trim();
    else if (line.startsWith("data:")) data += line.slice(5).trim();
  }
  if (!event || !data) return null;
  try {
    return { type: event as AnyAgentEvent["type"], data: JSON.parse(data) } as AnyAgentEvent;
  } catch {
    return null;
  }
}
