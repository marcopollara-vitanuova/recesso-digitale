import type { Metadata } from "next";

const siteUrl =
  process.env.APP_BASE_URL?.replace(/\/$/, "") ??
  process.env.NEXTAUTH_URL?.replace(/\/$/, "") ??
  "https://recesso-digitale.vercel.app";

const title = "Recesso digitale polizze | Vitanuova";
const description =
  "Invia online la richiesta di recesso della tua polizza assicurativa. Servizio Vitanuova Previdenza e Protezione: semplice, tracciato e conforme.";

const ogImage = {
  url: "/og-image.png",
  width: 300,
  height: 81,
  alt: "Vitanuova Previdenza e Protezione",
};

/** Logo ufficiale (stesso CDN del sito istituzionale) */
export const VITANUOVA_LOGO_URL =
  "https://cdn.axieme.com/gruppovitanuova/loghi/vitanuova-logo.svg";

export const siteMetadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: title,
    template: "%s | Vitanuova",
  },
  description,
  applicationName: "Recesso Digitale Vitanuova",
  authors: [{ name: "Vitanuova S.p.A." }],
  creator: "Vitanuova S.p.A.",
  publisher: "Vitanuova S.p.A.",
  category: "assicurazioni",
  robots: {
    index: true,
    follow: true,
  },
  icons: {
    icon: [{ url: "/favicon.svg", type: "image/svg+xml" }],
    shortcut: ["/favicon.svg"],
    apple: [{ url: "/favicon.svg", type: "image/svg+xml" }],
  },
  openGraph: {
    type: "website",
    locale: "it_IT",
    url: siteUrl,
    siteName: "Vitanuova Previdenza e Protezione",
    title,
    description,
    images: [ogImage],
  },
  twitter: {
    card: "summary_large_image",
    title,
    description,
    images: [ogImage.url],
  },
  alternates: {
    canonical: `${siteUrl}/recesso`,
  },
};
