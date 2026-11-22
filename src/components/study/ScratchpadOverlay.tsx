"use client";

import React, { useEffect, useRef, useState } from "react";
import { CloseIcon, ScratchpadIcon } from "@/components/icons/ArchitecturalIcons";

interface ScratchpadOverlayProps {
  open: boolean;
  onClose: () => void;
  onUsed: () => void;
}

export function ScratchpadOverlay({ open, onClose, onUsed }: ScratchpadOverlayProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const drawingRef = useRef(false);
  const [tool, setTool] = useState<"pen" | "eraser">("pen");

  useEffect(() => {
    if (!open) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    if (canvas.width !== Math.floor(rect.width) || canvas.height !== Math.floor(rect.height)) {
      canvas.width = Math.max(300, Math.floor(rect.width));
      canvas.height = Math.max(240, Math.floor(rect.height));
    }
  }, [open]);

  if (!open) return null;

  function getPoint(e: React.PointerEvent<HTMLCanvasElement>) {
    const rect = e.currentTarget.getBoundingClientRect();
    return {
      x: e.clientX - rect.left,
      y: e.clientY - rect.top,
    };
  }

  function handlePointerDown(e: React.PointerEvent<HTMLCanvasElement>) {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    drawingRef.current = true;
    onUsed();
    e.currentTarget.setPointerCapture(e.pointerId);

    const { x, y } = getPoint(e);
    ctx.beginPath();
    ctx.moveTo(x, y);
  }

  function handlePointerMove(e: React.PointerEvent<HTMLCanvasElement>) {
    if (!drawingRef.current) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const { x, y } = getPoint(e);

    if (tool === "eraser") {
      ctx.globalCompositeOperation = "destination-out";
      ctx.lineWidth = 20;
    } else {
      ctx.globalCompositeOperation = "source-over";
      ctx.strokeStyle = "#16794B";
      ctx.lineWidth = 2.6;
    }
    ctx.lineCap = "round";
    ctx.lineJoin = "round";
    ctx.lineTo(x, y);
    ctx.stroke();
  }

  function handlePointerUp() {
    drawingRef.current = false;
  }

  function clearCanvas() {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    ctx?.clearRect(0, 0, canvas.width, canvas.height);
  }

  return (
    <div
      role="dialog"
      aria-label="Kertas coretan matematika"
      className="fixed inset-x-4 bottom-4 top-20 z-40 rounded-2xl border-2 border-[var(--border-bevel)] scratchpad-glass flex flex-col shadow-[var(--shadow-sheet)] overflow-hidden"
    >
      <div className="px-4 py-2.5 border-b border-[var(--border-structural)] bg-[var(--surface-elevated)] flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2 text-[var(--accent-text-on-secondary)]">
          <ScratchpadIcon size={19} />
          <span className="font-display font-bold text-sm text-[var(--ink-primary)]">
            Kertas Coretan
          </span>
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setTool("pen")}
            className={`min-h-[38px] px-3 rounded-lg text-xs font-extrabold cursor-pointer ${
              tool === "pen"
                ? "bg-[var(--accent-primary)] text-white"
                : "text-[var(--ink-secondary)] hover:bg-[var(--surface-secondary)]"
            }`}
          >
            Pena
          </button>
          <button
            type="button"
            onClick={() => setTool("eraser")}
            className={`min-h-[38px] px-3 rounded-lg text-xs font-extrabold cursor-pointer ${
              tool === "eraser"
                ? "bg-[var(--accent-primary)] text-white"
                : "text-[var(--ink-secondary)] hover:bg-[var(--surface-secondary)]"
            }`}
          >
            Penghapus
          </button>
          <button
            type="button"
            onClick={clearCanvas}
            className="min-h-[38px] px-3 rounded-lg text-xs font-extrabold text-[var(--ink-secondary)] hover:bg-[var(--surface-secondary)] cursor-pointer"
          >
            Bersihkan
          </button>
          <button
            type="button"
            onClick={onClose}
            aria-label="Tutup kertas coretan"
            className="min-w-[38px] min-h-[38px] inline-flex items-center justify-center rounded-lg hover:bg-[var(--surface-secondary)] cursor-pointer"
          >
            <CloseIcon size={17} />
          </button>
        </div>
      </div>

      <canvas
        ref={canvasRef}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerCancel={handlePointerUp}
        className="flex-1 w-full h-full touch-none cursor-crosshair"
      />
    </div>
  );
}
