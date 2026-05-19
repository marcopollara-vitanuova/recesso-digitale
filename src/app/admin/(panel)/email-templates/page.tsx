import { prisma } from "@/lib/prisma";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default async function EmailTemplatesPage() {
  const templates = await prisma.emailTemplate.findMany({ orderBy: { name: "asc" } });

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Template email</h1>
      {templates.map((t) => (
        <Card key={t.id}>
          <CardHeader>
            <CardTitle>{t.name}</CardTitle>
            <p className="text-xs text-slate-500">{t.templateKey}</p>
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
            <p><strong>Oggetto:</strong> {t.subject}</p>
            <pre className="max-h-48 overflow-auto rounded bg-slate-50 p-3 text-xs whitespace-pre-wrap">{t.bodyText}</pre>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
