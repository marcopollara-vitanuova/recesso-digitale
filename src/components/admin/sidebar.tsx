"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOut } from "next-auth/react";
import { cn } from "@/lib/utils";

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
    <aside className="flex w-64 flex-col border-r border-slate-200 bg-slate-900 text-slate-100">
      <div className="border-b border-slate-700 p-6">
        <p className="text-lg font-bold text-white">Recesso Digitale</p>
        <p className="text-xs text-teal-300">Pannello amministrativo</p>
      </div>
      <nav className="flex-1 space-y-1 p-3">
        {links.map((link) => (
          <Link
            key={link.href}
            href={link.href}
            className={cn(
              "block rounded-lg px-3 py-2 text-sm font-medium transition-colors",
              pathname === link.href || (link.href !== "/admin" && pathname.startsWith(link.href))
                ? "bg-slate-800 text-white"
                : "text-slate-300 hover:bg-slate-800 hover:text-white",
            )}
          >
            {link.label}
          </Link>
        ))}
      </nav>
      <div className="border-t border-slate-700 p-4">
        <button
          type="button"
          onClick={() => signOut({ callbackUrl: "/admin/login" })}
          className="w-full rounded-lg bg-slate-800 px-3 py-2 text-sm hover:bg-slate-700"
        >
          Esci
        </button>
      </div>
    </aside>
  );
}
