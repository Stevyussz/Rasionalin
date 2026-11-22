"use client";

import React from "react";

interface RasionalinLogoProps {
  size?: number;
  showWordmark?: boolean;
  subtitle?: string | null;
  compact?: boolean;
}

export function RasionalinLogo({
  size = 38,
  showWordmark = true,
  subtitle = "Target 800+ UTBK",
  compact = false,
}: RasionalinLogoProps) {
  return (
    <span className="inline-flex items-center gap-2.5 min-w-0 select-none">
      <svg
        width={size}
        height={size}
        viewBox="0 0 512 512"
        fill="none"
        aria-hidden="true"
        className="shrink-0"
      >
        <rect x="24" y="36" width="464" height="452" rx="116" fill="#0F5A36" />
        <rect x="24" y="20" width="464" height="444" rx="116" fill="#16794B" />
        <rect
          x="34"
          y="30"
          width="444"
          height="424"
          rx="106"
          stroke="#22915C"
          strokeWidth="6"
          strokeOpacity="0.45"
        />
        <rect x="136" y="130" width="56" height="240" rx="28" fill="#FAF9F5" />
        <path
          d="M164 130H262C319 130 362 167 362 217C362 267 319 304 262 304H164V250H258C286 250 306 236 306 217C306 198 286 184 258 184H164V130Z"
          fill="#FAF9F5"
        />
        <path
          d="M254 282L334 342"
          stroke="#FAF9F5"
          strokeWidth="56"
          strokeLinecap="round"
        />
        <circle cx="372" cy="136" r="32" fill="#F2B441" />
        <circle cx="372" cy="136" r="13" fill="#FAF9F5" />
      </svg>

      {showWordmark && (
        <span className="min-w-0">
          <span
            className={`font-display font-bold tracking-tight block leading-none text-[var(--ink-primary)] ${
              compact ? "text-lg" : "text-xl"
            }`}
          >
            Rasionalin
          </span>
          {subtitle && !compact && (
            <span className="text-xs font-bold text-[var(--ink-secondary)] block mt-0.5 truncate">
              {subtitle}
            </span>
          )}
        </span>
      )}
    </span>
  );
}
