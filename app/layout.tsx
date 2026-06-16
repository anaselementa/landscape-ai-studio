import "./globals.css";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Landscape AI Studio",
  description: "Prototype IA pour architecture de paysage"
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="fr">
      <body>
        <main className="mx-auto min-h-screen max-w-6xl px-6 py-8">{children}</main>
      </body>
    </html>
  );
}
