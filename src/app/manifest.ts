import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    id: "/",
    name: "Rasionalin - Belajar UTBK SNBT dari Nol",
    short_name: "Rasionalin",
    description:
      "Platform belajar UTBK-SNBT dari nol hingga 800+ dengan prinsip Why Before How, Active Recall FSRS, dan Tutor AI.",
    start_url: "/",
    scope: "/",
    display: "standalone",
    orientation: "portrait",
    background_color: "#FAF9F5",
    theme_color: "#16794B",
    lang: "id",
    categories: ["education", "productivity"],
    icons: [
      {
        src: "/icons/icon-192.png",
        sizes: "192x192",
        type: "image/png",
        purpose: "any",
      },
      {
        src: "/icons/icon-512.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "any",
      },
      {
        src: "/icons/icon-maskable-512.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "maskable",
      },
    ],
    shortcuts: [
      {
        name: "Mulai Latihan",
        short_name: "Latihan",
        url: "/study",
        icons: [{ src: "/icons/icon-192.png", sizes: "192x192", type: "image/png" }],
      },
      {
        name: "Tanya AI",
        short_name: "Tanya AI",
        url: "/tutor",
        icons: [{ src: "/icons/icon-192.png", sizes: "192x192", type: "image/png" }],
      },
      {
        name: "Tryout SNBT",
        short_name: "Tryout",
        url: "/simulation",
        icons: [{ src: "/icons/icon-192.png", sizes: "192x192", type: "image/png" }],
      },
    ],
  };
}
