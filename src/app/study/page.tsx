import React, { Suspense } from "react";
import { FocusTunnelWorkspace } from "@/components/study/FocusTunnelWorkspace";

export default function StudyPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center bg-[var(--surface-canvas)] text-sm font-mono-telemetry text-[var(--ink-secondary)]">
          Menyiapkan Focus Tunnel...
        </div>
      }
    >
      <FocusTunnelWorkspace />
    </Suspense>
  );
}
