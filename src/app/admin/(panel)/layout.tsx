import { AdminSidebar } from "@/components/admin/sidebar";

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
