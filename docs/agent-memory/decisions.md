# Decisioni — Recesso Digitale Polizze

> Registro decisionale. Ogni scelta rilevante va annotata qui (ADR leggero).

## Convenzioni
- Formato: `[DATA] Titolo — Decisione — Motivazione — Reversibilità`

---

## Storico

### [pre-2026-06] Stack e fondamenta
- **Prisma bloccato a 6.19.3** — non aggiornare a 7. Motivo: evitare breaking changes major in fase 1. Reversibile: upgrade pianificabile a parte.
- **Migrazioni fuori dal build Vercel** — `build` = `prisma generate && next build`. Motivo: i builder Vercel non raggiungono il Postgres diretto Supabase (P1001). Le migrazioni si applicano da locale con `db:migrate:deploy`.
- **Soft delete compagnie** — `DELETE /api/admin/insurance-companies/[id]` imposta `isActive=false` (azione audit `DISABLE_COMPANY`), non cancella il record. Motivo: `WithdrawalRequest` referenzia `InsuranceCompany` (FK non cascade) e conserva snapshot nome/email; cancellare romperebbe integrità storica. Reversibile: riattivazione via update.
- **Snapshot dati compagnia su richiesta** — `WithdrawalRequest` salva `insuranceCompanyNameSnapshot` / `insuranceCompanyEmailSnapshot` / `brokerEmailSnapshot`. Motivo: tracciabilità legale immutabile anche se la compagnia cambia.
- **Fallback template email** — se la riga `EmailTemplate` non esiste o è `isActive=false`, `getRenderedTemplate` usa i FALLBACK hardcoded in `lib/email/templates.ts`. Motivo: garantire invio anche senza configurazione DB.
- **Audit log su tutte le scritture admin** — `writeAuditLog` con before/after JSON. Fornisce già una traccia storica (no versioning dedicato necessario in fase 1).

### [2026-06] UI e brand
- **Allineamento al design system vitanuova.it** — token colore (`--primary-*` blu #1560B9, gray scale), font Inter, bottoni stile `.button-primary/secondary`, card radius 16px. Logo e favicon presi da CDN/sito ufficiale.
- **Metadata condivisione** — Open Graph + Twitter card centralizzati in `src/lib/site-metadata.ts`, favicon `public/favicon.svg` + `src/app/icon.svg`, OG image `public/og-image.png`.
- **Accessibilità WCAG/AgID** — skip link, landmark, `FormField` con aria-describedby/aria-invalid, focus ring 4px, label collegate, tabelle con caption/scope, StatusBadge in italiano.
- **Security headers** in `next.config.ts` (HSTS, X-Frame-Options DENY, nosniff, Referrer-Policy, Permissions-Policy).

### [2026-06-24] Sessione corrente — APPROVATA e implementata
- **Memoria operativa su file** — introdotta cartella `docs/agent-memory/` come fonte primaria del contesto.
- **UI Compagnie CRUD** — scelta UX: pagina lista + bottone globale "Nuova compagnia" + CTA per riga (Modifica / Disabilita-Riattiva) con **modale** (`components/ui/modal.tsx`, accessibile: role=dialog, focus trap, ESC). Conferma esplicita per disabilita/riattiva. Riuso API esistenti.
- **Hardening API Compagnie** — gestione `Prisma P2002` (internalCode duplicato) → HTTP 409 `DUPLICATE_CODE`; 404 se id inesistente; messaggi Zod puntuali.
- **Soft delete confermato** — DELETE compagnia = `isActive=false` (mai hard delete: FK da WithdrawalRequest + snapshot storici).
- **Template Mail editor** — editing inline di subject, bodyText e **bodyHtml** (formattazione) con lista variabili, preview con dati esempio, toggle attivo/fallback.
- **Supporto HTML email** — `send.ts` ora invia `html` quando il template lo definisce; le variabili in contesto HTML sono **escaped** (anti-injection). Se `bodyHtml` vuoto → solo testo (comportamento precedente).
- **Validazione placeholder** — set unico `ALLOWED_TEMPLATE_VARS` in `lib/email/template-vars.ts` (modulo PURO, client-safe, niente Prisma). `PUT` template rifiuta variabili sconosciute → HTTP 422 `INVALID_PLACEHOLDER`. Validazione speculare anche lato client (blocca Salva).
- **Niente migrazioni DB** — nessuna modifica schema; usato `bodyHtml` già esistente.

### [2026-06-24] Sessione 2 — Email CC, dry-run, staging
- **secondaryEmails compagnia in CC** — l'email alla compagnia (sia invio iniziale sia reinvio) ora include in CC le `secondaryEmails` della compagnia, oltre a broker + brokerCc. Dedup case-insensitive ed esclusione del destinatario principale. Niente schema change: si usano i dati correnti della compagnia (le secondary sono routing operativo, non dato legale; la `withdrawalEmail` resta snapshottata sulla richiesta).
- **`EMAIL_DRY_RUN`** — nuovo flag env: se `true`, `send.ts` NON chiama Resend ma registra l'`EmailLog` come `SENT` (provider `dry-run`). Default off (prod invia davvero). Serve per test sicuri.
- **Staging via schema dedicato** — scelto schema Postgres `staging` nello stesso progetto Supabase + `EMAIL_DRY_RUN` invece di un progetto separato. Motivo: free, autonomo, isolamento dati sufficiente per i test. `DIRECT_URL` via session pooler (5432) perché l'host diretto legacy non è raggiungibile. Dettagli in `staging.md`.
- **Verifica Resend** — API key valida. CRITICITÀ: `EMAIL_FROM` usa `onboarding@resend.dev` (sender di test, consegna ristretta al proprietario account) e il dominio `updates.vitanuova.it` è `not_started` (DNS non verificato). Invio reale verso terzi NON operativo finché non si verifica un dominio e si imposta un `EMAIL_FROM` su quel dominio.

### [2026-06-24] Sessione 3 — Fix UI admin, rendering dinamico, E2E
- **Bug Modal (Compagnie) RISOLTO** — l'effetto di gestione focus dipendeva da `onClose`, ricreato a ogni render: a ogni carattere digitato il focus tornava sulla X. Fix: `onClose` via ref stabile, effetto dipendente SOLO da `open`, focus iniziale sul primo campo del form (non sulla X). Verificato in browser (Playwright).
- **Pagine admin + `/recesso` → `force-dynamic`** — prima erano prerenderizzate staticamente ed eseguivano query Prisma al BUILD: fragile (fallimento build intermittente se il DB è lento/irraggiungibile) e dati non freschi. Ora rese dinamiche: build robuste (no DB al build) e dati per-richiesta. Importante per l'affidabilità dell'auto-deploy.
- **Suite E2E Playwright** — aggiunta `tests/admin-ui.spec.ts` + `playwright.config.ts` + script `test:e2e`. Verifica reale del focus/digitazione e del salvataggio. `tsconfig` esclude `tests`/`playwright.config.ts` dal typecheck Next.
- **Template email** — nessun bug reale lato utente: a velocità di digitazione umana funziona correttamente (verificato). Lo "scramble" visto inizialmente era un artefatto della digitazione ultra-rapida di Playwright su un campo molto lungo.
- **Lezione test** — i test API (curl) non bastano per i bug di interazione UI (focus/cursore): servono test browser (Playwright) per le CTA/form.

### [2026-06-24] Lezione operativa critica
- **`.env.local` punta al DB Supabase di PRODUZIONE** (non esiste un DB di staging/local). Qualsiasi test contro `localhost` che chiama API admin scrive su dati reali. I test QA di questa sessione hanno creato/modificato dati reali e sono stati **ripristinati** subito (compagnia di test eliminata, template `technical_alert` riportato a seed, audit log di test ripuliti). REGOLA: per test distruttivi futuri usare un DB separato o limitarsi a smoke non-distruttivi.
