import { PrismaClient, UserRole } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

const DEFAULT_SETTINGS: Array<{
  key: string;
  value: string;
  type: string;
  description: string;
}> = [
  { key: "broker_name", value: "Vitanuova Broker", type: "string", description: "Nome broker" },
  { key: "broker_email", value: "recessi@vitanuova.it", type: "string", description: "Email broker principale" },
  { key: "broker_cc_emails", value: "[]", type: "json", description: "Email broker in CC" },
  { key: "broker_bcc_emails", value: "[]", type: "json", description: "Email broker in BCC" },
  { key: "email_from", value: "Recessi <onboarding@resend.dev>", type: "string", description: "Mittente email" },
  { key: "email_reply_to", value: "assistenza@vitanuova.it", type: "string", description: "Reply-To" },
  { key: "privacy_policy_url", value: "https://www.vitanuova.it/privacy", type: "string", description: "URL informativa privacy" },
  { key: "public_form_enabled", value: "true", type: "boolean", description: "Form pubblico attivo" },
  { key: "maintenance_message", value: "Il servizio è temporaneamente non disponibile.", type: "string", description: "Messaggio manutenzione" },
  { key: "require_policy_issue_date", value: "false", type: "boolean", description: "Data emissione obbligatoria" },
  { key: "captcha_enabled", value: "false", type: "boolean", description: "Captcha attivo" },
  { key: "rate_limit_per_ip_per_hour", value: "5", type: "number", description: "Limite invii per IP/ora" },
  { key: "timezone", value: "Europe/Rome", type: "string", description: "Timezone" },
];

const EMAIL_TEMPLATES = [
  {
    templateKey: "insurance_company_withdrawal",
    name: "Email alla compagnia",
    subject:
      "Richiesta di recesso polizza n. {{policyNumber}} - {{customerFirstName}} {{customerLastName}}",
    bodyText: `Spett.le {{insuranceCompanyName}},

con la presente si trasmette la richiesta di recesso esercitata online dal cliente tramite l'interfaccia digitale messa a disposizione da {{brokerName}}.

Dati richiesta:
- ID richiesta: {{requestId}}
- Data e ora richiesta: {{createdAt}}
- Nome e cognome cliente: {{customerFirstName}} {{customerLastName}}
- Codice fiscale: {{customerFiscalCode}}
- Email cliente: {{customerEmail}}
- Numero polizza/contratto: {{policyNumber}}
- Compagnia selezionata: {{insuranceCompanyName}}

Il cliente dichiara di voler esercitare il diritto di recesso relativo alla polizza/contratto sopra indicato.

La presente comunicazione viene generata automaticamente a seguito della conferma effettuata dal cliente tramite interfaccia online.

Cordiali saluti,
{{brokerName}}`,
  },
  {
    templateKey: "customer_confirmation",
    name: "Conferma al cliente",
    subject: "Conferma ricezione richiesta di recesso - polizza n. {{policyNumber}}",
    bodyText: `Gentile {{customerFirstName}} {{customerLastName}},

confermiamo di aver ricevuto la tua richiesta di recesso relativa alla polizza/contratto n. {{policyNumber}}, riferita alla compagnia {{insuranceCompanyName}}.

La richiesta è stata registrata in data {{createdAt}} con ID {{requestId}} ed è stata trasmessa alla compagnia assicurativa selezionata e a {{brokerName}}.

Riepilogo dati:
- Nome e cognome: {{customerFirstName}} {{customerLastName}}
- Codice fiscale: {{customerFiscalCode}}
- Email: {{customerEmail}}
- Numero polizza/contratto: {{policyNumber}}
- Compagnia: {{insuranceCompanyName}}

La richiesta sarà gestita secondo le procedure previste dalla compagnia assicurativa e dalla normativa applicabile.

Cordiali saluti,
{{brokerName}}`,
  },
  {
    templateKey: "broker_notification",
    name: "Notifica broker",
    subject:
      "Nuova richiesta di recesso ricevuta - {{insuranceCompanyName}} - {{policyNumber}}",
    bodyText: `È stata ricevuta una nuova richiesta di recesso.

ID richiesta: {{requestId}}
Data e ora: {{createdAt}}

Cliente:
{{customerFirstName}} {{customerLastName}}
Codice fiscale: {{customerFiscalCode}}
Email: {{customerEmail}}

Polizza:
Numero polizza/contratto: {{policyNumber}}
Compagnia: {{insuranceCompanyName}}

La richiesta è stata inviata automaticamente alla compagnia all'indirizzo:
{{insuranceCompanyEmail}}`,
  },
  {
    templateKey: "technical_alert",
    name: "Alert tecnico",
    subject: "Errore invio email - richiesta {{requestId}}",
    bodyText: `Si è verificato un errore tecnico durante l'invio email per la richiesta {{requestId}}.

Cliente: {{customerFirstName}} {{customerLastName}}
Polizza: {{policyNumber}}
Compagnia: {{insuranceCompanyName}}

Verificare i log email nell'area amministrativa.`,
  },
];

async function main() {
  const adminEmail = process.env.SEED_ADMIN_EMAIL ?? "admin@example.com";
  const adminPassword = process.env.SEED_ADMIN_PASSWORD ?? "ChangeMe123!";
  const passwordHash = await bcrypt.hash(adminPassword, 12);

  const admin = await prisma.user.upsert({
    where: { email: adminEmail },
    update: {
      passwordHash,
      name: "Amministratore",
      role: UserRole.SUPER_ADMIN,
      isActive: true,
    },
    create: {
      email: adminEmail,
      passwordHash,
      name: "Amministratore",
      role: UserRole.SUPER_ADMIN,
      isActive: true,
    },
  });

  console.log(`Admin: ${admin.email} (${admin.role})`);

  for (const s of DEFAULT_SETTINGS) {
    await prisma.setting.upsert({
      where: { key: s.key },
      update: { value: s.value, type: s.type, description: s.description },
      create: s,
    });
  }
  console.log(`Settings: ${DEFAULT_SETTINGS.length} chiavi`);

  for (const t of EMAIL_TEMPLATES) {
    await prisma.emailTemplate.upsert({
      where: { templateKey: t.templateKey },
      update: {
        name: t.name,
        subject: t.subject,
        bodyText: t.bodyText,
        isActive: true,
      },
      create: { ...t, isActive: true },
    });
  }
  console.log(`Email templates: ${EMAIL_TEMPLATES.length}`);

  const companies = [
    {
      legalName: "Compagnia Demo Uno S.p.A.",
      displayName: "Compagnia Demo 1",
      internalCode: "DEMO01",
      withdrawalEmail: "recessi.demo1@example.com",
      secondaryEmails: ["archivio.demo1@example.com"],
    },
    {
      legalName: "Compagnia Demo Due S.p.A.",
      displayName: "Compagnia Demo 2",
      internalCode: "DEMO02",
      withdrawalEmail: "recessi.demo2@example.com",
      secondaryEmails: [] as string[],
    },
  ];

  for (const c of companies) {
    await prisma.insuranceCompany.upsert({
      where: { internalCode: c.internalCode },
      update: {
        legalName: c.legalName,
        displayName: c.displayName,
        withdrawalEmail: c.withdrawalEmail,
        secondaryEmails: c.secondaryEmails,
        isActive: true,
        updatedById: admin.id,
      },
      create: {
        ...c,
        secondaryEmails: c.secondaryEmails,
        isActive: true,
        createdById: admin.id,
        updatedById: admin.id,
      },
    });
  }
  console.log(`Insurance companies: ${companies.length}`);

  console.log("\n⚠️  Cambia la password admin in produzione!");
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  });
