"use client";

import { ProtocolPill } from "@/components/protocol-pill";
import { StatusPill } from "@/components/status-pill";
import { ThemeToggle } from "@/components/theme-toggle";
import { useAppState } from "@/components/app-state";

const PILLS = ["MCP", "A2A", "AG-UI", "CopilotKit"] as const;

export function ConsoleHeader() {
  const { status } = useAppState();

  return (
    <header className="sticky top-0 z-30 border-b border-line bg-background/85 backdrop-blur supports-[backdrop-filter]:bg-background/65">
      <div className="mx-auto flex h-12 max-w-[1600px] items-center gap-3 px-4 sm:px-6 lg:px-8">
        {/* Brand */}
        <div className="flex items-center gap-2 min-w-0">
          <span className="flex items-baseline gap-1.5 min-w-0">
            <span className="font-semibold tracking-tight text-foreground">Mobiz</span>
            <span className="hidden sm:inline text-[11px] text-dim truncate">
              · Agent Research Console
            </span>
          </span>
        </div>

        {/* Protocol pills */}
        <div className="mobile-pill-fade ml-1 flex flex-1 items-center gap-1.5 overflow-x-auto md:ml-2 md:justify-center md:overflow-visible">
          {PILLS.map((pill) => (
            <ProtocolPill key={pill} name={pill} />
          ))}
        </div>

        {/* Right cluster */}
        <div className="ml-auto flex items-center gap-3">
          <StatusPill status={status} />
          <span className="hidden h-4 w-px bg-line sm:block" />
          <ThemeToggle />
        </div>
      </div>
    </header>
  );
}
