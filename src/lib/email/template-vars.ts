/**
 * Helper PURI per i template email (nessuna dipendenza server/Prisma).
 * Importabili sia da route server sia da componenti client.
 */

export type TemplateVars = Record<string, string>;

/**
 * Variabili dinamiche ammesse nei template (placeholder `{{nome}}`).
 * Unica fonte di verità per rendering e validazione. Tenere allineata con
 * `buildTemplateVars` in `templates.ts`.
 */
export const ALLOWED_TEMPLATE_VARS = [
  "requestId",
  "createdAt",
  "customerFirstName",
  "customerLastName",
  "customerFiscalCode",
  "customerEmail",
  "policyNumber",
  "insuranceCompanyName",
  "insuranceCompanyEmail",
  "brokerName",
  "brokerEmail",
  "notes",
] as const;

export type AllowedTemplateVar = (typeof ALLOWED_TEMPLATE_VARS)[number];

/** Etichette descrittive per la UI dell'editor. */
export const TEMPLATE_VAR_LABELS: Record<AllowedTemplateVar, string> = {
  requestId: "ID richiesta",
  createdAt: "Data/ora invio",
  customerFirstName: "Nome cliente",
  customerLastName: "Cognome cliente",
  customerFiscalCode: "Codice fiscale",
  customerEmail: "Email cliente",
  policyNumber: "Numero polizza",
  insuranceCompanyName: "Nome compagnia",
  insuranceCompanyEmail: "Email compagnia",
  brokerName: "Nome broker",
  brokerEmail: "Email broker",
  notes: "Note cliente",
};

const ALLOWED_SET = new Set<string>(ALLOWED_TEMPLATE_VARS);

const PLACEHOLDER_RE = /\{\{\s*(\w+)\s*\}\}/g;

/** Placeholder presenti nel testo ma non ammessi. */
export function findUnknownPlaceholders(text: string | null | undefined): string[] {
  if (!text) return [];
  const unknown = new Set<string>();
  for (const match of text.matchAll(PLACEHOLDER_RE)) {
    const key = match[1];
    if (key && !ALLOWED_SET.has(key)) unknown.add(key);
  }
  return [...unknown];
}

export function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

/** Sostituisce i placeholder. In modalità html i valori vengono HTML-escaped. */
export function renderTemplate(
  template: string,
  vars: TemplateVars,
  mode: "text" | "html" = "text",
): string {
  return template.replace(PLACEHOLDER_RE, (_, key: string) => {
    const value = vars[key] ?? "";
    return mode === "html" ? escapeHtml(value) : value;
  });
}

/** Valori di esempio per la preview lato editor. */
export const SAMPLE_TEMPLATE_VARS: TemplateVars = {
  requestId: "REC-2026-000123",
  createdAt: "24/06/2026 12:30",
  customerFirstName: "Mario",
  customerLastName: "Rossi",
  customerFiscalCode: "RSSMRA80A01H501U",
  customerEmail: "mario.rossi@example.com",
  policyNumber: "POL-987654",
  insuranceCompanyName: "Compagnia Demo",
  insuranceCompanyEmail: "recesso@compagnia.example",
  brokerName: "Vitanuova S.p.A.",
  brokerEmail: "assistenza@vitanuova.it",
  notes: "Richiesta inviata tramite portale.",
};
