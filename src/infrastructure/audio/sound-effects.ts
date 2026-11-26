"use client";

const SOUND_PREF_KEY = "rasionalin_sound_enabled";

declare global {
  var __rasionalinAudioCtx: AudioContext | undefined;
}

export function isSoundEnabled(): boolean {
  if (typeof window === "undefined") return true;
  try {
    const val = localStorage.getItem(SOUND_PREF_KEY);
    return val !== "false";
  } catch {
    return true;
  }
}

export function setSoundEnabled(enabled: boolean): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(SOUND_PREF_KEY, enabled ? "true" : "false");
    window.dispatchEvent(
      new CustomEvent("rasionalin:sound-changed", { detail: { enabled } }),
    );
  } catch {
    // Ignore storage quota / private mode issues
  }
}

function getAudioContext(): AudioContext | null {
  if (typeof window === "undefined" || !isSoundEnabled()) return null;
  try {
    const w = window as unknown as {
      AudioContext?: typeof AudioContext;
      webkitAudioContext?: typeof AudioContext;
    };
    const Ctor = w.AudioContext ?? w.webkitAudioContext;
    if (!Ctor) return null;
    if (!globalThis.__rasionalinAudioCtx) {
      globalThis.__rasionalinAudioCtx = new Ctor();
    }
    const ctx = globalThis.__rasionalinAudioCtx;
    if (ctx.state === "suspended") {
      void ctx.resume();
    }
    return ctx;
  } catch {
    return null;
  }
}

function playTone(
  ctx: AudioContext,
  freqHz: number,
  startDelaySec: number,
  durationSec: number,
  type: OscillatorType,
  peakGain: number,
  slideToHz?: number,
): void {
  const start = ctx.currentTime + startDelaySec;
  const end = start + durationSec;

  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  osc.type = type;
  osc.frequency.setValueAtTime(freqHz, start);
  if (slideToHz !== undefined) {
    osc.frequency.exponentialRampToValueAtTime(slideToHz, end);
  }

  gain.gain.setValueAtTime(0.0001, start);
  gain.gain.linearRampToValueAtTime(peakGain, start + Math.min(0.015, durationSec * 0.25));
  gain.gain.exponentialRampToValueAtTime(0.0001, end);

  osc.connect(gain);
  gain.connect(ctx.destination);
  osc.start(start);
  osc.stop(end + 0.02);
}

/** Crisp tactile UI click pop */
export function playTapSound(): void {
  const ctx = getAudioContext();
  if (!ctx) return;
  playTone(ctx, 500, 0, 0.045, "sine", 0.055, 640);
}

/** Cheerful Duolingo-style two-note chime for a right answer */
export function playCorrectSound(): void {
  const ctx = getAudioContext();
  if (!ctx) return;
  playTone(ctx, 523.25, 0, 0.11, "sine", 0.13); // C5
  playTone(ctx, 659.25, 0.085, 0.18, "sine", 0.15); // E5
  playTone(ctx, 783.99, 0.09, 0.19, "triangle", 0.055); // soft G5 shimmer
}

/** Gentle encouraging descending bonk when an answer slips */
export function playWrongSound(): void {
  const ctx = getAudioContext();
  if (!ctx) return;
  playTone(ctx, 329.63, 0, 0.12, "triangle", 0.11); // E4
  playTone(ctx, 261.63, 0.11, 0.2, "triangle", 0.1); // C4
}

/** Sparkling combo arpeggio pitched slightly higher with streak */
export function playStreakSound(streak: number): void {
  const ctx = getAudioContext();
  if (!ctx) return;
  const boost = 1 + Math.min(streak, 7) * 0.035;
  playTone(ctx, 523.25 * boost, 0, 0.09, "sine", 0.11);
  playTone(ctx, 659.25 * boost, 0.065, 0.09, "sine", 0.12);
  playTone(ctx, 783.99 * boost, 0.13, 0.12, "sine", 0.13);
  playTone(ctx, 1046.5 * boost, 0.195, 0.22, "triangle", 0.1);
}

/** Triumphant completion melody when finishing a sprint or unlocking a node */
export function playCelebrationFanfare(): void {
  const ctx = getAudioContext();
  if (!ctx) return;
  const notes = [
    { f: 523.25, d: 0.0, len: 0.1 }, // C5
    { f: 659.25, d: 0.085, len: 0.1 }, // E5
    { f: 783.99, d: 0.17, len: 0.11 }, // G5
    { f: 987.77, d: 0.26, len: 0.11 }, // B5
    { f: 1046.5, d: 0.36, len: 0.38 }, // C6
  ];
  for (const n of notes) {
    playTone(ctx, n.f, n.d, n.len, "sine", 0.12);
    playTone(ctx, n.f * 0.5, n.d, n.len, "triangle", 0.045);
  }
}
