"use client";

import React, { useEffect, useState } from "react";
import { CloseIcon, DeviceMobileIcon, DownloadIcon } from "@/components/icons/ArchitecturalIcons";
import { RasionalinLogo } from "@/components/brand/RasionalinLogo";

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed"; platform: string }>;
}

/**
 * Registers the PWA Service Worker once per session globally in RootLayout.
 */
export function PwaServiceWorkerRegistrar() {
  useEffect(() => {
    if (typeof window === "undefined" || !("serviceWorker" in navigator)) return;
    navigator.serviceWorker.register("/sw.js", { scope: "/" }).catch(() => {
      // Non-fatal in restricted browser contexts
    });
  }, []);

  return null;
}

/**
 * Compact, non-intrusive PWA Install Button + iOS Guide Modal for AppShell.
 */
export function PwaInstallButton({ compact = false }: { compact?: boolean }) {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [installed, setInstalled] = useState(false);
  const [isIos, setIsIos] = useState(false);
  const [iosGuideOpen, setIosGuideOpen] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") return;

    const standalone =
      window.matchMedia("(display-mode: standalone)").matches ||
      Boolean((navigator as Navigator & { standalone?: boolean }).standalone);
    if (standalone) {
      setInstalled(true);
      return;
    }

    const ua = navigator.userAgent.toLowerCase();
    const iosDevice = /iphone|ipad|ipod/.test(ua);
    setIsIos(iosDevice);

    function onBeforeInstallPrompt(e: Event) {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
    }

    function onAppInstalled() {
      setInstalled(true);
      setDeferredPrompt(null);
    }

    window.addEventListener("beforeinstallprompt", onBeforeInstallPrompt);
    window.addEventListener("appinstalled", onAppInstalled);
    return () => {
      window.removeEventListener("beforeinstallprompt", onBeforeInstallPrompt);
      window.removeEventListener("appinstalled", onAppInstalled);
    };
  }, []);

  if (installed) return null;
  if (!deferredPrompt && !isIos) return null;

  async function handleInstallClick() {
    if (deferredPrompt) {
      await deferredPrompt.prompt();
      const choice = await deferredPrompt.userChoice;
      if (choice.outcome === "accepted") {
        setInstalled(true);
      }
      setDeferredPrompt(null);
      return;
    }
    if (isIos) {
      setIosGuideOpen(true);
    }
  }

  return (
    <>
      {compact ? (
        <button
          type="button"
          onClick={() => void handleInstallClick()}
          title="Pasang aplikasi Rasionalin di HP"
          aria-label="Pasang aplikasi Rasionalin di HP"
          className="inline-flex items-center gap-1 px-2.5 min-h-[36px] rounded-lg bg-[var(--accent-tint)] text-[var(--accent-text-on-secondary)] text-xs font-extrabold cursor-pointer"
        >
          <DownloadIcon size={16} />
          <span>Pasang</span>
        </button>
      ) : (
        <button
          type="button"
          onClick={() => void handleInstallClick()}
          className="w-full flex items-center gap-2.5 px-2.5 min-h-[42px] rounded-xl text-xs font-extrabold text-[var(--accent-text-on-secondary)] bg-[var(--accent-tint)] hover:opacity-90 cursor-pointer transition-opacity"
        >
          <DeviceMobileIcon size={19} className="text-[var(--accent-primary)]" />
          <span>Pasang Aplikasi (HP/PC)</span>
        </button>
      )}

      {iosGuideOpen && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label="Cara pasang Rasionalin di iPhone dan iPad"
          className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4"
        >
          <div className="w-full max-w-sm card-tactile p-6 space-y-4">
            <div className="flex items-center justify-between gap-2">
              <RasionalinLogo size={32} compact />
              <button
                type="button"
                onClick={() => setIosGuideOpen(false)}
                aria-label="Tutup panduan pasang iOS"
                className="p-1.5 rounded-lg text-[var(--ink-secondary)] hover:bg-[var(--surface-secondary)] cursor-pointer"
              >
                <CloseIcon size={17} />
              </button>
            </div>
            <div className="space-y-2 text-sm">
              <h2 className="font-bold text-base">Pasang Rasionalin di Layar Utama iPhone</h2>
              <ol className="list-decimal pl-5 space-y-1.5 text-xs font-semibold text-[var(--ink-secondary)] leading-relaxed">
                <li>
                  Ketuk ikon <strong>Bagikan (Share)</strong> di bar bawah Safari.
                </li>
                <li>
                  Gulir lalu pilih <strong>Tambah ke Layar Utama (Add to Home Screen)</strong>.
                </li>
                <li>
                  Ketuk <strong>Tambah</strong>. Rasionalin siap dibuka penuh seperti aplikasi native!
                </li>
              </ol>
            </div>
            <button
              type="button"
              onClick={() => setIosGuideOpen(false)}
              className="btn-primary w-full text-xs"
            >
              Mengerti
            </button>
          </div>
        </div>
      )}
    </>
  );
}
