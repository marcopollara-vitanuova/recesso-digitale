import { prisma } from "@/lib/prisma";
import { TemplatesEditor, type TemplateRow } from "./templates-editor";

export default async function EmailTemplatesPage() {
  const templates = await prisma.emailTemplate.findMany({ orderBy: { name: "asc" } });

  const rows: TemplateRow[] = templates.map((t) => ({
    id: t.id,
    templateKey: t.templateKey,
    name: t.name,
    subject: t.subject,
    bodyText: t.bodyText,
    bodyHtml: t.bodyHtml,
    isActive: t.isActive,
  }));

  return <TemplatesEditor templates={rows} />;
}
