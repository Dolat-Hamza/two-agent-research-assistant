"use client";

import type { AgentEvent } from "@/lib/agui-types";
import { EVENT_COLOR } from "@/lib/mock-data";
import { cn } from "@/lib/utils";

export function EventLog({ events }: { events: AgentEvent[] }) {
  const lastIndex = events.length - 1;
  return (
    <ol className="space-y-2 px-3 sm:px-4 pb-4" aria-label="Agent event log">
      {events.map((e, i) => (
        <EventRow key={e.id} event={e} last={i === lastIndex} />
      ))}
    </ol>
  );
}

function EventRow({ event, last }: { event: AgentEvent; last: boolean }) {
  const color = EVENT_COLOR[event.type];
  return (
    <li className="relative grid grid-cols-[auto_1fr] gap-x-3 animate-fade-up">
      {/* Rail with dot */}
      <div className="relative flex flex-col items-center pt-1.5">
        <span className={cn("h-1.5 w-1.5 rounded-full ring-2 ring-background", color, "bg-current")} />
        {!last && <span className="mt-0.5 w-px flex-1 bg-line/80" aria-hidden />}
      </div>

      {/* Body */}
      <div className="min-w-0 pb-2">
        <div className="flex items-baseline gap-2 text-[11px]">
          <span className="text-dim font-mono">{event.ts}</span>
          <span className={cn("font-mono font-medium tracking-wider", color)}>{event.type}</span>
        </div>
        <div className="text-[12.5px] text-foreground leading-snug mt-0.5">{event.title}</div>
        {event.detail && (
          <div className="text-[11.5px] text-muted leading-snug font-mono mt-0.5 truncate">{event.detail}</div>
        )}
      </div>
    </li>
  );
}
