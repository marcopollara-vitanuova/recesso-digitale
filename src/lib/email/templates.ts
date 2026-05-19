import { prisma } from "@/lib/prisma";
import { formatDateTimeEmail } from "@/lib/datetime";
import type { WithdrawalRequest, InsuranceCompany } from "@prisma/client";

export type TemplateKey =
  | "insurance_company_withdrawal"
  | "customer_confirmation"
  | "broker_notification"
  | "technical_alert";

export type TemplateVars = Record<string, string>;

const FALLBACK: Record<TemplateKey, { subject: string; body: string }> = {
  insurance_company_withdrawal: {
    subject: "Richiesta di recesso polizza n. {{policyNumber}} - {{customerFirstName}} {{customerLastName}}",
    body: `Spett.le {{insuranceCompanyName}},\n\nsi trasmette la richiesta di recesso del cliente {{customerFirstName}} {{customerLastName}}.\n\nID: {{requestId}}\n{{createdAt}}\nPolizza: {{policyNumber}}\n\n{{brokerName}}`,
  },
  customer_confirmation: {
    subject: "Conferma ricezione richiesta di recesso - polizza n. {{policyNumber}}",
    body: `Gentile {{customerFirstName}} {{customerLastName}},\n\nabbiamo ricevuto la richiesta di recesso (ID {{requestId}}) in data {{createdAt}}.\n\n{{brokerName}}`,
  },
  broker_notification: {
    subject: "Nuova richiesta di recesso - {{insuranceCompanyName}} - {{policyNumber}}",
    body: `Nuova richiesta {{requestId}} del cliente {{customerFirstName}} {{customerLastName}}.\nPolizza: {{policyNumber}}\nCompagnia: {{insuranceCompanyName}}`,
  },
  technical_alert: {
    subject: "Errore invio email - richiesta {{requestId}}",
    body: `Errore tecnico per richiesta {{requestId}}.\nCliente: {{customerFirstName}} {{customerLastName}}\nPolizza: {{policyNumber}}`,
  },
};

export function buildTemplateVars(
  request: WithdrawalRequest,
  settings: { brokerName: string; brokerEmail: string; timezone: string },
): TemplateVars {
  const createdAt = formatDateTimeEmail(request.submittedAt, settings.timezone);
  return {
    requestId: request.publicId,
    createdAt,
    customerFirstName: request.customerFirstName,
    customerLastName: request.customerLastName,
    customerFiscalCode: request.customerFiscalCode,
    customerEmail: request.customerEmail,
    policyNumber: request.policyNumber,
    insuranceCompanyName: request.insuranceCompanyNameSnapshot,
    insuranceCompanyEmail: request.insuranceCompanyEmailSnapshot,
    brokerName: settings.brokerName,
    brokerEmail: settings.brokerEmail,
    notes: request.customerNotes ?? "",
  };
}

function render(template: string, vars: TemplateVars): string {
  return template.replace(/\{\{(\w+)\}\}/g, (_, key: string) => vars[key] ?? "");
}

export async function getRenderedTemplate(
  templateKey: TemplateKey,
  vars: TemplateVars,
): Promise<{ subject: string; body: string }> {
  const row = await prisma.emailTemplate.findUnique({ where: { templateKey } });
  const fallback = FALLBACK[templateKey];
  const subjectTpl = row?.isActive ? row.subject : fallback.subject;
  const bodyTpl = row?.isActive ? row.bodyText : fallback.body;
  return {
    subject: render(subjectTpl, vars),
    body: render(bodyTpl, vars),
  };
}
