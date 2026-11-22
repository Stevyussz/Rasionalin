import "@fontsource-variable/fredoka";
import "@fontsource-variable/nunito";
import "@fontsource-variable/source-serif-4";
import "@fontsource/ibm-plex-mono/400.css";
import "@fontsource/ibm-plex-mono/500.css";
import "katex/dist/katex.min.css";
import type { Metadata, Viewport } from "next";
import { PwaServiceWorkerRegistrar } from "@/components/pwa/PwaInstallController";
import "./globals.css";

export const metadata: Metadata = {
  applicationName: "Rasionalin",
  title: {
    default: "Rasionalin | Belajar UTBK-SNBT 800+ dari Nol",
    template: "%s | Rasionalin",
  },
  description:
    "Platform belajar UTBK-SNBT dari nol hingga 800+ dengan prinsip Why Before How, Active Recall, Spaced Repetition FSRS, Tutor AI, dan Catatan Pribadi.",
  manifest: "/manifest.webmanifest",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "Rasionalin",
  },
  formatDetection: {
    telephone: false,
  },
  icons: {
    icon: [
      { url: "/icons/logo.svg", type: "image/svg+xml" },
      { url: "/icons/favicon-32.png", sizes: "32x32", type: "image/png" },
      { url: "/icons/icon-192.png", sizes: "192x192", type: "image/png" },
    ],
    apple: [{ url: "/icons/apple-touch-icon.png", sizes: "180x180", type: "image/png" }],
  },
};

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#16794B" },
    { media: "(prefers-color-scheme: dark)", color: "#16794B" },
  ],
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
};

const THEME_INIT_SCRIPT = `
(function () {
  try {
    var saved = localStorage.getItem("kejarsnbt_theme");
    if (saved === "warm" || saved === "dark") {
      document.documentElement.setAttribute("data-theme", "warm");
    } else {
      document.documentElement.setAttribute("data-theme", "daylight");
    }
  } catch (e) {}
})();
`;

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="id" data-theme="daylight" suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: THEME_INIT_SCRIPT }} />
      </head>
      <body>
        <PwaServiceWorkerRegistrar />
        {children}
      </body>
    </html>
  );
}
