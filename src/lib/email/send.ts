import { Resend } from "resend";
import { EmailStatus, EmailType } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { getRenderedTemplate, type TemplateKey, type TemplateVars } from "@/lib/email/templates";
import { fetchSuppressedEmails, planRecipients } from "@/lib/email/suppression";

const resend = new Resend(process.env.RESEND_API_KEY);

/**
 * In modalità dry-run (es. staging/test) non viene effettuata alcuna chiamata
 * reale a Resend: l'EmailLog viene comunque registrato come inviato per poter
 * verificare destinatari, CC e contenuto in sicurezza.
 */
const EMAIL_DRY_RUN = process.env.EMAIL_DRY_RUN === "true";

type SendParams = {
  withdrawalRequestId: string;
  emailType: EmailType;
  templateKey: TemplateKey;
  vars: TemplateVars;
  to: string;
  cc?: string[];
  bcc?: string[];
  from: string;
  replyTo?: string;
};

export async function sendTemplatedEmail(params: SendParams): Promise<{ ok: boolean; logId: string }> {
  const { subject, body, html } = await getRenderedTemplate(params.templateKey, params.vars);

  // Suppression-aware: rimuove i destinatari soppressi da CC/BCC (evita che un
  // indirizzo guasto faccia sopprimere l'intero messaggio) e rileva se il
  // destinatario principale è soppresso. Saltato in dry-run.
  const suppressed = EMAIL_DRY_RUN
    ? new Set<string>()
    : await fetchSuppressedEmails(process.env.RESEND_API_KEY);
  const plan = planRecipients(params.to, params.cc, params.bcc, suppressed);

  const log = await prisma.emailLog.create({
    data: {
      withdrawalRequestId: params.withdrawalRequestId,
      emailType: params.emailType,
      recipientTo: params.to,
      recipientCc: plan.cc.length ? plan.cc.join(", ") : null,
      recipientBcc: plan.bcc.length ? plan.bcc.join(", ") : null,
      subject,
      body,
      provider: "resend",
      status: EmailStatus.PENDING,
    },
  });

  if (EMAIL_DRY_RUN) {
    await prisma.emailLog.update({
      where: { id: log.id },
      data: {
        status: EmailStatus.SENT,
        provider: "dry-run",
        providerMessageId: "dry-run",
        sentAt: new Date(),
      },
    });
    return { ok: true, logId: log.id };
  }

  // Destinatario principale soppresso: non inviare e segnalare il fallimento
  // (in passato risultava erroneamente "SENT" pur non essendo mai partita).
  if (plan.toSuppressed) {
    await prisma.emailLog.update({
      where: { id: log.id },
      data: {
        status: EmailStatus.SUPPRESSED,
        errorMessage:
          "Destinatario in suppression list Resend (bounce precedente): email non inviata. Verificare la casella della compagnia/destinatario.",
      },
    });
    return { ok: false, logId: log.id };
  }

  try {
    const result = await resend.emails.send({
      from: params.from,
      to: [params.to],
      cc: plan.cc.length ? plan.cc : undefined,
      bcc: plan.bcc.length ? plan.bcc : undefined,
      replyTo: params.replyTo,
      subject,
      text: body,
      ...(html ? { html } : {}),
    });

    if (result.error) {
      await prisma.emailLog.update({
        where: { id: log.id },
        data: {
          status: EmailStatus.FAILED,
          errorMessage: result.error.message,
        },
      });
      return { ok: false, logId: log.id };
    }

    await prisma.emailLog.update({
      where: { id: log.id },
      data: {
        status: EmailStatus.SENT,
        providerMessageId: result.data?.id ?? null,
        sentAt: new Date(),
      },
    });
    return { ok: true, logId: log.id };
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown email error";
    await prisma.emailLog.update({
      where: { id: log.id },
      data: { status: EmailStatus.FAILED, errorMessage: message },
    });
    return { ok: false, logId: log.id };
  }
}

export async function resendFromLog(logId: string, from: string, replyTo?: string) {
  const log = await prisma.emailLog.findUniqueOrThrow({ where: { id: logId } });
  return sendTemplatedEmail({
    withdrawalRequestId: log.withdrawalRequestId,
    emailType: log.emailType,
    templateKey: mapEmailTypeToTemplate(log.emailType),
    vars: {},
    to: log.recipientTo,
    from,
    replyTo,
  });
}

function mapEmailTypeToTemplate(type: EmailType): TemplateKey {
  switch (type) {
    case "TO_INSURANCE_COMPANY":
      return "insurance_company_withdrawal";
    case "TO_CUSTOMER":
      return "customer_confirmation";
    case "TO_BROKER":
      return "broker_notification";
    default:
      return "technical_alert";
  }
}

export function computeRequestStatus(results: boolean[]) {
  const success = results.filter(Boolean).length;
  const failed = results.filter((r) => !r).length;
  if (success > 0 && failed > 0) return "PARTIAL_EMAIL_FAILURE";
  if (success === 0) return "EMAIL_FAILED";
  return "EMAIL_SENT";
}
