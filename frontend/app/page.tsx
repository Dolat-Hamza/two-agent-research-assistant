import { AppStateProvider } from "@/components/app-state";
import { ConsoleHeader } from "@/components/console-header";
import { PanelsShell } from "@/components/panels-shell";

export default function Home() {
  return (
    <AppStateProvider>
      {/*
        Viewport-locked shell:
        - h-svh fills the small-viewport-height so mobile chrome bars don't push
          the composer below the fold.
        - overflow-hidden on the outer prevents body scroll; each panel owns
          its own internal scroll.
      */}
      <div className="console-bg flex h-svh flex-col overflow-hidden">
        <ConsoleHeader />
        <main className="flex flex-1 min-h-0 mx-auto w-full max-w-[1600px] flex-col px-4 sm:px-6 lg:px-8 py-3 sm:py-4 lg:py-5">
          <PanelsShell />
        </main>
      </div>
    </AppStateProvider>
  );
}
