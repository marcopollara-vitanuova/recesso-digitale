import { EmailStatus, WithdrawalRequestStatus } from "@prisma/client";
import { prisma } from "@/lib/prisma";

export type ResendWebhookEvent = {
  type: string;
  created_at?: string;
  data?: {
    email_id?: string;
    to?: string[];
    subject?: string;
    bounce?: { type?: string; subType?: string; message?: string };
    failed?: { reason?: string };
  };
};

const EVENT_STATUS: Record<string, EmailStatus> = {
  "email.sent": EmailStatus.SENT,
  "email.delivered": EmailStatus.DELIVERED,
  "email.delivery_delayed": EmailStatus.RETRYING,
  "email.bounced": EmailStatus.BOUNCED,
  "email.complained": EmailStatus.COMPLAINED,
  "email.suppressed": EmailStatus.SUPPRESSED,
  "email.failed": EmailStatus.FAILED,
};

/**
 * Gli eventi possono arrivare fuori ordine: un `email.sent` in ritardo non deve
 * sovrascrivere un bounce già registrato. Vince sempre lo stato più "avanzato".
 */
const STATUS_RANK: Record<EmailStatus, number> = {
  [EmailStatus.PENDING]: 0,
  [EmailStatus.SENT]: 1,
  [EmailStatus.RETRYING]: 2,
  [EmailStatus.DELIVERED]: 3,
  [EmailStatus.FAILED]: 4,
  [EmailStatus.SUPPRESSED]: 4,
  [EmailStatus.BOUNCED]: 5,
  [EmailStatus.COMPLAINED]: 6,
};

const FAILED_STATUSES: EmailStatus[] = [
  EmailStatus.FAILED,
  EmailStatus.BOUNCED,
  EmailStatus.COMPLAINED,
  EmailStatus.SUPPRESSED,
];

const OK_STATUSES: EmailStatus[] = [EmailStatus.SENT, EmailStatus.DELIVERED];

/** Stati della richiesta derivati dagli invii: gli altri sono decisioni umane. */
const DERIVED_REQUEST_STATUSES: WithdrawalRequestStatus[] = [
  WithdrawalRequestStatus.RECEIVED,
  WithdrawalRequestStatus.EMAIL_SENT,
  WithdrawalRequestStatus.PARTIAL_EMAIL_FAILURE,
  WithdrawalRequestStatus.EMAIL_FAILED,
];

export function statusForEvent(eventType: string): EmailStatus | undefined {
  return EVENT_STATUS[eventType];
}

export function errorMessageForEvent(event: ResendWebhookEvent): string | undefined {
  const bounce = event.data?.bounce;
  if (bounce) {
    const detail = [bounce.type, bounce.subType].filter(Boolean).join("/");
    return [detail, bounce.message].filter(Boolean).join(" — ") || undefined;
  }
  return event.data?.failed?.reason ?? undefined;
}

export type ApplyResult =
  | { applied: false; reason: "unknown_event" | "log_not_found" | "stale_event" }
  | { applied: true; logId: string; from: EmailStatus; to: EmailStatus };

/**
 * Applica l'evento all'EmailLog corrispondente e riallinea lo stato della
 * richiesta di recesso, così che un bounce sia visibile in lista admin.
 */
export async function applyWebhookEvent(event: ResendWebhookEvent): Promise<ApplyResult> {
  const nextStatus = statusForEvent(event.type);
  if (!nextStatus) return { applied: false, reason: "unknown_event" };

  const emailId = event.data?.email_id;
  if (!emailId) return { applied: false, reason: "log_not_found" };

  const log = await prisma.emailLog.findFirst({
    where: { providerMessageId: emailId },
    orderBy: { createdAt: "desc" },
  });
  if (!log) return { applied: false, reason: "log_not_found" };

  if (STATUS_RANK[nextStatus] < STATUS_RANK[log.status]) {
    return { applied: false, reason: "stale_event" };
  }

  const errorMessage = errorMessageForEvent(event);

  await prisma.emailLog.update({
    where: { id: log.id },
    data: {
      status: nextStatus,
      ...(errorMessage ? { errorMessage } : {}),
    },
  });

  await syncRequestStatus(log.withdrawalRequestId);

  return { applied: true, logId: log.id, from: log.status, to: nextStatus };
}

async function syncRequestStatus(withdrawalRequestId: string): Promise<void> {
  const request = await prisma.withdrawalRequest.findUnique({
    where: { id: withdrawalRequestId },
    select: { id: true, status: true },
  });
  if (!request || !DERIVED_REQUEST_STATUSES.includes(request.status)) return;

  const [failed, ok] = await Promise.all([
    prisma.emailLog.count({
      where: { withdrawalRequestId, status: { in: FAILED_STATUSES } },
    }),
    prisma.emailLog.count({
      where: { withdrawalRequestId, status: { in: OK_STATUSES } },
    }),
  ]);

  let status: WithdrawalRequestStatus | undefined;
  if (failed > 0 && ok > 0) status = WithdrawalRequestStatus.PARTIAL_EMAIL_FAILURE;
  else if (failed > 0) status = WithdrawalRequestStatus.EMAIL_FAILED;
  else if (ok > 0) status = WithdrawalRequestStatus.EMAIL_SENT;

  if (!status || status === request.status) return;

  await prisma.withdrawalRequest.update({ where: { id: withdrawalRequestId }, data: { status } });
}
