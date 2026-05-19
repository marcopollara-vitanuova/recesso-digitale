import { getAppSettings } from "@/lib/settings";
import { RecessoFlow } from "@/components/recesso/recesso-flow";

export default async function RecessoPage() {
  const settings = await getAppSettings();

  if (!settings.publicFormEnabled) {
    return (
      <div className="mx-auto max-w-xl rounded-xl border border-amber-200 bg-amber-50 p-8 text-center">
        <h1 className="text-xl font-semibold text-amber-900">Servizio non disponibile</h1>
        <p className="mt-2 text-amber-800">{settings.maintenanceMessage}</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 px-4 py-10">
      <div className="mb-8 text-center">
        <p className="text-sm font-medium uppercase tracking-wide text-teal-700">Vitanuova</p>
        <h1 className="mt-1 text-3xl font-bold text-slate-900">Recesso digitale polizze</h1>
      </div>
      <RecessoFlow privacyUrl={settings.privacyPolicyUrl} />
    </div>
  );
}
