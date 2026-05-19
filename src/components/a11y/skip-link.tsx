export function SkipLink({ href, children }: { href: string; children: React.ReactNode }) {
  return (
    <a href={href} className="skip-link">
      {children}
    </a>
  );
}
