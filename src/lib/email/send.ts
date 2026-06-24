import { Resend } from "resend";
import { EmailStatus, EmailType } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { getRenderedTemplate, type TemplateKey, type TemplateVars } from "@/lib/email/templates";

const resend = new Resend(process.env.RESEND_API_KEY);

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

  const log = await prisma.emailLog.create({
    data: {
      withdrawalRequestId: params.withdrawalRequestId,
      emailType: params.emailType,
      recipientTo: params.to,
      recipientCc: params.cc?.join(", ") ?? null,
      recipientBcc: params.bcc?.join(", ") ?? null,
      subject,
      body,
      provider: "resend",
      status: EmailStatus.PENDING,
    },
  });

  try {
    const result = await resend.emails.send({
      from: params.from,
      to: [params.to],
      cc: params.cc,
      bcc: params.bcc,
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
