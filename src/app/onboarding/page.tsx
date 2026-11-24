import type { Metadata } from "next";
import { OnboardingWorkspace } from "@/components/onboarding/OnboardingWorkspace";

export const metadata: Metadata = {
  title: "Kalibrasi Belajar Awal | Rasionalin",
  description:
    "Kenali kondisi belajarmu dalam 3 menit agar Rasionalin dan Tutor AI menyesuaikan tempo, gaya bahasa, dan jalur materi SNBT.",
};

export default function OnboardingPage() {
  return <OnboardingWorkspace />;
}
