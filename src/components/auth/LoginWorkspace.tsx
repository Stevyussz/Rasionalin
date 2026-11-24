"use client";

import { useRouter, useSearchParams } from "next/navigation";
import React, { Suspense, useState } from "react";
import { RasionalinLogo } from "@/components/brand/RasionalinLogo";
import {
  ArrowRightIcon,
  BrainIcon,
  CheckIcon,
  ShieldIcon,
  TargetIcon,
  TutorChatIcon,
  VerifyIcon,
} from "@/components/icons/ArchitecturalIcons";

function LoginFormContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const nextPath = searchParams.get("next") || "/";

  const [mode, setMode] = useState<"login" | "register">("login");
  const [identifier, setIdentifier] = useState("");
  const [email, setEmail] = useState("");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [targetScore, setTargetScore] = useState(800);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (busy) return;
    setError(null);
    setBusy(true);

    try {
      const endpoint = mode === "login" ? "/api/auth/login" : "/api/auth/register";
      const body =
        mode === "login"
          ? { identifier: identifier.trim(), password }
          : {
              username: username.trim(),
              email: email.trim(),
              password,
              targetScore: Number(targetScore),
            };

      const res = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      const json = (await res.json()) as { ok?: boolean; error?: string };
      if (!res.ok || !json.ok) {
        throw new Error(json.error ?? "Gagal memproses autentikasi.");
      }

      if (mode === "register") {
        router.replace("/onboarding");
      } else {
        router.replace(nextPath.startsWith("/") ? nextPath : "/");
      }
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Terjadi kesalahan. Periksa kembali data kamu.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="min-h-screen bg-[var(--surface-canvas)] text-[var(--ink-primary)] flex flex-col">
      <header className="w-full max-w-[1080px] mx-auto px-5 py-5 flex items-center justify-between">
        <RasionalinLogo size={40} subtitle="Jalur Penguasaan UTBK 800+" />
        <span className="hidden sm:inline-flex items-center gap-1.5 text-xs font-extrabold text-[var(--accent-text-on-secondary)]">
          <TargetIcon size={18} />
          7 Subtes UTBK-SNBT
        </span>
      </header>

      <main className="flex-1 w-full max-w-[1080px] mx-auto px-5 py-6 sm:py-10 flex items-center">
        <div className="w-full grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-12 items-center">
          {/* Left Clean Editorial Column */}
          <section className="lg:col-span-6 space-y-7">
            <div className="space-y-3">
              <div className="inline-flex items-center gap-2 text-xs font-extrabold uppercase tracking-wider text-[var(--ochre-ink)]">
                <ShieldIcon size={18} />
                <span>Mulai dari Nol · Tanpa Panik</span>
              </div>
              <h1 className="text-3xl sm:text-[42px] font-bold leading-[1.15]">
                Bangun ulang fondasi, kejar skor{" "}
                <span className="text-[var(--accent-primary)]">SNBT 800+</span> dengan paham beneran.
              </h1>
              <p className="text-base font-semibold text-[var(--ink-secondary)] leading-relaxed max-w-xl">
                Dirancang khusus buat kamu yang mulai dari dasar: pahami alasan sebelum rumus, latihan ingatan aktif, dan tanya Tutor AI kapan pun buntu.
              </p>
            </div>

            <div className="divide-y divide-[var(--border-structural)] border-t border-b border-[var(--border-structural)]">
              {[
                {
                  icon: TutorChatIcon,
                  color: "text-[var(--accent-primary)]",
                  title: "Tutor AI Why Before How",
                  desc: "Selalu jelaskan mengapa konsep bekerja pakai analogi sederhana sebelum masuk rumus.",
                },
                {
                  icon: BrainIcon,
                  color: "text-[var(--ochre-ink)]",
                  title: "Active Recall & Spaced Repetition (FSRS)",
                  desc: "Setiap kesalahan dan materi dasar dijadwalkan ulang otomatis agar menempel kuat.",
                },
                {
                  icon: VerifyIcon,
                  color: "text-[var(--olive-ink)]",
                  title: "Matematika Terverifikasi Deterministik",
                  desc: "Setiap variasi soal hitungan dicek mesin kalkulasi agar bebas salah kunci.",
                },
              ].map((feat) => {
                const Icon = feat.icon;
                return (
                  <div key={feat.title} className="flex items-start gap-3.5 py-4">
                    <Icon size={24} className={`${feat.color} shrink-0 mt-0.5`} />
                    <div>
                      <h2 className="font-bold text-[15px]">{feat.title}</h2>
                      <p className="text-sm font-semibold text-[var(--ink-secondary)] mt-0.5 leading-relaxed">
                        {feat.desc}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          </section>

          {/* Right Single-Layer Login / Register Card (No Dummy Quick-Login) */}
          <section className="lg:col-span-6">
            <div className="card-tactile p-6 sm:p-8 space-y-6 max-w-[450px] mx-auto">
              <div
                className="grid grid-cols-2 border-b-2 border-[var(--border-structural)]"
                role="tablist"
                aria-label="Pilih masuk atau daftar akun"
              >
                <button
                  type="button"
                  role="tab"
                  aria-selected={mode === "login"}
                  onClick={() => {
                    setMode("login");
                    setError(null);
                  }}
                  className={`min-h-[44px] text-sm font-extrabold border-b-2 -mb-[2px] transition-colors cursor-pointer ${
                    mode === "login"
                      ? "border-[var(--accent-primary)] text-[var(--accent-text-on-secondary)]"
                      : "border-transparent text-[var(--ink-secondary)] hover:text-[var(--ink-primary)]"
                  }`}
                >
                  Masuk
                </button>
                <button
                  type="button"
                  role="tab"
                  aria-selected={mode === "register"}
                  onClick={() => {
                    setMode("register");
                    setError(null);
                  }}
                  className={`min-h-[44px] text-sm font-extrabold border-b-2 -mb-[2px] transition-colors cursor-pointer ${
                    mode === "register"
                      ? "border-[var(--accent-primary)] text-[var(--accent-text-on-secondary)]"
                      : "border-transparent text-[var(--ink-secondary)] hover:text-[var(--ink-primary)]"
                  }`}
                >
                  Daftar Akun
                </button>
              </div>

              <div>
                <h2 className="text-xl font-bold">
                  {mode === "login" ? "Masuk ke akunmu" : "Buat akun baru"}
                </h2>
                <p className="text-sm font-semibold text-[var(--ink-secondary)] mt-1">
                  {mode === "login"
                    ? "Gunakan email atau username serta kata sandi yang sudah terdaftar."
                    : "Daftar langsung pakai username, email, dan kata sandi tanpa verifikasi email."}
                </p>
              </div>

              <form onSubmit={handleSubmit} className="space-y-4">
                {mode === "login" ? (
                  <div>
                    <label htmlFor="auth-identifier" className="text-xs font-extrabold block mb-1.5">
                      Email atau Username
                    </label>
                    <input
                      id="auth-identifier"
                      type="text"
                      required
                      autoComplete="username"
                      value={identifier}
                      onChange={(e) => setIdentifier(e.target.value)}
                      placeholder="nama@email.com atau username"
                      className="input-tactile"
                    />
                  </div>
                ) : (
                  <>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                      <div className="sm:col-span-2">
                        <label htmlFor="auth-username" className="text-xs font-extrabold block mb-1.5">
                          Username
                        </label>
                        <input
                          id="auth-username"
                          type="text"
                          required
                          minLength={3}
                          maxLength={40}
                          autoComplete="username"
                          value={username}
                          onChange={(e) => setUsername(e.target.value)}
                          placeholder="Misal: stevy"
                          className="input-tactile"
                        />
                      </div>
                      <div>
                        <label htmlFor="auth-target" className="text-xs font-extrabold block mb-1.5">
                          Target IRT
                        </label>
                        <input
                          id="auth-target"
                          type="number"
                          min={200}
                          max={1000}
                          value={targetScore}
                          onChange={(e) => setTargetScore(Number(e.target.value))}
                          className="input-tactile font-num"
                        />
                      </div>
                    </div>

                    <div>
                      <label htmlFor="auth-email" className="text-xs font-extrabold block mb-1.5">
                        Email
                      </label>
                      <input
                        id="auth-email"
                        type="email"
                        required
                        autoComplete="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="nama@email.com"
                        className="input-tactile"
                      />
                    </div>
                  </>
                )}

                <div>
                  <label htmlFor="auth-password" className="text-xs font-extrabold block mb-1.5">
                    Kata Sandi
                  </label>
                  <input
                    id="auth-password"
                    type="password"
                    required
                    minLength={6}
                    autoComplete={mode === "login" ? "current-password" : "new-password"}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Minimal 6 karakter"
                    className="input-tactile"
                  />
                </div>

                {error && (
                  <div
                    role="alert"
                    className="p-3 rounded-xl border border-[var(--coral-border)] bg-[var(--coral-tint)] text-xs font-bold text-[var(--coral-ink)]"
                  >
                    {error}
                  </div>
                )}

                <button type="submit" disabled={busy} className="btn-primary w-full">
                  {mode === "login" ? (
                    <>
                      <span>{busy ? "Memproses..." : "Masuk"}</span>
                      <ArrowRightIcon size={17} />
                    </>
                  ) : (
                    <>
                      <CheckIcon size={16} />
                      <span>{busy ? "Mendaftarkan..." : "Daftar & Mulai Belajar"}</span>
                    </>
                  )}
                </button>
              </form>

              <p className="text-center text-xs font-semibold text-[var(--ink-secondary)]">
                {mode === "login" ? (
                  <>
                    Belum punya akun?{" "}
                    <button
                      type="button"
                      onClick={() => {
                        setMode("register");
                        setError(null);
                      }}
                      className="font-extrabold text-[var(--accent-text-on-secondary)] hover:underline cursor-pointer"
                    >
                      Daftar sekarang
                    </button>
                  </>
                ) : (
                  <>
                    Sudah punya akun?{" "}
                    <button
                      type="button"
                      onClick={() => {
                        setMode("login");
                        setError(null);
                      }}
                      className="font-extrabold text-[var(--accent-text-on-secondary)] hover:underline cursor-pointer"
                    >
                      Masuk di sini
                    </button>
                  </>
                )}
              </p>
            </div>
          </section>
        </div>
      </main>
    </div>
  );
}

export function LoginWorkspace() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-[var(--surface-canvas)] flex items-center justify-center text-sm font-bold text-[var(--ink-secondary)]">
          Menyiapkan halaman masuk...
        </div>
      }
    >
      <LoginFormContent />
    </Suspense>
  );
}
