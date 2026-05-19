import { prisma } from "@/lib/prisma";

export type AppSettings = {
  brokerName: string;
  brokerEmail: string;
  brokerCcEmails: string[];
  brokerBccEmails: string[];
  emailFrom: string;
  emailReplyTo: string;
  privacyPolicyUrl: string;
  publicFormEnabled: boolean;
  maintenanceMessage: string;
  requirePolicyIssueDate: boolean;
  captchaEnabled: boolean;
  rateLimitPerIpPerHour: number;
  timezone: string;
};

function parseJsonArray(value: string): string[] {
  try {
    const parsed = JSON.parse(value) as unknown;
    return Array.isArray(parsed) ? parsed.filter((x): x is string => typeof x === "string") : [];
  } catch {
    return [];
  }
}

export async function getAppSettings(): Promise<AppSettings> {
  const rows = await prisma.setting.findMany();
  const map = Object.fromEntries(rows.map((r) => [r.key, r.value]));

  return {
    brokerName: map.broker_name ?? "Broker",
    brokerEmail: map.broker_email ?? "recessi@example.com",
    brokerCcEmails: parseJsonArray(map.broker_cc_emails ?? "[]"),
    brokerBccEmails: parseJsonArray(map.broker_bcc_emails ?? "[]"),
    emailFrom: map.email_from ?? process.env.EMAIL_FROM ?? "Recessi <onboarding@resend.dev>",
    emailReplyTo: map.email_reply_to ?? process.env.EMAIL_REPLY_TO ?? "assistenza@example.com",
    privacyPolicyUrl: map.privacy_policy_url ?? "#",
    publicFormEnabled: (map.public_form_enabled ?? "true") === "true",
    maintenanceMessage: map.maintenance_message ?? "Servizio non disponibile.",
    requirePolicyIssueDate: (map.require_policy_issue_date ?? "false") === "true",
    captchaEnabled: (map.captcha_enabled ?? "false") === "true",
    rateLimitPerIpPerHour: Number(map.rate_limit_per_ip_per_hour ?? "5") || 5,
    timezone: map.timezone ?? process.env.DEFAULT_TIMEZONE ?? "Europe/Rome",
  };
}

export async function upsertSetting(key: string, value: string, type = "string", description?: string) {
  return prisma.setting.upsert({
    where: { key },
    update: { value, type, description },
    create: { key, value, type, description },
  });
}
