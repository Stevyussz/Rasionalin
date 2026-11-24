"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import React, { useEffect, useState } from "react";
import {
  BrainIcon,
  CompassIcon,
  FlameIcon,
  FractureIcon,
  LogoutIcon,
  PlayIcon,
  ShieldIcon,
  SimulationIcon,
  SunIcon,
  TargetIcon,
  TimerIcon,
  TutorChatIcon,
  UserIcon,
  VaultIcon,
  WarmPaperIcon,
} from "@/components/icons/ArchitecturalIcons";
import { RasionalinLogo } from "@/components/brand/RasionalinLogo";
import { PwaInstallButton } from "@/components/pwa/PwaInstallController";
import { computeExamCountdown } from "@/domain/exam-countdown";
import type { UserMomentumState } from "@/domain/types";

interface AppShellProps {
  children: React.ReactNode;
  momentum?: UserMomentumState | null;
  rightRail?: React.ReactNode;
  fullBleed?: boolean;
}

const DESKTOP_NAV = [
  { href: "/", label: "Belajar", icon: CompassIcon },
  { href: "/tutor", label: "Tanya AI", icon: TutorChatIcon },
  { href: "/graveyard", label: "Pemulihan", icon: FractureIcon },
  { href: "/vault", label: "Catatan", icon: VaultIcon },
  { href: "/simulation", label: "Tryout", icon: SimulationIcon },
  { href: "/neural", label: "Neural Cortex", icon: BrainIcon },
  { href: "/settings", label: "Profil", icon: UserIcon },
];

const MOBILE_TABS = [
  { href: "/", label: "Belajar", icon: CompassIcon },
  { href: "/tutor", label: "Tanya AI", icon: TutorChatIcon },
  { href: "/graveyard", label: "Pemulihan", icon: FractureIcon },
  { href: "/vault", label: "Catatan", icon: VaultIcon },
  { href: "/simulation", label: "Tryout", icon: SimulationIcon },
];

export function AppShell({ children, momentum: momentumProp, rightRail, fullBleed = false }: AppShellProps) {
  const pathname = usePathname();
  const router = useRouter();
  const [theme, setTheme] = useState<"daylight" | "warm">("daylight");
  const [momentum, setMomentum] = useState<UserMomentumState | null>(momentumProp ?? null);
  const [displayName, setDisplayName] = useState<string | null>(null);
  const [examDate, setExamDate] = useState<string | null>(null);
  const [loggingOut, setLoggingOut] = useState(false);

  useEffect(() => {
    const attr = document.documentElement.getAttribute("data-theme");
    setTheme(attr === "warm" ? "warm" : "daylight");
  }, []);

  useEffect(() => {
    if (momentumProp) setMomentum(momentumProp);
  }, [momentumProp]);

  useEffect(() => {
    let active = true;
    fetch("/api/auth/me")
      .then((res) => {
        if (res.status === 401 && active) {
          router.replace("/login");
          return null;
        }
        return res.ok ? res.json() : null;
      })
      .then((json: { user?: { displayName?: string; examDate?: string | null }; momentum?: UserMomentumState } | null) => {
        if (!active || !json) return;
        if (json.user?.displayName) setDisplayName(json.user.displayName);
        if (json.user && "examDate" in json.user) setExamDate(json.user.examDate ?? null);
        if (!momentumProp && json.momentum) setMomentum(json.momentum);
      })
      .catch(() => {});
    return () => {
      active = false;
    };
  }, [momentumProp, router]);

  useEffect(() => {
    const onExamDateChanged = (evt: Event) => {
      const custom = evt as CustomEvent<{ examDate?: string | null }>;
      if (custom.detail && "examDate" in custom.detail) {
        setExamDate(custom.detail.examDate ?? null);
      }
    };
    window.addEventListener("rasionalin:exam-date-changed", onExamDateChanged);
    return () => window.removeEventListener("rasionalin:exam-date-changed", onExamDateChanged);
  }, []);

  async function toggleTheme() {
    const nextTheme: "daylight" | "warm" = theme === "daylight" ? "warm" : "daylight";
    setTheme(nextTheme);
    document.documentElement.setAttribute("data-theme", nextTheme);
    try {
      localStorage.setItem("kejarsnbt_theme", nextTheme);
      await fetch("/api/settings/preferences", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ themePreference: nextTheme === "warm" ? "dark" : "light" }),
      });
    } catch {
      // Theme applies immediately even offline
    }
  }

  async function handleLogout() {
    if (loggingOut) return;
    setLoggingOut(true);
    try {
      await fetch("/api/auth/logout", { method: "POST" });
      router.replace("/login");
      router.refresh();
    } finally {
      setLoggingOut(false);
    }
  }

  return (
    <div className="min-h-screen bg-[var(--surface-canvas)] text-[var(--ink-primary)] flex flex-col lg:flex-row">
      {/* Desktop Left Navigation Rail (Clean Flat Hierarchy, Consistent Phosphor Duotone Icons) */}
      <aside
        aria-label="Navigasi utama desktop"
        className="hidden lg:flex lg:flex-col lg:w-[238px] lg:shrink-0 lg:sticky lg:top-0 lg:h-screen bg-[var(--surface-elevated)] border-r border-[var(--border-structural)] px-4 py-5 justify-between z-30"
      >
        <div className="space-y-6">
          <Link
            href="/"
            className="flex items-center px-1 py-1"
            aria-label="Beranda Rasionalin"
          >
            <RasionalinLogo size={38} subtitle="Target 800+ UTBK" />
          </Link>

          <nav aria-label="Menu utama" className="space-y-1">
            {DESKTOP_NAV.map((item) => {
              const active = pathname === item.href;
              const Icon = item.icon;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  aria-current={active ? "page" : undefined}
                  className={`flex items-center gap-3 px-3 min-h-[46px] rounded-xl text-[15px] font-extrabold transition-colors ${
                    active
                      ? "bg-[var(--accent-tint)] text-[var(--accent-text-on-secondary)]"
                      : "text-[var(--ink-secondary)] hover:bg-[var(--surface-secondary)] hover:text-[var(--ink-primary)]"
                  }`}
                >
                  <Icon
                    size={22}
                    weight={active ? "duotone" : "duotone"}
                    className={active ? "text-[var(--accent-primary)]" : "text-[var(--ink-secondary)]"}
                  />
                  <span>{item.label}</span>
                </Link>
              );
            })}
          </nav>

          <Link href="/study" className="btn-primary w-full text-sm">
            <PlayIcon size={16} />
            <span>Mulai Latihan</span>
          </Link>
        </div>

        <div className="space-y-1 pt-4 border-t border-[var(--border-structural)]">
          {displayName && (
            <div className="px-2 py-1.5 space-y-1 text-xs">
              <div className="flex items-center justify-between gap-2">
                <span className="font-extrabold truncate text-[var(--ink-primary)]">{displayName}</span>
                {momentum && (
                  <span className="font-num font-bold text-[var(--accent-text-on-secondary)]">
                    IRT {Math.round(momentum.estimatedIrtComposite)}
                  </span>
                )}
              </div>
              <Link
                href="/settings"
                className="inline-flex items-center gap-1.5 font-num text-[11px] font-extrabold text-[var(--ochre-ink)] hover:underline"
                title="Klik untuk atur tanggal UTBK-SNBT"
              >
                <TimerIcon size={13} />
                <span>H-{computeExamCountdown(examDate).daysLeft} menuju UTBK</span>
              </Link>
            </div>
          )}

          <PwaInstallButton />

          <button
            type="button"
            onClick={toggleTheme}
            aria-label={
              theme === "daylight"
                ? "Ubah ke tampilan Warm Paper ramah mata"
                : "Ubah ke tampilan Daylight"
            }
            className="w-full flex items-center gap-2.5 px-2.5 min-h-[42px] rounded-xl text-xs font-extrabold text-[var(--ink-secondary)] hover:bg-[var(--surface-secondary)] hover:text-[var(--ink-primary)] cursor-pointer transition-colors"
          >
            {theme === "daylight" ? (
              <WarmPaperIcon size={19} className="text-[var(--ochre-ink)]" />
            ) : (
              <SunIcon size={19} className="text-[var(--ochre-ink)]" />
            )}
            <span>{theme === "daylight" ? "Mode Warm Paper" : "Mode Daylight"}</span>
          </button>

          <button
            type="button"
            onClick={handleLogout}
            disabled={loggingOut}
            className="w-full flex items-center gap-2.5 px-2.5 min-h-[42px] rounded-xl text-xs font-extrabold text-[var(--ink-secondary)] hover:bg-[var(--coral-tint)] hover:text-[var(--coral-ink)] cursor-pointer transition-colors"
          >
            <LogoutIcon size={19} />
            <span>{loggingOut ? "Keluar..." : "Keluar Akun"}</span>
          </button>
        </div>
      </aside>

      {/* Mobile Compact Header (< lg) */}
      <header className="lg:hidden sticky top-0 z-30 bg-[var(--surface-elevated)] border-b border-[var(--border-structural)] px-3 h-14 flex items-center justify-between gap-1.5">
        <Link href="/" className="flex items-center min-h-[44px]" aria-label="Beranda Rasionalin">
          <RasionalinLogo size={32} compact />
        </Link>

        <div className="flex items-center gap-1.5">
          <PwaInstallButton compact />
          {momentum && (
            <div className="flex items-center gap-1.5 text-xs font-num font-bold shrink-0">
              <Link
                href="/settings"
                className="inline-flex items-center gap-1 whitespace-nowrap shrink-0 text-[var(--accent-text-on-secondary)] bg-[var(--accent-tint)] px-2 py-0.5 rounded-md"
                title="Hitung mundur UTBK-SNBT"
              >
                <TimerIcon size={13} />
                <span>H-{computeExamCountdown(examDate).daysLeft}</span>
              </Link>
              <span className="inline-flex items-center gap-1 text-[var(--ochre-ink)]" title="Kombo Presisi">
                <FlameIcon size={17} />
                {momentum.precisionComboCurrent}
              </span>
              <span
                className="hidden sm:inline-flex items-center gap-1 text-[var(--accent-text-on-secondary)]"
                title="Perisai Pemulihan"
              >
                <ShieldIcon size={17} />
                {momentum.tier0RecoveryShieldsRemaining}
              </span>
              <span
                className="hidden sm:inline-flex items-center gap-1 text-[var(--olive-ink)]"
                title="Skor Kesiapan IRT"
              >
                <TargetIcon size={17} />
                {Math.round(momentum.estimatedIrtComposite)}
              </span>
            </div>
          )}

          <Link
            href="/neural"
            aria-label="Buka Neural Cortex 3D"
            className={`inline-flex items-center justify-center min-w-[38px] min-h-[38px] rounded-lg ${
              pathname === "/neural"
                ? "text-[var(--accent-primary)] bg-[var(--accent-tint)]"
                : "text-[var(--accent-primary)] hover:bg-[var(--accent-tint)]"
            }`}
          >
            <BrainIcon size={20} />
          </Link>

          <button
            type="button"
            onClick={toggleTheme}
            aria-label={theme === "daylight" ? "Aktifkan Warm Paper" : "Aktifkan Daylight"}
            className="inline-flex items-center justify-center min-w-[38px] min-h-[38px] rounded-lg text-[var(--ochre-ink)] hover:bg-[var(--surface-secondary)] cursor-pointer"
          >
            {theme === "daylight" ? <WarmPaperIcon size={20} /> : <SunIcon size={20} />}
          </button>

          <Link
            href="/settings"
            aria-label="Buka Profil & Pengaturan"
            className={`inline-flex items-center justify-center min-w-[38px] min-h-[38px] rounded-lg ${
              pathname === "/settings"
                ? "text-[var(--accent-primary)] bg-[var(--accent-tint)]"
                : "text-[var(--ink-secondary)] hover:bg-[var(--surface-secondary)]"
            }`}
          >
            <UserIcon size={22} />
          </Link>
        </div>
      </header>

      {/* Main Content Area + Optional Right Rail */}
      {fullBleed ? (
        <main className="flex-1 min-w-0 flex flex-col h-[calc(100dvh-3.5rem)] lg:h-screen pb-[64px] lg:pb-0 overflow-hidden">
          {children}
        </main>
      ) : (
        <div className="flex-1 min-w-0 flex justify-center pb-24 lg:pb-10">
          <div
            className={`w-full px-4 sm:px-6 lg:px-8 py-6 ${
              rightRail ? "max-w-[1140px] grid grid-cols-1 xl:grid-cols-12 gap-7 items-start" : "max-w-[1040px]"
            }`}
          >
            <main className={rightRail ? "xl:col-span-8 min-w-0" : "min-w-0"}>{children}</main>
            {rightRail && (
              <aside className="xl:col-span-4 xl:sticky xl:top-5 xl:max-h-[calc(100dvh-2.5rem)] xl:overflow-y-auto xl:pr-1 space-y-4 min-w-0">
                {rightRail}
              </aside>
            )}
          </div>
        </div>
      )}

      {/* Mobile Bottom Tab Bar (5 Clear Labeled Items Including Tanya AI) */}
      <nav
        aria-label="Navigasi bawah mobile"
        className="lg:hidden fixed bottom-0 inset-x-0 z-30 bg-[var(--surface-elevated)] border-t border-[var(--border-structural)] px-1.5 pt-1.5 pb-[calc(0.375rem+env(safe-area-inset-bottom))]"
      >
        <div className="max-w-lg mx-auto grid grid-cols-5 gap-1">
          {MOBILE_TABS.map((item) => {
            const active = pathname === item.href;
            const Icon = item.icon;
            return (
              <Link
                key={item.href}
                href={item.href}
                aria-current={active ? "page" : undefined}
                className={`flex flex-col items-center justify-center gap-0.5 min-h-[52px] rounded-xl text-[11px] font-extrabold transition-colors ${
                  active
                    ? "bg-[var(--accent-tint)] text-[var(--accent-text-on-secondary)]"
                    : "text-[var(--ink-secondary)] hover:bg-[var(--surface-secondary)]"
                }`}
              >
                <Icon size={21} className={active ? "text-[var(--accent-primary)]" : ""} />
                <span className="truncate max-w-full px-0.5">{item.label}</span>
              </Link>
            );
          })}
        </div>
      </nav>
    </div>
  );
}
