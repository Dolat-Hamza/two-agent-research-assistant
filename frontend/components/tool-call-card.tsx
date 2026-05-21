"use client";

import { useState } from "react";
import { ChevronDown, Loader2, Wrench, CheckCircle2 } from "lucide-react";
import { cn } from "@/lib/utils";
import type { SearchResult } from "@/lib/agui-types";

export function ToolCallCard({
  name,
  query,
  status = "done",
  results,
  defaultOpen = true,
}: {
  name: string;
  query: string;
  status?: "running" | "done" | "error";
  results?: SearchResult[];
  defaultOpen?: boolean;
}) {
  const [open, setOpen] = useState(defaultOpen);
  const trimmed = query.length > 28 ? query.slice(0, 28) + "…" : query;

  return (
    <div className="rounded-md ring-1 ring-line bg-panel-2/60 text-[13px] overflow-hidden">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        title={query}
        className="flex w-full items-center gap-2 px-3 py-2 text-left hover:bg-panel transition-colors"
        aria-expanded={open}
      >
        {status === "running" ? (
          <Loader2 className="h-3.5 w-3.5 animate-spin text-mcp" />
        ) : status === "error" ? (
          <span className="h-1.5 w-1.5 rounded-full bg-err" />
        ) : (
          <CheckCircle2 className="h-3.5 w-3.5 text-mcp" />
        )}
        <Wrench className="h-3.5 w-3.5 text-muted" />
        <span className="text-muted text-[11px] uppercase tracking-wider">tool</span>
        <span className="font-medium text-mcp">{name}</span>
        <span className="text-dim">·</span>
        <span className="text-muted truncate">&quot;{trimmed}&quot;</span>
        {results && (
          <span className="ml-auto text-[11px] text-dim">{results.length} result{results.length === 1 ? "" : "s"}</span>
        )}
        <ChevronDown
          className={cn(
            "h-4 w-4 text-dim transition-transform",
            open && "rotate-180",
            !results && "ml-auto",
          )}
        />
      </button>

      {open && results && (
        <div className="divide-y divide-line/70 border-t border-line/70">
          {results.map((r) => (
            <div key={r.url} className="px-3 py-2.5 hover:bg-panel/60 transition-colors">
              <div className="text-foreground text-[13px] leading-snug">{r.title}</div>
              <a
                href="#"
                onClick={(e) => e.preventDefault()}
                className="text-[11px] text-mcp/90 hover:text-mcp underline-offset-2 hover:underline break-all"
              >
                {r.url}
              </a>
              <div className="mt-1 text-[12px] text-muted leading-snug">{r.snippet}</div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
