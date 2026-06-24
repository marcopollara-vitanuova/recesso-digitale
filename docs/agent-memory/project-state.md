# Project State — Recesso Digitale Polizze

> Fonte primaria del contesto operativo. Aggiornare a ogni fase critica.
> Ultimo aggiornamento: 2026-06-24

## Identità progetto
- **Nome:** recesso-digitale
- **Path locale:** `/Users/m/sites/recesso-digitale`
- **GitHub:** `marcopollara-vitanuova/recesso-digitale`
- **Produzione:** https://recesso.vitanuova.it (alias attivo) — `recesso-digitale.vercel.app` fa 301 → dominio custom
- **Owner Vercel:** team `vitanuova` (progetto `recesso-digitale`)

## Stack
- Next.js 16.2.6 (App Router, Turbopack)
- TypeScript, Tailwind CSS v4 (token in `globals.css`, nessun `tailwind.config`)
- Prisma 6.19.3 (bloccato, NON aggiornare a 7) + PostgreSQL su Supabase
- next-auth v4 (Credentials, JWT) + bcryptjs
- Resend (email)
- Deploy: Vercel CLI / `vercel deploy --prod`

## Stato Git (2026-06-24)
- Branch: `main`, working tree pulito
- Allineato a `origin/main` (0 ahead / 0 behind)
- Nessun branch remoto extra, nessuna PR aperta
- Ultimo commit: `5259b4d` Fix missing og:image on recesso page share metadata

## Stato Produzione (verificato 2026-06-24)
- `GET /recesso` → 200
- `GET /api/public/insurance-companies` → 200
- `GET /api/admin/dashboard` (no auth) → 401 (corretto)
- `GET /admin/login` → 200
- Security headers attivi: HSTS, X-Frame-Options DENY, X-Content-Type-Options nosniff, Referrer-Policy
- NOTA: Vercel CLI richiede ri-autenticazione allo scope `vitanuova` (token scaduto) — i deploy via CLI vanno ri-loggati con `vercel login`

## Funzionalità esistenti
### Pubblico
- `/recesso`: flusso multi-step (landing → form → review → success/error) con RecessoFlow
- API pubbliche: lista compagnie attive, submit richiesta recesso (rate-limit per IP, honeypot `website`)

### Admin (`/admin`, protetto da middleware next-auth)
- Login, dashboard, richieste recesso (lista, dettaglio, export CSV, reinvio email, note, mark resolved)
- Compagnie: **CRUD completo da UI** (lista + modale crea/modifica + disabilita/riattiva) — dal 2026-06-24
- Template email: **editor da UI** (subject/bodyText/bodyHtml + variabili + preview + validazione) — dal 2026-06-24
- Settings: lettura UI + API
- Audit log: lettura

### Note tecniche email
- Invio email supporta `text` sempre + `html` se il template ha `bodyHtml`. Variabili HTML escaped.
- Variabili template ammesse centralizzate in `src/lib/email/template-vars.ts` (modulo puro/condiviso).

## Modelli DB (Prisma)
User, InsuranceCompany, WithdrawalRequest, EmailLog, Setting, EmailTemplate, AuditLog, InternalNote
Enums: UserRole (SUPER_ADMIN/ADMIN/VIEWER), WithdrawalRequestStatus, EmailType, EmailStatus

## Ruoli e autorizzazioni
- `requireSession()` — qualunque utente loggato (incluso VIEWER) per le GET
- `requireRole([...])` — verifica ruolo specifico
- `canWrite(role)` — true solo per SUPER_ADMIN e ADMIN
- Pattern scrittura: `requireRole(["SUPER_ADMIN","ADMIN"])` + `canWrite()` + audit log

## Comandi utili
- Dev: `npm run dev` (porta default 3000; spesso 3010 già attiva)
- Build: `npm run build` (gira `prisma generate && next build`)
- Lint: `npm run lint`
- DB: `npm run db:migrate` / `db:migrate:deploy` / `db:seed` / `db:studio` (usano `.env.local`)
- Migrazioni in produzione: eseguite SEPARATAMENTE da locale (`db:migrate:deploy`), NON nel build Vercel (Supabase diretto non raggiungibile dai builder)
