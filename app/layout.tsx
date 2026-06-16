import "./globals.css";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Landscape AI Studio",
  description: "Studio IA pour projets de paysage, analyses, SWOT et idees d'amenagement."
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
