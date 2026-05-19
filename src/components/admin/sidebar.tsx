"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOut } from "next-auth/react";
import { cn } from "@/lib/utils";
import { SkipLink } from "@/components/a11y/skip-link";

const links = [
  { href: "/admin", label: "Dashboard" },
  { href: "/admin/withdrawal-requests", label: "Richieste recesso" },
  { href: "/admin/insurance-companies", label: "Compagnie" },
  { href: "/admin/email-templates", label: "Template email" },
  { href: "/admin/settings", label: "Configurazioni" },
  { href: "/admin/audit-logs", label: "Audit log" },
];

export function AdminSidebar() {
  const pathname = usePathname();

  return (
    <>
      <SkipLink href="#contenuto-admin">Vai al contenuto principale</SkipLink>
      <aside
        className="flex w-64 flex-col border-r border-[var(--primary-950)] bg-[var(--primary-900)] text-white"
        aria-label="Area amministrativa"
      >
        <div className="border-b border-[var(--primary-800)] p-6">
          <p className="text-lg font-bold">Recesso Digitale</p>
          <p className="text-sm font-medium text-[var(--primary-200)]">Pannello amministrativo</p>
        </div>
        <nav className="flex-1 space-y-1 p-3" aria-label="Navigazione amministrativa">
          {links.map((link) => {
            const active =
              pathname === link.href || (link.href !== "/admin" && pathname.startsWith(link.href));

            return (
              <Link
                key={link.href}
                href={link.href}
                aria-current={active ? "page" : undefined}
                className={cn(
                  "block rounded-lg px-3 py-2 text-sm font-semibold transition-colors focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[var(--primary-400)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--primary-900)]",
                  active
                    ? "bg-[var(--primary-800)] text-white"
                    : "text-[var(--primary-100)] hover:bg-[var(--primary-800)] hover:text-white",
                )}
              >
                {link.label}
              </Link>
            );
          })}
        </nav>
        <div className="border-t border-[var(--primary-800)] p-4">
          <button
            type="button"
            onClick={() => signOut({ callbackUrl: "/admin/login" })}
            className="w-full rounded-lg border border-[var(--primary-600)] bg-[var(--primary-800)] px-3 py-2 text-sm font-bold text-white hover:bg-[var(--primary-700)] focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[var(--primary-400)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--primary-900)]"
          >
            Esci dalla sessione
          </button>
        </div>
      </aside>
    </>
  );
}
