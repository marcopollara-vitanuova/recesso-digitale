import Image from "next/image";
import Link from "next/link";

const LOGO_URL = "https://cdn.axieme.com/gruppovitanuova/loghi/vitanuova-logo.svg";

type SiteHeaderProps = {
  title: string;
  subtitle?: string;
  overtitle?: string;
};

export function SiteHeader({
  title,
  subtitle = "Servizio online per inviare la richiesta di recesso della polizza assicurativa.",
  overtitle = "Vitanuova Previdenza e Protezione",
}: SiteHeaderProps) {
  return (
    <header className="vn-page-hero">
      <div className="vn-container">
        <div className="flex flex-col items-center gap-6 text-center md:flex-row md:items-center md:text-left">
          <Link
            href="https://vitanuova.it"
            target="_blank"
            rel="noopener noreferrer"
            className="link-external shrink-0 rounded-lg focus-visible:outline-offset-4"
            aria-label="Vitanuova — sito istituzionale (si apre in una nuova scheda)"
          >
            <Image
              src={LOGO_URL}
              alt="Vitanuova"
              width={180}
              height={48}
              className="h-10 w-auto md:h-12"
              priority
            />
          </Link>
          <div className="flex-1 border-t border-[var(--gray-200)] pt-6 md:border-t-0 md:border-l md:pl-8 md:pt-0">
            <p className="vn-overtitle">{overtitle}</p>
            <h1 className="mt-2 text-3xl tracking-tight md:text-4xl md:leading-tight">{title}</h1>
            {subtitle ? <p className="vn-subtitle mt-3 max-w-2xl">{subtitle}</p> : null}
          </div>
        </div>
      </div>
    </header>
  );
}
