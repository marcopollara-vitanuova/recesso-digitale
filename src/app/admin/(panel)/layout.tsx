import { AdminSidebar } from "@/components/admin/sidebar";

// Pagine admin: dati autenticati e sempre aggiornati, resi per-richiesta.
// Evita anche il prerender statico con query al DB durante la build (deploy robusti).
export const dynamic = "force-dynamic";

export default function AdminPanelLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen">
      <AdminSidebar />
      <main id="contenuto-admin" className="flex-1 overflow-auto bg-[var(--gray-50)] p-6 md:p-8">
        {children}
      </main>
    </div>
  );
}
