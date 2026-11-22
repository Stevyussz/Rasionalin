"use client";

import Link from "next/link";
import React, { useEffect } from "react";

export default function AppErrorBoundary({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("Rasionalin UI Error Boundary:", error);
  }, [error]);

  return (
    <div className="min-h-screen bg-[var(--surface-canvas)] text-[var(--ink-primary)] flex items-center justify-center p-6">
      <div className="card-tactile max-w-md w-full p-6 sm:p-8 text-center space-y-4">
        <div className="text-xs font-extrabold uppercase tracking-wider text-[var(--coral-ink)]">
          Gangguan Sementara
        </div>
        <h1 className="text-2xl font-bold">Halaman perlu dimuat ulang</h1>
        <p className="text-sm font-semibold text-[var(--ink-secondary)] leading-relaxed">
          Tenang, progres belajarmu tetap tersimpan aman. Klik tombol di bawah untuk melanjutkan.
        </p>
        <div className="flex flex-col sm:flex-row gap-2.5 pt-2">
          <button type="button" onClick={() => reset()} className="btn-primary flex-1">
            Muat Ulang Halaman
          </button>
          <Link href="/" className="btn-secondary flex-1">
            Ke Beranda
          </Link>
        </div>
      </div>
    </div>
  );
}
