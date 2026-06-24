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

## Resend — DA COMPLETARE (bloccante per invii reali)
- **`EMAIL_FROM` = `onboarding@resend.dev`**: sender condiviso di test Resend, consegna ristretta
  all'email del proprietario dell'account. Le email verso clienti/compagnie reali NON verranno
  recapitate. Azione: verificare un dominio su Resend e impostare `EMAIL_FROM` su quel dominio.
- **Dominio `updates.vitanuova.it` = `not_started`**: DNS non verificato. Azione: completare i
  record DNS (SPF/DKIM) su Resend, poi attendere stato `verified`.

## Altri
- **Preview HTML editor** usa `dangerouslySetInnerHTML` con dati di esempio statici e variabili escaped: rischio basso (admin trusted). Tenere d'occhio.
- **Staging deployato su Vercel**: non automatizzabile (token Vercel senza scope team). Istruzioni manuali in `staging.md`.

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
