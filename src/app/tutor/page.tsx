import { Suspense } from "react";
import { TutorChatWorkspace } from "@/components/tutor/TutorChatWorkspace";

export default function TutorPage() {
  return (
    <Suspense
      fallback={
        <div className="p-6 text-sm font-bold text-[var(--ink-secondary)]">
          Memuat ruang Tutor AI...
        </div>
      }
    >
      <TutorChatWorkspace />
    </Suspense>
  );
}
