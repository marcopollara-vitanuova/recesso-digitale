import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { Providers } from "./providers";
import { SkipLink } from "@/components/a11y/skip-link";

const inter = Inter({ subsets: ["latin"], variable: "--font-sans" });

export const metadata: Metadata = {
  title: "Recesso Digitale Polizze",
  description: "Esercita il diritto di recesso dalla tua polizza assicurativa online",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="it" className={inter.variable}>
      <body className="min-h-screen bg-[var(--background)] font-sans text-[var(--foreground)] antialiased">
        <SkipLink href="#contenuto-principale">Vai al contenuto principale</SkipLink>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
