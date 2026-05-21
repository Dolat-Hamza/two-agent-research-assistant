"use client";

import { useState } from "react";
import { MessageSquare, Activity } from "lucide-react";
import { ChatPanel } from "@/components/chat-panel";
import { ActivityPanel } from "@/components/activity-panel";
import { useAppState } from "@/components/app-state";
import { cn } from "@/lib/utils";

type Tab = "chat" | "activity";

/**
 * Flex layout — no calc heights. The parent <main> already sits inside a
 * viewport-locked shell (h-svh + overflow-hidden), so we just take all the
 * remaining space with flex-1 and let each panel own its internal scroll.
 */
export function PanelsShell() {
  const [tab, setTab] = useState<Tab>("chat");
  const { events, status } = useAppState();

  return (
    <>
      {/* Mobile / tablet tab bar — hidden on lg+ where both panels show */}
      <div
        role="tablist"
        aria-label="Workspace panels"
        className="lg:hidden mb-3 flex items-center gap-1 rounded-md ring-1 ring-line bg-panel-2/70 p-1"
      >
        <TabButton
          isActive={tab === "chat"}
          onClick={() => setTab("chat")}
          icon={<MessageSquare className="h-3.5 w-3.5" />}
          label="Chat"
          badge={status === "streaming" ? "·" : undefined}
        />
        <TabButton
          isActive={tab === "activity"}
          onClick={() => setTab("activity")}
          icon={<Activity className="h-3.5 w-3.5" />}
          label="Activity"
          badge={events.length > 0 ? String(events.length) : undefined}
        />
      </div>

      <div
        className="
          grid flex-1 min-h-0 gap-3 sm:gap-4
          grid-cols-1 lg:grid-cols-[minmax(0,1.35fr)_minmax(0,1fr)]
        "
      >
        <div className={cn("min-h-0", tab === "chat" ? "block" : "hidden", "lg:block")}>
          <ChatPanel />
        </div>
        <div className={cn("min-h-0", tab === "activity" ? "block" : "hidden", "lg:block")}>
          <ActivityPanel />
        </div>
      </div>
    </>
  );
}

function TabButton({
  isActive,
  onClick,
  icon,
  label,
  badge,
}: {
  isActive: boolean;
  onClick: () => void;
  icon: React.ReactNode;
  label: string;
  badge?: string;
}) {
  return (
    <button
      role="tab"
      aria-selected={isActive}
      onClick={onClick}
      className={cn(
        "flex flex-1 items-center justify-center gap-2 rounded px-3 py-1.5 text-[12px] font-medium transition-colors",
        isActive
          ? "bg-panel text-foreground ring-1 ring-line"
          : "text-muted hover:text-foreground",
      )}
    >
      {icon}
      <span>{label}</span>
      {badge && (
        <span className="ml-1 inline-flex h-4 min-w-4 items-center justify-center rounded-full bg-line px-1 text-[10px] text-foreground/80">
          {badge}
        </span>
      )}
    </button>
  );
}
