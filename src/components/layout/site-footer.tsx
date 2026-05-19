import Link from "next/link";

export function SiteFooter() {
  return (
    <footer className="mt-auto border-t border-[var(--gray-200)] bg-white py-8">
      <div className="vn-container flex flex-col gap-4 text-sm text-[var(--gray-600)] md:flex-row md:items-center md:justify-between">
        <p>© {new Date().getFullYear()} Vitanuova S.p.A. — Tutti i diritti riservati</p>
        <nav aria-label="Link utili">
          <ul className="flex flex-wrap gap-4">
            <li>
              <Link href="https://vitanuova.it" className="underline-offset-2 hover:underline">
                Sito istituzionale
              </Link>
            </li>
            <li>
              <Link href="https://vitanuova.it/iubenda" className="underline-offset-2 hover:underline">
                Privacy e cookie
              </Link>
            </li>
          </ul>
        </nav>
      </div>
    </footer>
  );
}
