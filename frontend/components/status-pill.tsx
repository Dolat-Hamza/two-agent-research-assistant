import { Activity, CircleDashed, CircleX } from "lucide-react";
import { cn } from "@/lib/utils";
import type { RunStatus } from "@/components/app-state";

export function StatusPill({ status, className }: { status: RunStatus; className?: string }) {
  if (status === "ready") {
    return (
      <span
        className={cn("inline-flex items-center gap-1.5 text-[11px] font-medium text-ok", className)}
        aria-live="polite"
      >
        <span className="relative inline-flex h-2 w-2 shrink-0">
          <span className="absolute inset-0 animate-ping rounded-full bg-ok/60" />
          <span className="relative inline-flex h-2 w-2 rounded-full bg-ok" />
        </span>
        ready
      </span>
    );
  }

  if (status === "streaming") {
    return (
      <span
        className={cn("inline-flex items-center gap-1.5 text-[11px] font-medium text-warn", className)}
        aria-live="polite"
      >
        <Activity className="h-3.5 w-3.5 animate-pulse-soft" />
        stream active
      </span>
    );
  }

  if (status === "error") {
    return (
      <span
        className={cn("inline-flex items-center gap-1.5 text-[11px] font-medium text-err", className)}
        aria-live="polite"
      >
        <CircleX className="h-3.5 w-3.5" />
        error
      </span>
    );
  }

  // idle
  return (
    <span
      className={cn("inline-flex items-center gap-1.5 text-[11px] font-medium text-dim", className)}
      aria-live="polite"
    >
      <CircleDashed className="h-3.5 w-3.5" />
      idle
    </span>
  );
}
