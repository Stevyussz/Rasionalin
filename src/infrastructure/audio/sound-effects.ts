"use client";

const SOUND_PREF_KEY = "rasionalin_sound_enabled";

declare global {
  var __rasionalinAudioCtx: AudioContext | undefined;
  var __rasionalinMasterNode: AudioNode | undefined;
  var __rasionalinAudioUnlockInstalled: boolean | undefined;
}

export function isSoundEnabled(): boolean {
  if (typeof window === "undefined") return true;
  try {
    return localStorage.getItem(SOUND_PREF_KEY) !== "false";
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

function ensureAudioNodes(): { ctx: AudioContext; dest: AudioNode } | null {
  if (typeof window === "undefined") return null;
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

    if (!globalThis.__rasionalinMasterNode) {
      // Soft compressor keeps loud multi-note combos crisp without clipping on mobile speakers
      const comp = ctx.createDynamicsCompressor();
      comp.threshold.setValueAtTime(-16, ctx.currentTime);
      comp.knee.setValueAtTime(18, ctx.currentTime);
      comp.ratio.setValueAtTime(4, ctx.currentTime);
      comp.attack.setValueAtTime(0.004, ctx.currentTime);
      comp.release.setValueAtTime(0.12, ctx.currentTime);

      const master = ctx.createGain();
      master.gain.setValueAtTime(1.15, ctx.currentTime);

      comp.connect(master);
      master.connect(ctx.destination);
      globalThis.__rasionalinMasterNode = comp;
    }

    return { ctx, dest: globalThis.__rasionalinMasterNode };
  } catch {
    return null;
  }
}

/** Call inside user gestures (or before async fetch) so browsers allow Web Audio playback */
export function unlockAudioContext(): void {
  if (typeof window === "undefined") return;
  const nodes = ensureAudioNodes();
  if (!nodes) return;
  const { ctx } = nodes;
  try {
    if (ctx.state === "suspended") {
      void ctx.resume();
    }
    // 1-sample silent trigger unlocks iOS Safari & strict Chromium autoplay policies
    const buf = ctx.createBuffer(1, 1, 22050);
    const src = ctx.createBufferSource();
    src.buffer = buf;
    src.connect(ctx.destination);
    src.start(0);
  } catch {
    // Ignore audio context edge errors
  }
}

/** Idempotently attaches global first-gesture unlock listeners on window */
export function installGlobalAudioUnlock(): void {
  if (typeof window === "undefined" || globalThis.__rasionalinAudioUnlockInstalled) return;
  globalThis.__rasionalinAudioUnlockInstalled = true;
  const onFirstGesture = () => {
    unlockAudioContext();
  };
  window.addEventListener("pointerdown", onFirstGesture, { passive: true });
  window.addEventListener("keydown", onFirstGesture, { passive: true });
}

function withReadyAudio(fn: (ctx: AudioContext, dest: AudioNode) => void): void {
  if (typeof window === "undefined" || !isSoundEnabled()) return;
  const nodes = ensureAudioNodes();
  if (!nodes) return;
  const { ctx, dest } = nodes;

  if (ctx.state === "running") {
    try {
      fn(ctx, dest);
    } catch {
      // Ignore transient Web Audio error
    }
    return;
  }

  // Wait for resume() instead of scheduling oscillators while suspended
  void ctx
    .resume()
    .then(() => {
      if (ctx.state === "running") {
        fn(ctx, dest);
      }
    })
    .catch(() => {
      // Autoplay blocked before first gesture
    });
}

function playTone(
  ctx: AudioContext,
  dest: AudioNode,
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
  gain.gain.linearRampToValueAtTime(peakGain, start + Math.min(0.014, durationSec * 0.25));
  gain.gain.exponentialRampToValueAtTime(0.0001, end);

  osc.connect(gain);
  gain.connect(dest);
  osc.start(start);
  osc.stop(end + 0.025);
}

/** Crisp tactile marimba/wood click */
export function playTapSound(): void {
  withReadyAudio((ctx, dest) => {
    playTone(ctx, dest, 520, 0, 0.05, "sine", 0.18, 720);
  });
}

/** Light magical sparkle chime when revealing hints or flipping memory cards */
export function playHintSound(): void {
  withReadyAudio((ctx, dest) => {
    playTone(ctx, dest, 880, 0, 0.08, "sine", 0.18); // A5
    playTone(ctx, dest, 1318.51, 0.055, 0.14, "triangle", 0.16); // E6
  });
}

/** Satisfying ding when ticking off a daily block or FSRS card */
export function playCheckSound(): void {
  withReadyAudio((ctx, dest) => {
    playTone(ctx, dest, 783.99, 0, 0.08, "sine", 0.22); // G5
    playTone(ctx, dest, 1046.5, 0.06, 0.18, "sine", 0.24); // C6
  });
}

/** Bright Duolingo-style two-note chime for a right answer */
export function playCorrectSound(): void {
  withReadyAudio((ctx, dest) => {
    playTone(ctx, dest, 523.25, 0, 0.11, "sine", 0.28); // C5
    playTone(ctx, dest, 659.25, 0.08, 0.2, "sine", 0.30); // E5
    playTone(ctx, dest, 783.99, 0.085, 0.22, "triangle", 0.12); // G5 harmonic shimmer
  });
}

/** Friendly encouraging descending bonk when an answer misses */
export function playWrongSound(): void {
  withReadyAudio((ctx, dest) => {
    playTone(ctx, dest, 329.63, 0, 0.13, "triangle", 0.26); // E4
    playTone(ctx, dest, 261.63, 0.11, 0.22, "triangle", 0.24); // C4
    playTone(ctx, dest, 196.0, 0.12, 0.2, "sine", 0.10); // subtle warm G3 body
  });
}

/** Tiered exciting combo arpeggio (2x Double -> 3x Triple -> 4x Quadra -> 5x+ Godlike) */
export function playStreakSound(streak: number): void {
  withReadyAudio((ctx, dest) => {
    if (streak <= 2) {
      playTone(ctx, dest, 523.25, 0, 0.09, "sine", 0.26); // C5
      playTone(ctx, dest, 659.25, 0.065, 0.1, "sine", 0.28); // E5
      playTone(ctx, dest, 783.99, 0.13, 0.19, "triangle", 0.30); // G5
      return;
    }

    if (streak === 3) {
      playTone(ctx, dest, 523.25, 0, 0.08, "sine", 0.26); // C5
      playTone(ctx, dest, 659.25, 0.055, 0.09, "sine", 0.28); // E5
      playTone(ctx, dest, 783.99, 0.11, 0.1, "sine", 0.30); // G5
      playTone(ctx, dest, 1046.5, 0.165, 0.24, "triangle", 0.33); // C6
      return;
    }

    if (streak === 4) {
      const notes = [587.33, 739.99, 880.0, 1174.66, 1479.98]; // D5 F#5 A5 D6 F#6
      notes.forEach((freq, idx) => {
        playTone(
          ctx,
          dest,
          freq,
          idx * 0.055,
          idx === notes.length - 1 ? 0.26 : 0.09,
          idx >= 3 ? "triangle" : "sine",
          0.28 + idx * 0.015,
        );
      });
      return;
    }

    // 5x Penta / 6x+ Godlike fanfare burst
    const scaleBoost = streak >= 6 ? 1.06 : 1.0;
    const notes = [523.25, 659.25, 783.99, 1046.5, 1318.51, 1567.98];
    notes.forEach((freq, idx) => {
      playTone(
        ctx,
        dest,
        freq * scaleBoost,
        idx * 0.05,
        idx === notes.length - 1 ? 0.34 : 0.09,
        idx >= 3 ? "triangle" : "sine",
        0.30 + idx * 0.015,
      );
    });
    playTone(ctx, dest, 261.63 * scaleBoost, 0.25, 0.34, "triangle", 0.16);
  });
}

/** Triumphant completion melody when finishing a sprint or unlocking a node */
export function playCelebrationFanfare(): void {
  withReadyAudio((ctx, dest) => {
    const notes = [
      { f: 523.25, d: 0.0, len: 0.1 }, // C5
      { f: 659.25, d: 0.08, len: 0.1 }, // E5
      { f: 783.99, d: 0.16, len: 0.11 }, // G5
      { f: 987.77, d: 0.245, len: 0.11 }, // B5
      { f: 1046.5, d: 0.34, len: 0.42 }, // C6
    ];
    for (const n of notes) {
      playTone(ctx, dest, n.f, n.d, n.len, "sine", 0.30);
      playTone(ctx, dest, n.f * 0.5, n.d, n.len, "triangle", 0.13);
    }
    // Warm final triad shimmer
    playTone(ctx, dest, 659.25, 0.35, 0.38, "triangle", 0.14);
    playTone(ctx, dest, 783.99, 0.35, 0.38, "triangle", 0.14);
  });
}
