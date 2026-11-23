import type { Metadata } from "next";
import { NeuralCortexWorkspace } from "@/components/neural/NeuralCortexWorkspace";

export const metadata: Metadata = {
  title: "Neural Cortex 3D | Rasionalin",
  description:
    "Visualisasi jaringan saraf 3D interaktif yang menghubungkan 36 skill node, 111 materi UTBK, 940+ soal, 24 template WASM, dan memori belajar pribadimu.",
};

export default function NeuralCortexPage() {
  return <NeuralCortexWorkspace />;
}
