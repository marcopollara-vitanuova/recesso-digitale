# Recesso Digitale Polizze — Fase 1

Piattaforma web per l’esercizio online del diritto di recesso su polizze assicurative (broker).

## Stack

- Next.js (App Router) + TypeScript + Tailwind
- Prisma + PostgreSQL (**Supabase**)
- Auth.js (area admin)
- Resend (email)
- Deploy: **Vercel**

## Percorso progetto

`~/sites/recesso-digitale`

## Setup iniziale (tu)

1. Leggi **`~/.cursor/harness/recesso-digitale/AUTONOMIA.md`** e completa:
   - Supabase: progetto nuovo + `DATABASE_URL` / `DIRECT_URL` in `.env.local`
   - Resend: `RESEND_API_KEY`
   - `AUTH_SECRET` (openssl)
   - Vercel: `VERCEL_TOKEN` in `~/.zshrc` (se non già fatto)
2. Copia env: `cp .env.example .env.local` e compila
3. Scrivi in Cursor: **«Setup autonomia completato, procedi»**

## Sviluppo (dopo env)

```bash
npm install
npx prisma migrate dev
npm run db:seed   # dopo implementazione seed
npm run dev
```

- Pubblico: http://localhost:3000/recesso  
- Admin: http://localhost:3000/admin  

## Documentazione locale (non su Git)

- `docs/AUTONOMIA.md` → punta all’harness
- `docs/PREREQUISITI.md`

## Specifiche

Vedi documento sorgente: *Prompt per generare piattaforma* (Recesso Digitale Polizze — Fase 1).
