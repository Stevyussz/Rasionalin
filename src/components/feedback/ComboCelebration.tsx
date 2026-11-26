"use client";

import React, { useEffect, useState } from "react";
import { FlameIcon } from "@/components/icons/ArchitecturalIcons";

export interface ComboTierMeta {
  tierKey: "double" | "triple" | "quadra" | "penta" | "godlike";
  title: string;
  subtitle: string;
  badgeText: string;
  sparkCount: number;
  containerClass: string;
  badgeClass: string;
}

export function getComboTier(streak: number): ComboTierMeta | null {
  if (streak < 2) return null;
  if (streak === 2) {
    return {
      tierKey: "double",
      title: "DOUBLE COMBO!",
      subtitle: "Ritme mantap, lanjutkan!",
      badgeText: "2x",
      sparkCount: 6,
      containerClass: "bg-[var(--accent-primary)] border-[var(--accent-bevel)] text-white",
      badgeClass: "bg-white/20 text-white",
    };
  }
  if (streak === 3) {
    return {
      tierKey: "triple",
      title: "TRIPLE COMBO!",
      subtitle: "Otak mulai panas dan tajam!",
      badgeText: "3x",
      sparkCount: 10,
      containerClass: "bg-[var(--ochre-fill)] border-[var(--ochre-bevel)] text-white",
      badgeClass: "bg-white/20 text-white",
    };
  }
  if (streak === 4) {
    return {
      tierKey: "quadra",
      title: "QUADRA COMBO!",
      subtitle: "Empat beruntun tanpa celah!",
      badgeText: "4x",
      sparkCount: 12,
      containerClass: "bg-[var(--ochre-fill)] border-[var(--ochre-bevel)] text-white",
      badgeClass: "bg-white/25 text-white",
    };
  }
  if (streak === 5) {
    return {
      tierKey: "penta",
      title: "PENTA COMBO!",
      subtitle: "Mental juara siap tembus 100!",
      badgeText: "5x",
      sparkCount: 14,
      containerClass: "bg-[var(--olive-fill)] border-[var(--olive-bevel)] text-white",
      badgeClass: "bg-[var(--ochre-tint)] text-[var(--ochre-ink)]",
    };
  }
  return {
    tierKey: "godlike",
    title: `UNSTOPPABLE · ${streak}x!`,
    subtitle: "Refleks super presisi, gas terus!",
    badgeText: `${streak}x`,
    sparkCount: 16,
    containerClass: "bg-[var(--olive-fill)] border-[var(--olive-bevel)] text-white",
    badgeClass: "bg-[var(--ochre-tint)] text-[var(--ochre-ink)]",
  };
}

const SPARK_COLORS = ["#16794B", "#D98218", "#344E41", "#BD3E26", "#F3B63A", "#2BA86B"];

interface ComboCelebrationProps {
  streak: number;
  triggerKey: number;
}

export function ComboCelebration({ streak, triggerKey }: ComboCelebrationProps) {
  const [visibleKey, setVisibleKey] = useState<number>(0);

  useEffect(() => {
    if (triggerKey <= 0 || streak < 2) {
      setVisibleKey(0);
      return;
    }
    setVisibleKey(triggerKey);
    const id = window.setTimeout(() => {
      setVisibleKey(0);
    }, 1700);
    return () => window.clearTimeout(id);
  }, [streak, triggerKey]);

  const tier = getComboTier(streak);
  if (!tier || visibleKey === 0) return null;

  const sparks = Array.from({ length: tier.sparkCount }, (_, i) => {
    const angle = (Math.PI * 2 * i) / tier.sparkCount;
    const radius = i % 2 === 0 ? 92 : 68;
    const tx = Math.round(Math.cos(angle) * radius * 1.35);
    const ty = Math.round(Math.sin(angle) * radius * 0.65);
    const rot = (i % 2 === 0 ? 1 : -1) * (120 + i * 25);
    return {
      tx: `${tx}px`,
      ty: `${ty}px`,
      rot: `${rot}deg`,
      color: SPARK_COLORS[i % SPARK_COLORS.length],
      round: i % 2 === 0,
    };
  });

  return (
    <div
      key={`${visibleKey}-${streak}`}
      role="status"
      aria-live="polite"
      className="fixed inset-0 overflow-hidden pointer-events-none z-50 flex justify-center items-start pt-16 sm:pt-[72px]"
    >
      <div className="relative flex items-center justify-center">
        {/* Radial Geometric Confetti Sparks (zero layout/scroll impact) */}
        {sparks.map((sp, idx) => (
          <span
            key={idx}
            aria-hidden="true"
            className={`animate-combo-spark absolute w-2.5 h-2.5 ${sp.round ? "rounded-full" : "rounded-xs"}`}
            style={
              {
                backgroundColor: sp.color,
                "--tx": sp.tx,
                "--ty": sp.ty,
                "--rot": sp.rot,
              } as React.CSSProperties
            }
          />
        ))}

        {/* Tactile Combo Banner */}
        <div
          className={`animate-combo-banner relative flex items-center gap-3 px-4 py-2.5 rounded-2xl border-2 border-b-4 shadow-lg ${tier.containerClass}`}
        >
          <span className="inline-flex items-center justify-center w-8 h-8 rounded-xl bg-white/15 shrink-0">
            <FlameIcon size={20} weight="fill" />
          </span>
          <div className="text-left leading-tight">
            <div className="font-display text-sm sm:text-base font-extrabold tracking-wide">
              {tier.title}
            </div>
            <div className="text-[11px] font-bold opacity-95">{tier.subtitle}</div>
          </div>
          <span className={`font-num text-sm font-extrabold px-2.5 py-1 rounded-lg shrink-0 ${tier.badgeClass}`}>
            {tier.badgeText}
          </span>
        </div>
      </div>
    </div>
  );
}
