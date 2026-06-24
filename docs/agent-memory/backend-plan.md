# Backend Plan — Compagnie & Template Mail

> Piano operativo. STATO: in attesa di approvazione utente prima dello sviluppo.
> Data: 2026-06-24

## Standard API/backend del progetto (da rispettare)
- Route handler in `src/app/api/.../route.ts` (App Router).
- Validazione input con **Zod** (`safeParse`, errori → `jsonError("Dati non validi", 400)`).
- Risposte tramite helper `jsonOk(data, status)` / `jsonError(msg, status, code)`.
- Auth: `requireSession()` per GET, `requireRole(["SUPER_ADMIN","ADMIN"])` + `canWrite()` per scritture.
- Audit: `writeAuditLog({ userId, action, entityType, entityId, beforeData, afterData })` su ogni mutazione.
- Naming azioni audit in MAIUSCOLO_SNAKE (es. `CREATE_COMPANY`, `UPDATE_EMAIL_TEMPLATE`).
- Pattern client mutazioni: componente `"use client"` con `fetch` + `router.refresh()` (vedi `request-actions.tsx`).
- UI coerente con design system Vitanuova (`Card`, `Button`, `FormField`, token `--primary-*`).

---

# SEZIONE A — Compagnie

## 1. Stato attuale verificato
- Modello `InsuranceCompany` completo (legalName, displayName, internalCode unique?, withdrawalEmail, secondaryEmails Json, isActive, notes, createdBy/updatedBy).
- API **già esistenti e complete**:
  - `GET /api/admin/insurance-companies` (lista, requireSession)
  - `POST /api/admin/insurance-companies` (create, role+canWrite+audit)
  - `PUT /api/admin/insurance-companies/[id]` (update, role+canWrite+audit)
  - `DELETE /api/admin/insurance-companies/[id]` (SOFT delete → isActive=false, audit `DISABLE_COMPANY`)
- Endpoint pubblico filtra `isActive=true` → soft delete nasconde correttamente la compagnia dal form.
- UI admin: **sola lettura** (tabella statica).

## 2. Problemi riscontrati
- Manca UI per creare/modificare/disabilitare/riattivare.
- DELETE disabilita ma non c'è UI per riattivare (serve toggle `isActive`).
- Create/update non gestiscono esplicitamente errore unicità `internalCode` (P2002).
- `secondaryEmails` non gestite in invio email (fuori scope qui, annotato in open-issues).

## 3. Architettura proposta
- Riusare le API esistenti (nessuna nuova route necessaria, salvo lievi hardening).
- Trasformare la pagina `insurance-companies/page.tsx` (server component, lista) + nuovo client component per azioni.
- **UX scelta:** pagina lista con **bottone globale "Nuova compagnia"** + **CTA per riga (Modifica / Disabilita-Riattiva)**; form in **modale**. Motivo: minor cambio di contesto, coerente con admin esistente, basso rischio.
- Conferma esplicita per disabilitazione (dialog di conferma).

## 4. API da creare/modificare
- `POST` e `PUT`: aggiungere gestione `try/catch` su P2002 (internalCode duplicato) → `jsonError("Codice interno già esistente", 409)`.
- (Opzionale, basso valore) `GET /[id]` non necessario: la lista fornisce già i dati alla modale.
- Nessuna modifica a DELETE (soft delete già corretto). Aggiungere supporto riattivazione: già coperto da `PUT { isActive: true }`.

## 5. Tabelle/modelli DB coinvolti
- `InsuranceCompany` — nessuna modifica schema. Nessuna migrazione necessaria.
- `AuditLog` — già usato.

## 6. Componenti frontend coinvolti
- `src/app/admin/(panel)/insurance-companies/page.tsx` — restyle tabella (token Vitanuova, scope/caption) + CTA.
- NUOVO `src/app/admin/(panel)/insurance-companies/company-actions.tsx` — client: bottone "Nuova", modale create/edit, toggle disabilita/riattiva con conferma.
- NUOVO (riuso) componente modale leggero (se non esiste, crearne uno minimale accessibile con focus trap basilare) — valutare `dialog` nativo `<dialog>` per semplicità/a11y.

## 7. Impatti sicurezza
- Scritture restano dietro `requireRole`+`canWrite`+audit. Nessun nuovo vettore.
- Validazione Zod lato API resta autorità; la UI è solo convenienza.
- Conferma disabilitazione previene azioni accidentali.

## 8. Impatti UX/UI
- Da sola lettura a gestione completa senza lasciare la pagina.
- Stato `isActive` mostrato con badge; azione contestuale Disabilita/Riattiva.
- Messaggi errore chiari (es. codice duplicato, email non valida).

## 9. Strategia test
- Build + lint obbligatori.
- Smoke manuale: create → compare in lista e nel form pubblico; edit → persistito; disable → sparisce dal form pubblico, badge aggiornato; riattiva → ricompare.
- Verifica audit log popolato.

## 10. Strategia rollback
- Modifiche isolate a 1 pagina + 1 nuovo componente + hardening API. Rollback = revert commit dedicato.
- Nessuna migrazione DB → nessun rollback schema.

## 11. Sequenza implementativa
1. Hardening API (P2002) Compagnie.
2. Client `company-actions.tsx` (modale create/edit, toggle).
3. Restyle pagina lista + integrazione azioni.
4. Lint/build/smoke.

## 12. Rischi e mitigazioni
- Rischio: doppio submit modale → disabilitare bottone in loading.
- Rischio: codice interno duplicato → gestione 409 + messaggio.
- Rischio: accessibilità modale → usare `<dialog>` nativo o focus management.

---

# SEZIONE B — Template Mail

## 1. Stato attuale verificato
- Modello `EmailTemplate` (templateKey unique, name, subject, bodyText, bodyHtml?, isActive).
- 4 template seed: `insurance_company_withdrawal`, `customer_confirmation`, `broker_notification`, `technical_alert`.
- API: `GET /api/admin/email-templates` (lista), `PUT /[id]` (update, role+canWrite+audit). Nessun `GET /[id]`.
- Rendering: `getRenderedTemplate(templateKey, vars)` → usa DB se `isActive`, altrimenti FALLBACK hardcoded; sostituisce `{{var}}`.
- Variabili supportate (da `buildTemplateVars`): `requestId, createdAt, customerFirstName, customerLastName, customerFiscalCode, customerEmail, policyNumber, insuranceCompanyName, insuranceCompanyEmail, brokerName, brokerEmail, notes`.
- UI admin: **sola lettura**.

## 2. Problemi riscontrati
- Nessuna UI per modificare/salvare il copy.
- Nessuna validazione placeholder: `{{sconosciuto}}` → vuoto silenzioso (rischio template rotti).
- `bodyHtml` non usato in invio (`send.ts` invia solo `text`) → editing HTML inutile finché non collegato.
- Nessun "preview" con dati di esempio.

## 3. Architettura proposta
- Definire **set canonico di variabili ammesse** (export da `lib/email/templates.ts`, es. `ALLOWED_TEMPLATE_VARS`) riusato sia da render che da validazione.
- Validazione server (Zod + check placeholder) nel `PUT`: rifiuta variabili sconosciute con messaggio che elenca i placeholder non validi.
- **UX scelta:** editor inline per template (pagina dedicata già esistente), ogni card diventa form con `subject` + `bodyText` editabili, lista variabili disponibili mostrata accanto, bottone Salva con stato. Preview testo renderizzato con vars di esempio (client, best-effort).
- HTML: in questa iterazione mantenere solo `bodyText` editabile (coerente con invio attuale). Annotare in decisions che HTML è fuori scope finché `send.ts` non lo supporta.

## 4. API da creare/modificare
- `PUT /api/admin/email-templates/[id]`: aggiungere validazione placeholder (subject + bodyText) contro `ALLOWED_TEMPLATE_VARS` → `jsonError` con dettaglio.
- Mantenere audit `UPDATE_EMAIL_TEMPLATE` (già presente).
- Nessun nuovo endpoint obbligatorio (lista fornisce i dati all'editor).

## 5. Tabelle/modelli DB coinvolti
- `EmailTemplate` — nessuna modifica schema. Nessuna migrazione.
- `AuditLog` — già fornisce storia before/after (sostituisce versioning dedicato in fase 1).

## 6. Componenti frontend coinvolti
- `src/app/admin/(panel)/email-templates/page.tsx` — da lista statica a lista + editor.
- NUOVO `src/app/admin/(panel)/email-templates/template-editor.tsx` — client: form subject/bodyText, pannello variabili, validazione lato client speculare, salvataggio fetch + refresh, messaggi errore.

## 7. Impatti sicurezza
- Update dietro `requireRole`+`canWrite`+audit.
- Validazione placeholder previene template malformati (riduce rischio di email incomplete verso clienti/compagnie).

## 8. Impatti UX/UI
- Editing diretto del copy con guida alle variabili.
- Prevenzione errori: salvataggio bloccato se placeholder non validi.
- Preview riduce errori prima dell'invio reale.

## 9. Strategia test
- Build + lint.
- Smoke: modificare subject/body, salvare, verificare persistenza e audit; inserire `{{xxx}}` non valido → errore; rendering reale (invio test) usa nuovo copy.
- Test render: confronto `getRenderedTemplate` con vars note.

## 10. Strategia rollback
- Editing dati (non schema): rollback = revert commit codice. I contenuti template modificati restano in DB; ripristinabili via audit before-data o re-seed.

## 11. Sequenza implementativa
1. `ALLOWED_TEMPLATE_VARS` + helper validazione in `lib/email/templates.ts`.
2. Hardening `PUT` con validazione placeholder.
3. Client `template-editor.tsx`.
4. Integrazione pagina template.
5. Lint/build/smoke.

## 12. Rischi e mitigazioni
- Rischio: rimozione accidentale di una variabile chiave dal template → preview + lista variabili obbligatorie per tipo.
- Rischio: template disattivato (`isActive=false`) → cade su FALLBACK; chiarire stato in UI.
- Rischio: divergenza validazione client/server → server resta autorità.

---

## Sequenza globale consigliata
1. (Approvazione) →
2. Sezione A Compagnie (API hardening → UI) →
3. Sezione B Template (vars+validazione → UI) →
4. Lint/build/smoke complessivi →
5. Commit atomici (uno per sezione) → push → (deploy se richiesto) → verifica prod → report.

## Assunzioni esplicite (reversibili)
- Modale per Compagnie, editor inline per Template (scelta UX, modificabile).
- HTML email fuori scope in questa iterazione.
- Nessuna nuova migrazione DB (tutto coperto dallo schema attuale).
- Deploy solo dopo approvazione esplicita; CLI Vercel da ri-autenticare.
