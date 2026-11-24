"use client";

import { useRouter } from "next/navigation";
import React, { useCallback, useEffect, useState } from "react";
import {
  CheckIcon,
  LogoutIcon,
  SunIcon,
  TargetIcon,
  TutorChatIcon,
  WarmPaperIcon,
} from "@/components/icons/ArchitecturalIcons";
import { AppShell } from "@/components/layout/AppShell";
import { computeExamCountdown, DEFAULT_UTBK_EXAM_DATE } from "@/domain/exam-countdown";
import type { AiRoutingLedgerEntry, ThemePreference } from "@/domain/types";

interface HealthPayload {
  ledger: AiRoutingLedgerEntry[];
  totalCostUsd: number;
  adapters: {
    dbDriver: string;
    storageDriver: string;
    sandboxDriver: string;
    nineRouter: {
      reachable: boolean;
      baseUrl: string;
      modelsCount: number;
      modelsList?: string[];
      error: string | null;
    };
    modelAliases: Record<string, string>;
  };
}

interface AiConfigPayload {
  config: {
    baseUrl: string;
    defaultModel: string;
    providerLabel: string;
    isCustomConfigured: boolean;
    maskedApiKey: string;
  };
  health: {
    reachable: boolean;
    baseUrl: string;
    modelsCount: number;
    modelsList: string[];
    error: string | null;
  };
}

interface ProfileResponse {
  user: {
    id: string;
    email: string;
    displayName: string;
    targetScore: number;
    targetMajor: string | null;
    examDate: string | null;
    themePreference: ThemePreference;
  };
}

const AI_PRESETS = [
  {
    label: "9router Lokal",
    baseUrl: "http://localhost:20128/v1",
    defaultModel: "snbt-reason",
  },
  {
    label: "Google Gemini",
    baseUrl: "https://generativelanguage.googleapis.com/v1beta/openai",
    defaultModel: "gemini-2.5-flash",
  },
  {
    label: "OpenRouter",
    baseUrl: "https://openrouter.ai/api/v1",
    defaultModel: "google/gemini-2.5-flash",
  },
  {
    label: "Ollama Lokal",
    baseUrl: "http://localhost:11434/v1",
    defaultModel: "llama3.1:8b",
  },
];

export function SettingsWorkspace() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<"profile" | "ai">("profile");
  const [health, setHealth] = useState<HealthPayload | null>(null);
  const [email, setEmail] = useState("");
  const [displayName, setDisplayName] = useState("Pejuang SNBT");
  const [targetScore, setTargetScore] = useState(800);
  const [targetMajor, setTargetMajor] = useState("");
  const [examDate, setExamDate] = useState(DEFAULT_UTBK_EXAM_DATE);
  const [theme, setTheme] = useState<"daylight" | "warm">("daylight");
  const [saveMessage, setSaveMessage] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [loggingOut, setLoggingOut] = useState(false);

  // Live AI Gateway Configuration State
  const [aiBaseUrl, setAiBaseUrl] = useState("http://localhost:20128/v1");
  const [aiApiKey, setAiApiKey] = useState("");
  const [aiMaskedKey, setAiMaskedKey] = useState("");
  const [aiDefaultModel, setAiDefaultModel] = useState("");
  const [aiProviderLabel, setAiProviderLabel] = useState("9router Lokal");
  const [aiModelsList, setAiModelsList] = useState<string[]>([]);
  const [aiReachable, setAiReachable] = useState<boolean>(false);
  const [aiStatusMsg, setAiStatusMsg] = useState<string | null>(null);
  const [aiBusy, setAiBusy] = useState(false);

  const loadAll = useCallback(async () => {
    try {
      const [meRes, ledgerRes, aiRes] = await Promise.all([
        fetch("/api/auth/me"),
        fetch("/api/settings/ledger"),
        fetch("/api/settings/ai-config"),
      ]);
      if (meRes.ok) {
        const me = (await meRes.json()) as ProfileResponse;
        setEmail(me.user.email);
        setDisplayName(me.user.displayName);
        setTargetScore(me.user.targetScore);
        setTargetMajor(me.user.targetMajor ?? "");
        setExamDate(me.user.examDate ?? "");
      }
      if (ledgerRes.ok) {
        setHealth((await ledgerRes.json()) as HealthPayload);
      }
      if (aiRes.ok) {
        const ai = (await aiRes.json()) as AiConfigPayload;
        setAiBaseUrl(ai.config.baseUrl);
        setAiDefaultModel(ai.config.defaultModel);
        setAiProviderLabel(ai.config.providerLabel);
        setAiMaskedKey(ai.config.maskedApiKey);
        setAiReachable(ai.health.reachable);
        setAiModelsList(ai.health.modelsList ?? []);
      }
    } catch {
      // Handled gracefully
    }
  }, []);

  useEffect(() => {
    void loadAll();
    const attr = document.documentElement.getAttribute("data-theme");
    setTheme(attr === "warm" ? "warm" : "daylight");
  }, [loadAll]);

  async function saveAiConfig(action: "save" | "reset" | "test") {
    if (aiBusy) return;
    setAiBusy(true);
    setAiStatusMsg(null);
    try {
      const res = await fetch("/api/settings/ai-config", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action,
          baseUrl: aiBaseUrl.trim(),
          apiKey: aiApiKey.trim() || undefined,
          defaultModel: aiDefaultModel.trim(),
          providerLabel: aiProviderLabel.trim(),
        }),
      });
      const json = (await res.json()) as AiConfigPayload & { error?: string };
      if (!res.ok) throw new Error(json.error ?? "Gagal memproses pengaturan AI.");

      setAiBaseUrl(json.config.baseUrl);
      setAiDefaultModel(json.config.defaultModel);
      setAiMaskedKey(json.config.maskedApiKey);
      setAiApiKey("");
      setAiReachable(json.health.reachable);
      setAiModelsList(json.health.modelsList ?? []);

      if (json.health.reachable) {
        setAiStatusMsg(
          `Terhubung! Ditemukan ${json.health.modelsCount} model aktif dari ${json.health.baseUrl}.`,
        );
      } else {
        setAiStatusMsg(
          `Pengaturan disimpan, tetapi server AI belum merespons (${json.health.error ?? "tidak dapat dijangkau"}). Pastikan gateway aktif atau periksa URL/API Key.`,
        );
      }

      const ledgerRes = await fetch("/api/settings/ledger");
      if (ledgerRes.ok) setHealth((await ledgerRes.json()) as HealthPayload);
    } catch (err) {
      setAiStatusMsg(err instanceof Error ? err.message : "Gagal menyimpan pengaturan AI.");
    } finally {
      setAiBusy(false);
    }
  }

  async function applyTheme(nextTheme: "daylight" | "warm") {
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
      // Applied locally immediately
    }
  }

  async function handleSaveProfile(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setSaveMessage(null);
    try {
      const res = await fetch("/api/settings/preferences", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          displayName,
          targetScore: Number(targetScore),
          targetMajor: targetMajor.trim() || null,
          examDate: examDate || null,
        }),
      });
      if (!res.ok) throw new Error("Gagal menyimpan profil.");
      window.dispatchEvent(
        new CustomEvent("rasionalin:exam-date-changed", {
          detail: { examDate: examDate || null },
        }),
      );
      setSaveMessage("Target UTBK dan profil berhasil disimpan.");
    } catch (err) {
      setSaveMessage(err instanceof Error ? err.message : "Gagal menyimpan.");
    } finally {
      setSaving(false);
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

  const initials =
    displayName
      .split(" ")
      .filter(Boolean)
      .slice(0, 2)
      .map((p) => p[0]?.toUpperCase())
      .join("") || "KS";

  return (
    <AppShell>
      <div className="space-y-6">
        <header className="pb-5 border-b border-[var(--border-structural)] flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <span className="w-14 h-14 rounded-2xl bg-[var(--accent-primary)] text-white font-display font-bold text-xl inline-flex items-center justify-center border-b-4 border-[var(--accent-bevel)] shrink-0">
              {initials}
            </span>
            <div>
              <h1 className="text-2xl font-bold">{displayName}</h1>
              <p className="text-sm font-semibold text-[var(--ink-secondary)]">
                {email || "Akun Personal Lokal"}
              </p>
              <div className="flex flex-wrap items-center gap-3 mt-1 text-xs font-extrabold">
                <span className="inline-flex items-center gap-1 text-[var(--accent-text-on-secondary)]">
                  <TargetIcon size={16} />
                  Target IRT <span className="font-num">{targetScore}</span>
                </span>
                {targetMajor && <span className="text-[var(--ink-secondary)]">· {targetMajor}</span>}
              </div>
            </div>
          </div>

          <button
            type="button"
            onClick={handleLogout}
            disabled={loggingOut}
            className="btn-secondary text-xs text-[var(--coral-ink)]"
          >
            <LogoutIcon size={18} />
            <span>{loggingOut ? "Keluar..." : "Keluar Akun"}</span>
          </button>
        </header>

        <div
          className="flex gap-6 border-b border-[var(--border-structural)]"
          role="tablist"
          aria-label="Bagian profil dan pengaturan"
        >
          <button
            type="button"
            role="tab"
            aria-selected={activeTab === "profile"}
            onClick={() => setActiveTab("profile")}
            className={`min-h-[44px] text-sm font-extrabold border-b-2 -mb-[1px] transition-colors cursor-pointer ${
              activeTab === "profile"
                ? "border-[var(--accent-primary)] text-[var(--accent-text-on-secondary)]"
                : "border-transparent text-[var(--ink-secondary)] hover:text-[var(--ink-primary)]"
            }`}
          >
            Profil & Tampilan
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={activeTab === "ai"}
            onClick={() => setActiveTab("ai")}
            className={`min-h-[44px] text-sm font-extrabold border-b-2 -mb-[1px] transition-colors cursor-pointer ${
              activeTab === "ai"
                ? "border-[var(--accent-primary)] text-[var(--accent-text-on-secondary)]"
                : "border-transparent text-[var(--ink-secondary)] hover:text-[var(--ink-primary)]"
            }`}
          >
            Pengaturan AI & Sistem
          </button>
        </div>

        {activeTab === "profile" && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
            <form onSubmit={handleSaveProfile} className="lg:col-span-7 card-tactile p-6 space-y-4">
              <h2 className="font-bold text-base">Target Skor & Profil Belajar</h2>

              <div>
                <label htmlFor="cfg-name" className="text-xs font-extrabold block mb-1.5">
                  Nama Panggilan
                </label>
                <input
                  id="cfg-name"
                  type="text"
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  className="input-tactile"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label htmlFor="cfg-score" className="text-xs font-extrabold block mb-1.5">
                    Target Skor IRT (200 - 1000)
                  </label>
                  <input
                    id="cfg-score"
                    type="number"
                    min={200}
                    max={1000}
                    value={targetScore}
                    onChange={(e) => setTargetScore(Number(e.target.value))}
                    className="input-tactile font-num"
                  />
                </div>

                <div>
                  <div className="flex items-center justify-between gap-2 mb-1.5">
                    <label htmlFor="cfg-date" className="text-xs font-extrabold block">
                      Tanggal Ujian SNBT
                    </label>
                    <span className="font-num text-[11px] font-extrabold text-[var(--accent-text-on-secondary)]">
                      H-{computeExamCountdown(examDate).daysLeft}
                    </span>
                  </div>
                  <input
                    id="cfg-date"
                    type="date"
                    value={examDate}
                    onChange={(e) => setExamDate(e.target.value)}
                    className="input-tactile font-num"
                  />
                </div>
              </div>

              <div>
                <label htmlFor="cfg-major" className="text-xs font-extrabold block mb-1.5">
                  Target Program Studi / PTN
                </label>
                <input
                  id="cfg-major"
                  type="text"
                  value={targetMajor}
                  onChange={(e) => setTargetMajor(e.target.value)}
                  placeholder="Misal: Teknik Informatika ITB"
                  className="input-tactile"
                />
              </div>

              {saveMessage && (
                <div className="p-3 rounded-xl bg-[var(--accent-tint)] border border-[var(--accent-tint-border)] text-xs font-extrabold text-[var(--accent-text-on-secondary)]">
                  {saveMessage}
                </div>
              )}

              <button type="submit" disabled={saving} className="btn-primary w-full">
                <CheckIcon size={16} />
                <span>{saving ? "Menyimpan..." : "Simpan Target & Profil"}</span>
              </button>
            </form>

            <section className="lg:col-span-5 card-tactile p-6 space-y-4">
              <div>
                <h2 className="font-bold text-base">Kenyamanan Mata</h2>
                <p className="text-xs font-semibold text-[var(--ink-secondary)] mt-1">
                  Pilih suasana terang yang paling nyaman untuk belajar lama tanpa layar gelap suram.
                </p>
              </div>

              <div className="space-y-3">
                <button
                  type="button"
                  onClick={() => applyTheme("daylight")}
                  className={`w-full text-left p-4 rounded-xl border-2 transition-all cursor-pointer flex items-center justify-between gap-3 ${
                    theme === "daylight"
                      ? "border-[var(--accent-primary)] bg-[var(--accent-tint)]"
                      : "border-[var(--border-structural)] bg-[var(--surface-canvas)]"
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <SunIcon size={24} className="text-[var(--accent-primary)] shrink-0" />
                    <div>
                      <div className="font-extrabold text-sm">Daylight Ivory</div>
                      <div className="text-xs font-semibold text-[var(--ink-secondary)]">
                        Putih gading lembut & sage sejuk.
                      </div>
                    </div>
                  </div>
                  {theme === "daylight" && (
                    <span className="text-xs font-extrabold text-[var(--accent-text-on-secondary)]">
                      Aktif
                    </span>
                  )}
                </button>

                <button
                  type="button"
                  onClick={() => applyTheme("warm")}
                  className={`w-full text-left p-4 rounded-xl border-2 transition-all cursor-pointer flex items-center justify-between gap-3 ${
                    theme === "warm"
                      ? "border-[var(--accent-primary)] bg-[var(--accent-tint)]"
                      : "border-[var(--border-structural)] bg-[var(--surface-canvas)]"
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <WarmPaperIcon size={24} className="text-[var(--ochre-ink)] shrink-0" />
                    <div>
                      <div className="font-extrabold text-sm">Warm Paper</div>
                      <div className="text-xs font-semibold text-[var(--ink-secondary)]">
                        Krem hangat nyaman untuk bacaan panjang.
                      </div>
                    </div>
                  </div>
                  {theme === "warm" && (
                    <span className="text-xs font-extrabold text-[var(--accent-text-on-secondary)]">
                      Aktif
                    </span>
                  )}
                </button>
              </div>
            </section>
          </div>
        )}

        {activeTab === "ai" && (
          <div className="space-y-5">
            {/* LIVE AI GATEWAY CONFIGURATION PANEL */}
            <section className="card-tactile p-6 space-y-5">
              <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-[var(--border-structural)]">
                <div className="flex items-center gap-2.5">
                  <TutorChatIcon size={24} className="text-[var(--accent-primary)]" />
                  <div>
                    <h2 className="font-bold text-base">Konfigurasi Gateway AI Live</h2>
                    <p className="text-xs font-semibold text-[var(--ink-secondary)]">
                      Hubungkan 9router lokal, Google Gemini, OpenRouter, atau Ollama tanpa restart server.
                    </p>
                  </div>
                </div>
                <span
                  className={`text-xs font-extrabold ${
                    aiReachable
                      ? "text-[var(--accent-text-on-secondary)]"
                      : "text-[var(--ochre-ink)]"
                  }`}
                >
                  {aiReachable ? "AI Live Terhubung" : "Belum Terhubung (Mode Lokal)"}
                </span>
              </div>

              {/* Quick Provider Presets */}
              <div className="space-y-1.5">
                <span className="text-xs font-extrabold text-[var(--ink-secondary)] block">
                  Pilih Preset Cepat:
                </span>
                <div className="flex flex-wrap gap-2">
                  {AI_PRESETS.map((p) => (
                    <button
                      key={p.label}
                      type="button"
                      onClick={() => {
                        setAiProviderLabel(p.label);
                        setAiBaseUrl(p.baseUrl);
                        setAiDefaultModel(p.defaultModel);
                      }}
                      className="px-3 py-1.5 rounded-lg border border-[var(--border-structural)] bg-[var(--surface-canvas)] hover:border-[var(--accent-primary)] text-xs font-extrabold cursor-pointer"
                    >
                      {p.label}
                    </button>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label htmlFor="ai-base-url" className="text-xs font-extrabold block mb-1.5">
                    Base URL (OpenAI-Compatible)
                  </label>
                  <input
                    id="ai-base-url"
                    type="url"
                    value={aiBaseUrl}
                    onChange={(e) => setAiBaseUrl(e.target.value)}
                    placeholder="http://localhost:20128/v1"
                    className="input-tactile text-sm font-mono-telemetry"
                  />
                </div>

                <div>
                  <label htmlFor="ai-api-key" className="text-xs font-extrabold block mb-1.5">
                    API Key {aiMaskedKey ? `(tersimpan: ${aiMaskedKey})` : ""}
                  </label>
                  <input
                    id="ai-api-key"
                    type="password"
                    value={aiApiKey}
                    onChange={(e) => setAiApiKey(e.target.value)}
                    placeholder="Kosongkan jika tetap pakai key tersimpan"
                    className="input-tactile text-sm"
                  />
                </div>

                <div className="md:col-span-2">
                  <label htmlFor="ai-model" className="text-xs font-extrabold block mb-1.5">
                    Nama Model Aktif (opsional: kosongkan agar deteksi otomatis)
                  </label>
                  <div className="flex flex-col sm:flex-row gap-2">
                    <input
                      id="ai-model"
                      type="text"
                      value={aiDefaultModel}
                      onChange={(e) => setAiDefaultModel(e.target.value)}
                      placeholder="Misal: gemini-2.5-flash atau snbt-reason"
                      className="input-tactile text-sm font-mono-telemetry flex-1"
                    />
                    {aiModelsList.length > 0 && (
                      <select
                        aria-label="Pilih model terdeteksi"
                        value={aiDefaultModel}
                        onChange={(e) => setAiDefaultModel(e.target.value)}
                        className="input-tactile text-xs sm:w-64"
                      >
                        <option value="">Model terdeteksi ({aiModelsList.length})...</option>
                        {aiModelsList.map((m) => (
                          <option key={m} value={m}>
                            {m}
                          </option>
                        ))}
                      </select>
                    )}
                  </div>
                </div>
              </div>

              {aiStatusMsg && (
                <div
                  className={`p-3.5 rounded-xl border text-xs font-bold ${
                    aiReachable
                      ? "bg-[var(--accent-tint)] border-[var(--accent-tint-border)] text-[var(--accent-text-on-secondary)]"
                      : "bg-[var(--ochre-tint)] border-[var(--ochre-border)] text-[var(--ochre-ink)]"
                  }`}
                >
                  {aiStatusMsg}
                </div>
              )}

              <div className="flex flex-wrap items-center gap-2.5">
                <button
                  type="button"
                  disabled={aiBusy}
                  onClick={() => void saveAiConfig("save")}
                  className="btn-primary"
                >
                  {aiBusy ? "Menguji Koneksi..." : "Simpan & Uji Koneksi AI"}
                </button>
                <button
                  type="button"
                  disabled={aiBusy}
                  onClick={() => void saveAiConfig("test")}
                  className="btn-secondary text-xs"
                >
                  Cek Ulang Koneksi
                </button>
                <button
                  type="button"
                  disabled={aiBusy}
                  onClick={() => void saveAiConfig("reset")}
                  className="text-xs font-extrabold text-[var(--ink-secondary)] hover:text-[var(--ink-primary)] underline ml-auto cursor-pointer"
                >
                  Reset ke .env.local
                </button>
              </div>
            </section>

            {/* Infrastructure Summary & AI Ledger */}
            <section className="card-tactile p-6 space-y-4">
              <h2 className="font-bold text-base">Adapter Infrastruktur Aktif</h2>
              {health ? (
                <dl className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2 border-t border-[var(--border-structural)] text-xs font-mono-telemetry">
                  <div>
                    <dt className="text-[var(--ink-secondary)] font-sans font-bold">Basis Data</dt>
                    <dd className="font-semibold mt-1">{health.adapters.dbDriver}</dd>
                  </div>
                  <div>
                    <dt className="text-[var(--ink-secondary)] font-sans font-bold">Penyimpanan</dt>
                    <dd className="font-semibold mt-1">{health.adapters.storageDriver}</dd>
                  </div>
                  <div>
                    <dt className="text-[var(--ink-secondary)] font-sans font-bold">Sandbox Matematika</dt>
                    <dd className="font-semibold mt-1">{health.adapters.sandboxDriver}</dd>
                  </div>
                </dl>
              ) : (
                <div className="h-16 rounded-xl bg-[var(--surface-secondary)]" />
              )}
            </section>

            <section className="card-tactile p-6 space-y-3">
              <div className="flex items-center justify-between gap-2">
                <h2 className="font-bold text-base">Riwayat Panggilan AI</h2>
                <span className="text-xs font-mono-telemetry font-semibold text-[var(--ink-secondary)]">
                  Estimasi: ${health?.totalCostUsd.toFixed(4) ?? "0.0000"}
                </span>
              </div>

              {health && health.ledger.length > 0 ? (
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs font-mono-telemetry">
                    <thead>
                      <tr className="border-b border-[var(--border-structural)] text-[var(--ink-secondary)]">
                        <th className="py-2 pr-3">Task</th>
                        <th className="py-2 pr-3">Model</th>
                        <th className="py-2 pr-3">Latensi</th>
                        <th className="py-2">Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[var(--border-structural)]">
                      {health.ledger.slice(0, 12).map((row) => (
                        <tr key={row.id}>
                          <td className="py-2 pr-3">{row.taskType}</td>
                          <td className="py-2 pr-3">{row.actualModelUsed}</td>
                          <td className="py-2 pr-3">{row.latencyMs}ms</td>
                          <td className="py-2">{row.errorCode ?? "OK"}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <p className="text-sm font-semibold text-[var(--ink-secondary)]">
                  Belum ada panggilan AI tercatat pada sesi ini.
                </p>
              )}
            </section>
          </div>
        )}
      </div>
    </AppShell>
  );
}
