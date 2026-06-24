# Open Issues & Rischi — Recesso Digitale Polizze

> Backlog rischi e problemi aperti. Aggiornare quando emergono/risolvono.

## Rischi infrastruttura
- **Vercel deploy bloccato (2026-06-24)**: il `VERCEL_TOKEN` in env è un token personale (utente `marcopollara-vitanuova`) SENZA accesso al team/scope del progetto (`team_OYhBT52i0zi9RJqyAgbFe0hD`); le credenziali CLI memorizzate sono scadute ("token is not valid"). `vercel login` è interattivo → non eseguibile in autonomia. Mitigazione: (a) auto-deploy via integrazione GitHub→Vercel sul push a `main` (da verificare); (b) in alternativa l'utente esegue `vercel login` o fornisce un token con scope team. Verifica deploy via `curl` sul dominio prod (controllo contenuto aggiornato).
- **Migrazioni DB manuali** — vanno applicate da locale (`db:migrate:deploy`); rischio di drift se dimenticate prima di un deploy che cambia schema.
- **npm audit** — 3 vulnerabilità moderate transitive (postcss via next). Nessun fix non-breaking disponibile; monitorare upgrade Next.

## Gap funzionali (UI) — RISOLTI 2026-06-24
- ~~Compagnie UI sola lettura~~ → CRUD completo da UI (modale).
- ~~Template email UI sola lettura~~ → editor con subject/bodyText/bodyHtml.
- ~~Nessuna validazione placeholder~~ → validazione client+server (422 su variabili sconosciute).
- ~~`bodyHtml` non usato in invio~~ → `send.ts` invia html quando presente (variabili escaped).
- **Manca `GET /[id]`** per email-templates e insurance-companies (si lavora su lista + PUT). Non bloccante.

## Risolti 2026-06-24 (sessione 2)
- ~~Nessun DB di staging~~ → schema `staging` + `EMAIL_DRY_RUN` (vedi `staging.md`).
- ~~secondaryEmails non usate in invio~~ → ora in CC sull'email compagnia (invio + reinvio).

## Risolti 2026-06-24 (sessione 3)
- ~~Modal Compagnie rubava il focus a ogni digitazione~~ → fix gestione focus (verificato in browser).
- ~~Build intermittente per prerender admin con query DB~~ → pagine admin + `/recesso` `force-dynamic`.
- Aggiunta suite E2E Playwright (`npm run test:e2e`) per i bug di interazione UI.

## Resend — RISOLTO 2026-06-24
- Dominio `updates.vitanuova.it` ora **verified** (sending enabled), DNS SPF/DKIM configurati dall'utente.
- Mittente impostato su dominio verificato: `Vitanuova Recessi <recessi@updates.vitanuova.it>`.
  - Setting DB `email_from` aggiornata in **produzione** (via API admin, tracciata in audit) e in staging.
  - Allineati anche seed, fallback `settings.ts`, `.env.example`, `.env.local`, `.env.staging`.
- Verificato invio reale: (a) test diretto API Resend OK; (b) **end-to-end attraverso l'app** su
  staging (dry-run OFF, destinatari = titolare) → compagnia/cliente/broker tutti `SENT` via resend,
  `status EMAIL_SENT`.
- NOTA: l'env `EMAIL_FROM` su Vercel (Production) è ancora il vecchio valore ma è IRRILEVANTE
  (la setting DB ha precedenza). Aggiornarlo se un giorno si rimuove la setting DB.

## Altri
- **Preview HTML editor** usa `dangerouslySetInnerHTML` con dati di esempio statici e variabili escaped: rischio basso (admin trusted). Tenere d'occhio.
- **Staging deployato su Vercel**: non automatizzabile (token Vercel senza scope team). Istruzioni manuali in `staging.md`.
- **Auto-deploy a volte in ritardo** (2026-06-24): un push a `main` non è stato raccolto da Vercel per >6 min. Workaround usato: commit vuoto `chore: trigger deployment` per ri-attivare il webhook. Non potendo usare la CLI Vercel (token senza scope team), il nudge via commit vuoto è il rimedio.

## Note dati / business
- `secondaryEmails` è `Json?` sul modello compagnia: l'API valida `array<email>` e default `[]`. Verificare che l'invio usi davvero le secondary (attualmente `send.ts` invia al singolo `to`).
- `internalCode` è `@unique` (opzionale): create/update devono gestire errore unicità (P2002) con messaggio chiaro.
- Eliminazione "vera" compagnia: NON consentita se esistono `withdrawalRequests` collegate. Strategia adottata = soft delete (disable).

## Qualità / test
- Nessuna suite di test automatici presente (no Vitest/Playwright). Strategia test attuale = build + lint + smoke manuale.
- Warning lint noti (non bloccanti): import inutilizzati in `email/send.ts`, `email/templates.ts`, `services/withdrawal.ts`; `form.watch()` react-hook-form non memoizzabile.

## Sicurezza (da tenere d'occhio)
- Tutte le scritture admin passano da `requireRole` + `canWrite` + audit: OK.
- VIEWER può leggere via `requireSession` su GET admin: comportamento atteso, confermare con owner.
- Rate limit pubblico per IP basato su conteggio `withdrawalRequest` per IP/ora: efficace ma legato al DB.
