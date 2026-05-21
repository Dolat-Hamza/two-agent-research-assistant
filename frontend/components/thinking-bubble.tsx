"use client";

import { useAppState } from "@/components/app-state";
import { cn } from "@/lib/utils";

/**
 * Pre-message "thinking" placeholder, in the spirit of Claude / ChatGPT.
 * Shown while the run is in progress but the assistant message hasn't
 * started streaming yet (i.e. between RUN_STARTED and TEXT_MESSAGE_START).
 *
 * Reads the live step label from app state so the dots are accompanied by
 * the current human-readable activity ("thinking…", "searching the web…",
 * "writing answer…").
 */
export function ThinkingBubble() {
  const { activeAgent, step } = useAppState();

  const agentLabel =
    activeAgent === "search" ? "search" : activeAgent === "planner" ? "planner" : "agent";

  // Match the protocol-coded colors used in agent-flow.tsx so the avatar
  // tint stays consistent as the active agent swaps.
  const tone =
    activeAgent === "search"
      ? "text-a2a"
      : activeAgent === "planner"
        ? "text-agui"
        : "text-accent";

  return (
    <div className="flex gap-3 animate-fade-up">
      <div
        className={cn(
          "mt-0.5 grid h-7 w-7 shrink-0 place-items-center rounded-full bg-panel-2 ring-1 ring-line text-[10.5px] font-semibold",
          tone,
        )}
      >
        {activeAgent === "search" ? "SE" : "PL"}
      </div>
      <div className="min-w-0 flex-1 space-y-1.5 pt-0.5">
        <div className="text-[11px] text-muted">
          <span>{agentLabel}.agent</span>
        </div>
        <div className="flex items-center gap-2 text-[13.5px] text-muted">
          <span className="lowercase">{step || "thinking…"}</span>
          <span className="inline-flex items-center gap-1" aria-hidden>
            <Dot delay={0} />
            <Dot delay={140} />
            <Dot delay={280} />
          </span>
        </div>
      </div>
    </div>
  );
}

function Dot({ delay }: { delay: number }) {
  return (
    <span
      className="inline-block h-1 w-1 rounded-full bg-current animate-pulse-soft"
      style={{ animationDelay: `${delay}ms` }}
    />
  );
}
