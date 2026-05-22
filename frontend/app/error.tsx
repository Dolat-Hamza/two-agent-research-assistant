"use client";

import { useEffect } from "react";
import { AlertTriangle, RotateCcw } from "lucide-react";

/**
 * App-level error boundary. Next.js routes uncaught render-time errors here
 * so a single throw can't leave the user with a blank tab. The reset() call
 * remounts the route subtree.
 */
export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Surface in devtools so the developer sees the trace, not just the UI fallback.
    console.error("[error-boundary]", error);
  }, [error]);

  return (
    <div className="flex min-h-svh items-center justify-center bg-background p-6">
      <div
        role="alert"
        className="w-full max-w-md rounded-lg bg-panel ring-1 ring-line p-5 space-y-4"
      >
        <div className="flex items-center gap-2 text-err">
          <AlertTriangle className="h-4 w-4 shrink-0" />
          <span className="text-[14px] font-medium">Something broke</span>
        </div>
        <p className="text-[12.5px] text-muted leading-relaxed">
          The console hit an unexpected error and stopped rendering. Try resetting; if
          the problem persists, check the browser console for the stack trace.
        </p>
        {error.message && (
          <pre className="rounded-md bg-panel-2 ring-1 ring-line p-3 text-[11.5px] text-foreground/90 whitespace-pre-wrap break-words font-mono">
            {error.message}
          </pre>
        )}
        <button
          type="button"
          onClick={reset}
          className="inline-flex items-center gap-1.5 rounded-md ring-1 ring-line bg-panel-2 px-3 py-1.5 text-[12px] text-foreground hover:ring-accent/40 transition-colors"
        >
          <RotateCcw className="h-3.5 w-3.5" />
          Reset
        </button>
      </div>
    </div>
  );
}
