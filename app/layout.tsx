import "./globals.css";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Landscape AI Studio",
  description: "V0.3 - Analyse paysagere, benchmark visuel, idees et plan texture."
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="fr">
      <body>
        <main className="mx-auto min-h-screen max-w-7xl px-5 py-6 sm:px-8 sm:py-8">{children}</main>
      </body>
    </html>
  );
}
