---
title: "Contesto completo vulnerabilità Supabase - recesso-digitale"
document_type: "debugging_context"
language: "it-IT"
generated_at: "2026-09-09T15:11:30Z"
issue_report_date: "2026-09-06"
supabase_project_name: "recesso-digitale"
supabase_project_ref: "lwwfskgnhxwahxggjnek"
severity: "critical"
primary_lint_id: "rls_disabled_in_public"
primary_lint_title: "Table publicly accessible"
primary_entity: "public.settings"
database_schema: "public"
execution_status: "remediation_executed_rls_enabled_all_public_tables"
remediation_date: "2026-09-09"
remediation_migration: "20260909160000_enable_rls_public_tables"
objective: "Analizzare e risolvere in modo sicuro le segnalazioni RLS senza applicare modifiche non approvate o policy arbitrarie"
---

# Contesto vulnerabilità Supabase

## 1. Segnalazione originale

Supabase ha segnalato:

> CRITICAL ISSUE  
> Table publicly accessible  
> Anyone with your project URL can read, edit, and delete all data in this table because Row-Level Security is not enabled.

Dettagli:

- **Lint ID:** `rls_disabled_in_public`
- **Titolo:** Table publicly accessible
- **Entità indicata:** `public.settings`
- **Schema:** `public`
- **Progetto:** `recesso-digitale`
- **Project ref:** `lwwfskgnhxwahxggjnek`
- **Data indicata da Supabase:** 6 settembre 2026
- **Severità:** Critical

## 2. Significato tecnico

Una tabella in uno schema esposto al Data API di Supabase può essere raggiunta tramite:

- Supabase client libraries
- REST/PostgREST
- GraphQL, se abilitato
- altri canali che utilizzano i ruoli PostgreSQL esposti

La sicurezza dipende da due livelli distinti:

1. **GRANT PostgreSQL**
   - Determina se `anon` o `authenticated` possono raggiungere la tabella.
2. **RLS e policy**
   - Determinano quali righe possono essere lette o modificate.

Una tabella senza RLS e con privilegi concessi a `anon` o `authenticated` può esporre operazioni CRUD complete sui dati.

L’assenza di RLS non dimostra da sola che la tabella sia raggiungibile, perché occorre verificare anche i grant e la configurazione Data API. Tuttavia, per le tabelle in schema `public`, Supabase considera questa configurazione non sicura e la segnala.

## 3. Informazioni disponibili sul database

È stata eseguita un’ispezione dello schema `public`.

### 3.1 Tabella `public.settings`

La tabella contiene:

- `id text`
- `key text`
- `value text`
- `type text`
- `description text nullable`
- `created_at timestamp without time zone`
- `updated_at timestamp without time zone`

Chiave primaria:

- `id`

Numero di righe rilevato durante l’ispezione:

- 13

### 3.2 Stato RLS rilevato

Durante l’ispezione dello schema, `public.settings` risultava:

```text
RLS enabled: true
```

Questo è importante: lo stato osservato nel database non coincide con la segnalazione originale secondo cui `public.settings` avrebbe RLS disabilitato.

Possibili spiegazioni:

1. La segnalazione Supabase era precedente all’attivazione di RLS.
2. La segnalazione è rimasta memorizzata o non ancora aggiornata.
3. È stata controllata una configurazione diversa da quella attualmente analizzata.
4. Il problema è stato parzialmente risolto, ma restano vulnerabilità su altre tabelle.
5. Il lint si riferisce a un gruppo di tabelle e `public.settings` era uno degli oggetti inizialmente coinvolti.

Non è stata eseguita una nuova scansione del Database Advisor dopo l’ispezione.

## 4. Errore SQL riscontrato

È stato fornito il seguente SQL:

```sql
CREATE POLICY "Users can read their own settings"
ON public.settings
FOR SELECT
TO authenticated
USING ((SELECT auth.uid()) = user_id);

CREATE POLICY "Users can insert their own settings"
ON public.settings
FOR INSERT
TO authenticated
WITH CHECK ((SELECT auth.uid()) = user_id);

CREATE POLICY "Users can update their own settings"
ON public.settings
FOR UPDATE
TO authenticated
USING ((SELECT auth.uid()) = user_id)
WITH CHECK ((SELECT auth.uid()) = user_id);

CREATE POLICY "Users can delete their own settings"
ON public.settings
FOR DELETE
TO authenticated
USING ((SELECT auth.uid()) = user_id);
```

Errore PostgreSQL:

```text
ERROR: 42703: column "user_id" does not exist
```

## 5. Causa dell’errore SQL

La tabella `public.settings` non contiene una colonna `user_id`.

Le colonne esistenti sono:

```text
id
key
value
type
description
created_at
updated_at
```

Pertanto questa espressione non può essere compilata:

```sql
auth.uid() = user_id
```

Il problema non è la sintassi di `auth.uid()`. Il problema è che la policy presuppone un modello dati per-user che non esiste nella tabella.

## 6. Analisi del modello dati

`public.settings` appare strutturata come tabella di configurazioni globali key/value:

```text
key -> value
```

Non appare come tabella di impostazioni appartenenti a un utente specifico.

Non sono presenti:

- `user_id`
- `auth_user_id`
- `owner_id`
- `organization_id`
- `tenant_id`

Non è quindi possibile scrivere correttamente policy per-user senza:

- aggiungere una colonna di ownership, oppure
- creare una tabella separata per le impostazioni utente, oppure
- applicare un modello di autorizzazione basato su ruoli o organizzazioni.

## 7. Policy che non sono state applicate

Non è stata applicata nessuna remediation automatica.

Il codice fornito è fallito a causa della colonna inesistente. Non è stato verificato in modo indipendente se una delle istruzioni successive sia stata eseguita dall’editor SQL dopo il fallimento della prima istruzione.

Prima di riprovare, verificare l’elenco delle policy già presenti sulla tabella per evitare conflitti con nomi duplicati.

## 8. Possibili modelli di sicurezza

### 8.1 Impostazioni esclusivamente server-side

Se `public.settings` contiene:

- password
- token
- API key
- credenziali SMTP
- configurazioni interne
- segreti applicativi
- dati amministrativi

la tabella non dovrebbe essere letta dal browser.

Approccio previsto:

- RLS abilitato
- nessuna policy per `anon`
- nessuna policy per `authenticated`
- lettura tramite backend trusted
- eventuale uso di Edge Function o connessione server-side

Non bisogna esporre service role key o secret key al frontend.

### 8.2 Impostazioni leggibili da utenti autenticati

Se tutti i valori sono innocui e devono essere letti dagli utenti autenticati, si può concedere una policy di sola lettura:

```sql
CREATE POLICY "Authenticated users can read settings"
ON public.settings
FOR SELECT
TO authenticated
USING (true);
```

Questa policy consente a ogni utente autenticato di leggere tutte le righe. Non è una policy per-user.

Non dovrebbe essere usata se i valori contengono segreti o configurazioni riservate.

### 8.3 Impostazioni pubbliche in sola lettura

Se tutti i valori sono volutamente pubblici, si può creare una policy di lettura per `anon` e `authenticated`:

```sql
CREATE POLICY "Anyone can read settings"
ON public.settings
FOR SELECT
TO anon, authenticated
USING (true);
```

Questa policy non dovrebbe concedere:

- `INSERT`
- `UPDATE`
- `DELETE`

a meno che tali operazioni non siano esplicitamente richieste.

### 8.4 Impostazioni per-user

Se ogni riga deve appartenere a un utente, il modello dati deve essere modificato.

Una possibile struttura sarebbe:

```sql
user_id uuid REFERENCES auth.users(id)
```

Dopo aver introdotto `user_id`, si potrebbero definire policy basate su:

```sql
(SELECT auth.uid()) = user_id
```

Prima di farlo occorre però stabilire:

- se `public.settings` deve diventare per-user
- come valorizzare i dati già esistenti
- se una riga può appartenere a più utenti
- se il valore della colonna `value` può contenere dati sensibili
- se è preferibile creare una nuova tabella `public.user_settings`

### 8.5 Impostazioni amministrative

Il database contiene una tabella `public.users` con:

- `id text`
- `email text`
- `password_hash text`
- `role`
- `is_active`

I ruoli rilevati sono:

```text
SUPER_ADMIN
ADMIN
VIEWER
```

Questa tabella non è automaticamente equivalente a `auth.users`.

In particolare:

- `auth.uid()` restituisce normalmente un UUID dell’utente autenticato Supabase.
- `public.users.id` è di tipo `text`.
- Non è stata verificata una relazione tra `auth.users.id` e `public.users.id`.
- Non si deve assumere che il valore restituito da `auth.uid()` possa essere confrontato direttamente con `public.users.id`.

Per policy amministrative occorre definire esplicitamente il collegamento tra identità Supabase Auth e ruoli applicativi.

## 9. Altre tabelle con RLS disabilitato

Durante l’ispezione sono state rilevate altre tabelle pubbliche con RLS disabilitato:

- `public.users`
- `public.insurance_companies`
- `public.withdrawal_requests`
- `public.email_logs`
- `public.email_templates`
- `public.audit_logs`
- `public.internal_notes`

Il risultato dell’ispezione indicava 7 tabelle con RLS disabilitato.

Queste tabelle possono contenere dati sensibili:

- `public.users`
  - include `password_hash`
  - include ruoli e stato utente
- `public.withdrawal_requests`
  - contiene dati cliente
  - codice fiscale
  - email
  - telefono
  - indirizzo IP
  - user agent
- `public.email_logs`
  - destinatari
  - contenuto email
  - eventuali dati tecnici
- `public.audit_logs`
  - informazioni sulle attività degli utenti
  - dati precedenti e successivi in JSON
- `public.internal_notes`
  - note interne
- `public.insurance_companies`
  - dati di contatto e note
- `public.email_templates`
  - template email e potenzialmente informazioni operative

È fondamentale non limitarsi a risolvere solo `public.settings`.

Non bisogna però abilitare RLS indiscriminatamente senza progettare le policy, perché ciò può bloccare l’applicazione fino alla definizione dei permessi corretti.

## 10. Test e controlli eseguiti

### Test eseguito: ispezione schema

È stata ispezionata la struttura dello schema `public`.

Risultati rilevanti:

- `public.settings` esiste.
- `public.settings` contiene 13 righe.
- `public.settings` non contiene `user_id`.
- `public.settings` risultava con RLS abilitato.
- altre 7 tabelle risultavano con RLS disabilitato.

### Test eseguito: compilazione delle policy fornite

È stato analizzato il codice SQL delle policy.

Risultato:

```text
ERROR: 42703: column "user_id" does not exist
```

Conclusione:

- il modello per-user non è compatibile con lo schema attuale di `public.settings`.

### Test non ancora eseguiti

Non sono stati ancora verificati:

- grant di `anon` su `public.settings`
- grant di `authenticated` su `public.settings`
- policy già presenti su `public.settings`
- configurazione degli Exposed schemas
- stato aggiornato del Database Advisor
- accesso reale via REST/PostgREST con ruolo `anon`
- accesso reale via REST/PostgREST con ruolo `authenticated`
- eventuali viste o funzioni che espongono `public.settings`
- eventuali dati segreti contenuti nella colonna `value`
- collegamento tra `auth.users` e `public.users`
- policy richieste dall’applicazione sulle altre 7 tabelle

## 11. SQL di diagnostica da eseguire in seguito

Queste query sono diagnostiche e non modificano i dati:

```sql
SELECT
  schemaname,
  tablename,
  rowsecurity,
  forcerowsecurity
FROM pg_tables
WHERE schemaname = 'public'
  AND tablename IN (
    'settings',
    'users',
    'insurance_companies',
    'withdrawal_requests',
    'email_logs',
    'email_templates',
    'audit_logs',
    'internal_notes'
  )
ORDER BY tablename;
```

Per verificare le policy esistenti:

```sql
SELECT
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd,
  qual,
  with_check
FROM pg_policies
WHERE schemaname = 'public'
  AND tablename IN (
    'settings',
    'users',
    'insurance_companies',
    'withdrawal_requests',
    'email_logs',
    'email_templates',
    'audit_logs',
    'internal_notes'
  )
ORDER BY tablename, policyname;
```

Per verificare i grant:

```sql
SELECT
  grantee,
  table_schema,
  table_name,
  privilege_type
FROM information_schema.role_table_grants
WHERE table_schema = 'public'
  AND table_name IN (
    'settings',
    'users',
    'insurance_companies',
    'withdrawal_requests',
    'email_logs',
    'email_templates',
    'audit_logs',
    'internal_notes'
  )
  AND grantee IN ('anon', 'authenticated', 'service_role')
ORDER BY table_name, grantee, privilege_type;
```

## 12. Stato della remediation — ✅ ESEGUITA (2026-09-09)

### 12.1 Diagnosi decisiva (perché abilitare RLS è sicuro)

L'ispezione ha stabilito il fatto dirimente: **l'applicazione si connette a Postgres
esclusivamente via Prisma usando il ruolo owner `postgres` (`rolbypassrls = true`)**, che
**bypassa RLS**. L'app **non** usa il Data API di Supabase né i ruoli `anon`/`authenticated`
(nessun `supabase-js`, nessun PostgREST lato app; autenticazione via next-auth + Prisma).

Conseguenza: abilitare RLS **senza policy** su queste tabelle
- **blocca** l'accesso via Data API (anon/authenticated/PostgREST) → chiude l'esposizione;
- **non ha alcun impatto** sull'applicazione (il ruolo owner continua a leggere/scrivere).

Questo elimina il rischio principale che consigliava cautela ("non abilitare RLS senza
progettare le policy"): quel rischio esiste solo se l'app accede via ruoli soggetti a RLS,
cosa che qui **non** avviene.

### 12.2 Azione eseguita

Migrazione `20260909160000_enable_rls_public_tables` (Prisma, versionata in repo):

```sql
ALTER TABLE "users"                ENABLE ROW LEVEL SECURITY;
ALTER TABLE "insurance_companies"  ENABLE ROW LEVEL SECURITY;
ALTER TABLE "withdrawal_requests"  ENABLE ROW LEVEL SECURITY;
ALTER TABLE "email_logs"           ENABLE ROW LEVEL SECURITY;
ALTER TABLE "email_templates"      ENABLE ROW LEVEL SECURITY;
ALTER TABLE "audit_logs"           ENABLE ROW LEVEL SECURITY;
ALTER TABLE "internal_notes"       ENABLE ROW LEVEL SECURITY;
ALTER TABLE "settings"             ENABLE ROW LEVEL SECURITY; -- già attivo, no-op
```

**Nessuna policy creata di proposito**: sono tabelle server-only. RLS attivo + zero policy =
Data API completamente negato, backend (owner) pienamente funzionante.

Applicata con validazione **staging-first**:
1. **Staging** (schema `staging`): RLS attivo su tutte e 8 le tabelle; verifica app (Prisma/owner)
   → `users=1, companies=9` letti correttamente ⇒ nessuna rottura.
2. **Produzione** (schema `public`): RLS attivo su tutte e 8 le tabelle; verifica app
   → `users=1, companies=34, requests=14` letti correttamente ⇒ nessuna rottura.

### 12.3 Stato risultante

- `rls_disabled_in_public` → **risolto** su tutte le 7 tabelle segnalate (+ `settings`).
- I GRANT ampi a `anon`/`authenticated` restano ma sono ora **inerti**: con RLS attivo e nessuna
  policy, ogni SELECT/INSERT/UPDATE/DELETE via Data API è negata. (Revoca dei grant = hardening
  opzionale futuro, non necessaria per chiudere l'advisory.)
- Atteso possibile nuovo lint informativo `rls_enabled_no_policy` (INFO): è lo **stato desiderato**
  per tabelle solo-backend, non un problema.
- Verifica finale advisor lato Dashboard/Advisor: eseguibile dall'utente (Database → Advisors →
  Security) — lo stato live di `pg_class.relrowsecurity` è già `true` per tutte le tabelle.

### 12.4 Note sui suggerimenti SQL delle sezioni 8.x

Le policy per-user proposte in origine (`auth.uid() = user_id`) **non sono applicabili** e non
sono state usate: le tabelle non hanno colonna di ownership e l'app non usa Supabase Auth. Il
modello corretto per questo progetto è **server-only (RLS on, no policy)**, come eseguito.

## 13. Obiettivo richiesto alla nuova AI

La nuova AI deve:

1. Ricostruire lo stato reale del database.
2. Verificare la segnalazione `rls_disabled_in_public`.
3. Distinguere tra:
   - RLS disabilitato
   - grant Data API
   - policy mancanti
   - schema API esposto
4. Non inventare colonne o relazioni.
5. Non applicare policy per-user a tabelle globali.
6. Non eseguire SQL distruttivo.
7. Non abilitare RLS su tutte le tabelle senza progettare le policy.
8. Proporre policy diverse per:
   - dati pubblici
   - dati autenticati
   - dati per-user
   - dati amministrativi
   - dati server-only
9. Evidenziare i rischi della tabella `public.users`, in particolare `password_hash`.
10. Validare la soluzione con test anonimi e autenticati.
11. Chiedere conferma solo quando una modifica può bloccare l’applicazione o cambiare il modello autorizzativo.
12. Produrre SQL compatibile con lo schema effettivo.
13. Verificare nuovamente il Database Advisor dopo la remediation.
