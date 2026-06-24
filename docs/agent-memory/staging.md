# Ambiente di Staging / Test sicuro

> Obiettivo: eseguire test (anche distruttivi) senza toccare i dati di produzione.

## Architettura adottata (free, autonoma)
- **Isolamento dati**: schema PostgreSQL dedicato **`staging`** nello stesso progetto Supabase
  (`recesso-digitale`, ref `lwwfskgnhxwahxggjnek`). I dati di produzione vivono nello schema
  `public`; staging in `staging`. Zero impatto sui dati reali.
- **Isolamento email**: flag **`EMAIL_DRY_RUN="true"`** → nessuna chiamata reale a Resend;
  l'`EmailLog` viene comunque scritto come `SENT` (provider `dry-run`) per ispezionare
  destinatari/CC/contenuto.
- **Connessione migrazioni**: `DIRECT_URL` usa il **session pooler** Supabase
  (`...pooler.supabase.com:5432`, IPv4) perché l'host diretto legacy
  (`db.<ref>.supabase.co:5432`) non è raggiungibile da questa rete.

## File
- `.env.staging` (NON committato, gitignored) — generato da `.env.local` con:
  - `DATABASE_URL` = pooler 6543 + `pgbouncer=true&schema=staging`
  - `DIRECT_URL` = pooler 5432 + `schema=staging`
  - `EMAIL_DRY_RUN="true"`, `APP_BASE_URL/AUTH_URL/NEXTAUTH_URL` = `http://localhost:3030`

## Script npm
- `npm run db:migrate:staging` — applica migrazioni allo schema staging
- `npm run db:seed:staging` — popola staging (admin, settings, template, 2 compagnie demo)
- `npm run db:studio:staging` — Prisma Studio su staging
- `npm run dev:staging` — app su `http://localhost:3030` con DB staging + email dry-run

## ⚠️ Nota shell
`dotenv-cli` NON sovrascrive variabili già esportate nella shell. Se in precedenza è stato
fatto `source .env.local`, fare `unset DATABASE_URL DIRECT_URL ...` prima di usare gli script
staging, altrimenti vince l'ambiente della shell.

## Procedura test sicuri
1. `npm run db:migrate:staging && npm run db:seed:staging` (una tantum / reset)
2. `npm run dev:staging`
3. Eseguire i test contro `http://localhost:3030` (CRUD, submit, ecc.) — sicuri.
4. Le email non partono (dry-run); verificare i CC/destinatari leggendo `EmailLog` su staging.

## Deploy di uno staging su Vercel (richiede accesso team — TODO utente)
Non automatizzabile dall'agente (token Vercel personale, senza scope team). Per avere uno
staging deployato:
1. Creare un branch `staging` (auto-deploy Preview via integrazione GitHub→Vercel).
2. In Vercel → Project → Settings → Environment Variables, ambiente **Preview**, impostare:
   - `DATABASE_URL` (pooler 6543 + `pgbouncer=true&schema=staging`)
   - `DIRECT_URL` (pooler 5432 + `schema=staging`)
   - `EMAIL_DRY_RUN=true`
   - `NEXTAUTH_SECRET`/`AUTH_SECRET`, `NEXTAUTH_URL`/`AUTH_URL`/`APP_BASE_URL` (URL preview)
   - `RESEND_API_KEY`, `EMAIL_FROM`, `EMAIL_REPLY_TO`
3. (Facoltativo) eseguire `db:migrate:staging` prima del primo deploy.

## Upgrade futuro (isolamento infrastrutturale completo)
Se serve separazione a livello di istanza (non solo schema): creare un progetto Supabase
dedicato `recesso-digitale-staging` (`supabase projects create`, CLI già autenticata) — valutare
limiti/costi del piano (org già con 2 progetti). Poi puntare `.env.staging` al nuovo progetto.
