import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "LyricsFind",
  description: "Recherche de paroles pour ProPresenter / Lyrics search tool for ProPresenter",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="fr">
      <body className="min-h-screen bg-[#0f1117] text-slate-200 font-sans antialiased">
        {children}
      </body>
    </html>
  );
}
