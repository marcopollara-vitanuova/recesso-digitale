# Open Issues & Rischi — Recesso Digitale Polizze

> Backlog rischi e problemi aperti. Aggiornare quando emergono/risolvono.

## Risolti 2026-09-07 (sessione 5)
- ~~Manca `GET /[id]` compagnie/template~~ → aggiunti (401/404 coerenti).
- ~~Nessun unit test~~ → suite `node:test` via `tsx` (`npm run test:unit`), zero nuove dipendenze.
- ~~npm audit: next-auth CRITICO~~ → risolto (`npm audit fix`).
- ~~npm audit: postcss/sharp/next HIGH~~ → risolti con **Next 16.3.4** (+ eslint-config-next 16.3.4).
- Copy landing `/recesso` aggiornata (VB-339) — live in produzione.

### Residui noti (accettati)
- **npm audit: 3 HIGH solo dev-tooling Prisma CLI** (`prisma`, `@prisma/config`, `deepmerge-ts`).
  `@prisma/client` (runtime) è pulito. Il fix suggerito da npm è un downgrade assurdo (6.12.0); il
  fix reale sarebbe Prisma 7, deliberatamente evitato. Rivalutare all'eventuale upgrade a Prisma 7.
- Lint: 1 warning non eliminabile (`form.watch()` react-hook-form / React Compiler).

## Risolti 2026-09-07 (sessione 6 — orchestrazione)
- **Webhook Resend deployato e operativo**: `POST /api/webhooks/resend`, migrazione enum applicata (staging + **prod**), webhook creato su Resend (id `db9910f5-9262-4da6-8d63-ba6c032929a0`, eventi bounced/complained/delivered/failed/delivery_delayed/sent), `RESEND_WEBHOOK_SECRET` impostato su Vercel Production + redeploy. Verificato: firma errata → 400 `INVALID_SIGNATURE`.
- **Emorragia invii fermata**: `broker_email` cambiato `recessi@vitanuova.it` → **`clienti@vitanuova.it`** (prod + staging, via API admin/audit). `recessi` non è più in `broker_email`/`broker_cc`/secondary → non compare più in nessun invio.
- **Vercel**: login effettuato (device flow). Accesso team OK **usando le credenziali memorizzate** → per i comandi vercel usare `env -u VERCEL_TOKEN vercel ...` (il `VERCEL_TOKEN` in env è invalido e va ignorato/rimosso).
- **Ordine deploy migrazione**: applicata migrazione PRIMA del deploy del codice (corretto).

### 🔴 IMPATTO STORICO — richiede azione Compliance
Con `recessi@vitanuova.it` in suppression dal ~25/06 e sempre in CC sull'email compagnia,
**10 richieste (25/06 → 21/08) risultano `EMAIL_SENT` ma probabilmente NON sono arrivate alla compagnia**
(l'intero messaggio veniva soppresso; il cliente riceveva comunque la conferma). Da ri-trasmettere:
- REC-2026-000005 (pol 065269436) · 000006 Groupama (116356524) · 000007 Groupama (116356519)
- 000008 D.A.S. (05205DAS01211) · 000009 Italiana (41212470) · 000010 D.A.S. (05205DAS01214)
- 000011 Intesa Sanpaolo RBM Salute (0000123644) · 000012 Groupama (114063698)
- 000013 D.A.S. (05205DAS01206) · 000014 Groupama (116069393, **scade 09/09**)
Conferma puntuale del `suppressed` possibile solo via Resend (retention limitata: certo il 21/08).

### ⚠️ Da escalare all'IT (scoperta agente Resend, 2026-09-07)
- **`recessi@vitanuova.it` bounce PERMANENTE** su Exchange (test reale: `bounced_permanent`,
  `delivered:0`; probabile `550 5.1.1` casella inesistente o `550 5.7.135` mittente esterno bloccato
  sul gruppo). È il `broker_email` (destinatario notifica broker + CC email compagnia): **le notifiche
  broker non vengono recapitate**. Resend ha ri-suppressato l'indirizzo. Azione: correggere la casella/
  policy Exchange, oppure impostare un `broker_email` funzionante. Finché non risolto, resta in
  suppression list (corretto non rimuoverlo).

## Rischi infrastruttura
- **Vercel deploy bloccato (2026-06-24)**: il `VERCEL_TOKEN` in env è un token personale (utente `marcopollara-vitanuova`) SENZA accesso al team/scope del progetto (`team_OYhBT52i0zi9RJqyAgbFe0hD`); le credenziali CLI memorizzate sono scadute ("token is not valid"). `vercel login` è interattivo → non eseguibile in autonomia. Mitigazione: (a) auto-deploy via integrazione GitHub→Vercel sul push a `main` (da verificare); (b) in alternativa l'utente esegue `vercel login` o fornisce un token con scope team. Verifica deploy via `curl` sul dominio prod (controllo contenuto aggiornato).
- **Migrazioni DB manuali** — vanno applicate da locale; NON girano nel build Vercel.
  **Ordine corretto per migrazioni additive (es. nuovi valori enum EmailStatus del webhook):**
  1) `npm run db:migrate:staging` → poi la stessa migrazione su **prod** (`db:migrate:deploy`, `.env.local` = schema `public` di prod);
  2) commit + push del codice (auto-deploy).
  Migrare PRIMA del deploy del codice: se il codice nuovo va live prima, scrive valori enum non
  ancora esistenti → route in 500 e retry Svix a vuoto. La migrazione additiva è sicura da applicare
  prima (il codice vecchio non usa i valori nuovi). (Correzione ordine segnalata dall'agente Resend.)
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

## Aperti (azione utente/IT)
- **Exchange `recessi@vitanuova.it`**: bounce permanente; casella/policy da sistemare (o dismettere). Mitigato lato piattaforma (broker_email = clienti). Il webhook ora rende visibili i futuri bounce.
- **`onsalute@pec.it` suppressed** (bounce dal 29/07): invii verso quella PEC compagnia bloccati; verificare con la compagnia prima di riattivare.
- **Verificare che `clienti@vitanuova.it` consegni davvero** (lo confermerà il webhook al prossimo invio).
- **Ruotare credenziali admin** (`recesso.vitanuova.it/admin/login`): circolate in un thread email del 24/06 (handoff §6.1).
- **`VERCEL_TOKEN` in env è invalido**: rimuoverlo/rigenerarlo; per ora i comandi vercel funzionano con la sessione CLI (login effettuato).
- **Staging su Vercel**: ora possibile (ho accesso) — da decidere se procedere.

## Sicurezza (da tenere d'occhio)
- Tutte le scritture admin passano da `requireRole` + `canWrite` + audit: OK.
- VIEWER può leggere via `requireSession` su GET admin: comportamento atteso, confermare con owner.
- Rate limit pubblico per IP basato su conteggio `withdrawalRequest` per IP/ora: efficace ma legato al DB.
