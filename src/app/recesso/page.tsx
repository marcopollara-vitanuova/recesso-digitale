import type { Metadata } from "next";
import { getAppSettings } from "@/lib/settings";
import { RecessoFlow } from "@/components/recesso/recesso-flow";
import { SiteHeader } from "@/components/layout/site-header";
import { SiteFooter } from "@/components/layout/site-footer";

export const metadata: Metadata = {
  title: "Recesso digitale polizze",
  description:
    "Compila e invia la richiesta di recesso della polizza assicurativa online. Servizio sicuro di Vitanuova Previdenza e Protezione.",
  openGraph: {
    title: "Recesso digitale polizze | Vitanuova",
    description:
      "Esercita il diritto di recesso online: compila il modulo, verifica i dati e invia la richiesta alla compagnia.",
    url: "/recesso",
  },
  alternates: {
    canonical: "/recesso",
  },
};

export default async function RecessoPage() {
  const settings = await getAppSettings();

  if (!settings.publicFormEnabled) {
    return (
      <div className="flex min-h-screen flex-col">
        <SiteHeader title="Recesso digitale polizze" subtitle={settings.maintenanceMessage} />
        <main id="contenuto-principale" className="vn-container flex-1 py-10">
          <div
            className="mx-auto max-w-xl rounded-2xl border-2 border-[var(--warning-500)] bg-[var(--warning-200)] p-8 text-center"
            role="alert"
          >
            <h2 className="text-xl font-semibold text-[var(--primary-900)]">Servizio non disponibile</h2>
            <p className="mt-2 text-[var(--gray-700)]">{settings.maintenanceMessage}</p>
          </div>
        </main>
        <SiteFooter />
      </div>
    );
  }

  return (
    <div className="flex min-h-screen flex-col">
      <SiteHeader title="Recesso digitale polizze" />
      <main id="contenuto-principale" className="vn-container flex-1 py-8 md:py-12">
        <RecessoFlow privacyUrl={settings.privacyPolicyUrl} />
      </main>
      <SiteFooter />
    </div>
  );
}
