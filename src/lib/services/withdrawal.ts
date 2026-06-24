import {
  EmailType,
  WithdrawalRequestStatus,
  type WithdrawalRequest,
} from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { getAppSettings } from "@/lib/settings";
import { generatePublicRequestId } from "@/lib/public-id";
import { isRateLimited } from "@/lib/rate-limit";
import { buildTemplateVars } from "@/lib/email/templates";
import { computeRequestStatus, sendTemplatedEmail } from "@/lib/email/send";
import type { WithdrawalRequestInput } from "@/lib/validations/withdrawal";

export class WithdrawalServiceError extends Error {
  constructor(
    message: string,
    public code: string,
    public status = 400,
  ) {
    super(message);
  }
}

export async function createWithdrawalRequest(
  input: WithdrawalRequestInput,
  meta: { ip?: string; userAgent?: string },
): Promise<{ request: WithdrawalRequest; emailWarning: boolean }> {
  if (input.website) {
    throw new WithdrawalServiceError("Richiesta non valida", "SPAM_DETECTED", 400);
  }

  const settings = await getAppSettings();

  if (!settings.publicFormEnabled) {
    throw new WithdrawalServiceError(settings.maintenanceMessage, "FORM_DISABLED", 503);
  }

  if (meta.ip && (await isRateLimited(meta.ip, settings.rateLimitPerIpPerHour))) {
    throw new WithdrawalServiceError(
      "Troppe richieste da questo indirizzo. Riprova più tardi.",
      "RATE_LIMIT",
      429,
    );
  }

  if (settings.requirePolicyIssueDate && !input.policyIssueDate) {
    throw new WithdrawalServiceError(
      "La data di emissione polizza è obbligatoria",
      "POLICY_DATE_REQUIRED",
      400,
    );
  }

  const company = await prisma.insuranceCompany.findFirst({
    where: { id: input.insuranceCompanyId, isActive: true },
  });

  if (!company) {
    throw new WithdrawalServiceError("Compagnia non valida o non attiva", "INVALID_COMPANY", 400);
  }

  const publicId = await generatePublicRequestId();
  const policyIssueDate = input.policyIssueDate
    ? new Date(input.policyIssueDate)
    : null;

  const request = await prisma.withdrawalRequest.create({
    data: {
      publicId,
      status: WithdrawalRequestStatus.RECEIVED,
      customerFirstName: input.customerFirstName,
      customerLastName: input.customerLastName,
      customerFiscalCode: input.customerFiscalCode,
      customerEmail: input.customerEmail,
      customerPhone: input.customerPhone || null,
      policyNumber: input.policyNumber,
      policyIssueDate,
      productType: input.productType || null,
      customerNotes: input.customerNotes || null,
      insuranceCompanyId: company.id,
      insuranceCompanyNameSnapshot: company.displayName,
      insuranceCompanyEmailSnapshot: company.withdrawalEmail,
      brokerEmailSnapshot: settings.brokerEmail,
      privacyAccepted: input.privacyAccepted,
      withdrawalDeclarationAccepted: input.withdrawalDeclarationAccepted,
      dataConfirmationAccepted: input.dataConfirmationAccepted,
      ipAddress: meta.ip ?? null,
      userAgent: meta.userAgent ?? null,
    },
  });

  const vars = buildTemplateVars(request, settings);
  const ccBroker = [settings.brokerEmail, ...settings.brokerCcEmails].filter(Boolean);
  const bcc = settings.brokerBccEmails;

  const companyResult = await sendTemplatedEmail({
    withdrawalRequestId: request.id,
    emailType: EmailType.TO_INSURANCE_COMPANY,
    templateKey: "insurance_company_withdrawal",
    vars,
    to: company.withdrawalEmail,
    cc: ccBroker,
    bcc,
    from: settings.emailFrom,
    replyTo: settings.emailReplyTo,
  });

  const customerResult = await sendTemplatedEmail({
    withdrawalRequestId: request.id,
    emailType: EmailType.TO_CUSTOMER,
    templateKey: "customer_confirmation",
    vars,
    to: request.customerEmail,
    bcc,
    from: settings.emailFrom,
    replyTo: settings.emailReplyTo,
  });

  const brokerResult = await sendTemplatedEmail({
    withdrawalRequestId: request.id,
    emailType: EmailType.TO_BROKER,
    templateKey: "broker_notification",
    vars,
    to: settings.brokerEmail,
    from: settings.emailFrom,
    replyTo: settings.emailReplyTo,
  });

  const results = [companyResult.ok, customerResult.ok, brokerResult.ok];
  const status = computeRequestStatus(results);

  const updated = await prisma.withdrawalRequest.update({
    where: { id: request.id },
    data: { status },
  });

  if (status === "EMAIL_FAILED" || status === "PARTIAL_EMAIL_FAILURE") {
    await sendTemplatedEmail({
      withdrawalRequestId: request.id,
      emailType: EmailType.TECHNICAL_ALERT,
      templateKey: "technical_alert",
      vars,
      to: settings.brokerEmail,
      from: settings.emailFrom,
    });
  }

  return {
    request: updated,
    emailWarning: status !== "EMAIL_SENT",
  };
}

export async function resendCompanyEmail(requestId: string, userId: string) {
  const settings = await getAppSettings();
  const request = await prisma.withdrawalRequest.findUniqueOrThrow({ where: { id: requestId } });
  const vars = buildTemplateVars(request, settings);
  const result = await sendTemplatedEmail({
    withdrawalRequestId: request.id,
    emailType: EmailType.TO_INSURANCE_COMPANY,
    templateKey: "insurance_company_withdrawal",
    vars,
    to: request.insuranceCompanyEmailSnapshot,
    cc: [settings.brokerEmail],
    from: settings.emailFrom,
    replyTo: settings.emailReplyTo,
  });
  await prisma.auditLog.create({
    data: {
      userId,
      action: "RESEND_EMAIL",
      entityType: "WithdrawalRequest",
      entityId: requestId,
      afterData: { type: "TO_INSURANCE_COMPANY", ok: result.ok },
    },
  });
  return result;
}

export async function resendCustomerEmail(requestId: string, userId: string) {
  const settings = await getAppSettings();
  const request = await prisma.withdrawalRequest.findUniqueOrThrow({ where: { id: requestId } });
  const vars = buildTemplateVars(request, settings);
  const result = await sendTemplatedEmail({
    withdrawalRequestId: request.id,
    emailType: EmailType.TO_CUSTOMER,
    templateKey: "customer_confirmation",
    vars,
    to: request.customerEmail,
    from: settings.emailFrom,
    replyTo: settings.emailReplyTo,
  });
  await prisma.auditLog.create({
    data: {
      userId,
      action: "RESEND_EMAIL",
      entityType: "WithdrawalRequest",
      entityId: requestId,
      afterData: { type: "TO_CUSTOMER", ok: result.ok },
    },
  });
  return result;
}
