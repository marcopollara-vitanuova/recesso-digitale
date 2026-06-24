"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  ALLOWED_TEMPLATE_VARS,
  TEMPLATE_VAR_LABELS,
  SAMPLE_TEMPLATE_VARS,
  findUnknownPlaceholders,
  renderTemplate,
} from "@/lib/email/template-vars";

export type TemplateRow = {
  id: string;
  templateKey: string;
  name: string;
  subject: string;
  bodyText: string;
  bodyHtml: string | null;
  isActive: boolean;
};

function TemplateCard({ template }: { template: TemplateRow }) {
  const router = useRouter();
  const [subject, setSubject] = useState(template.subject);
  const [bodyText, setBodyText] = useState(template.bodyText);
  const [bodyHtml, setBodyHtml] = useState(template.bodyHtml ?? "");
  const [isActive, setIsActive] = useState(template.isActive);
  const [showPreview, setShowPreview] = useState(false);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ type: "ok" | "err"; text: string } | null>(null);

  const unknown = useMemo(
    () => [
      ...new Set([
        ...findUnknownPlaceholders(subject),
        ...findUnknownPlaceholders(bodyText),
        ...findUnknownPlaceholders(bodyHtml),
      ]),
    ],
    [subject, bodyText, bodyHtml],
  );

  const dirty =
    subject !== template.subject ||
    bodyText !== template.bodyText ||
    (bodyHtml ?? "") !== (template.bodyHtml ?? "") ||
    isActive !== template.isActive;

  async function save() {
    setSaving(true);
    setMessage(null);
    try {
      const res = await fetch(`/api/admin/email-templates/${template.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ subject, bodyText, bodyHtml, isActive }),
      });
      if (!res.ok) {
        const json = await res.json().catch(() => ({}));
        setMessage({ type: "err", text: json.error ?? "Errore durante il salvataggio" });
        setSaving(false);
        return;
      }
      setMessage({ type: "ok", text: "Template salvato correttamente." });
      setSaving(false);
      router.refresh();
    } catch {
      setMessage({ type: "err", text: "Errore di rete durante il salvataggio" });
      setSaving(false);
    }
  }

  const previewSubject = renderTemplate(subject, SAMPLE_TEMPLATE_VARS);
  const previewBody = renderTemplate(bodyText, SAMPLE_TEMPLATE_VARS);
  const previewHtml = bodyHtml ? renderTemplate(bodyHtml, SAMPLE_TEMPLATE_VARS, "html") : "";

  return (
    <Card>
      <CardHeader>
        <CardTitle>{template.name}</CardTitle>
        <p className="text-xs text-[var(--gray-500)]">{template.templateKey}</p>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-1.5">
          <Label htmlFor={`subject-${template.id}`}>Oggetto</Label>
          <Input
            id={`subject-${template.id}`}
            value={subject}
            onChange={(e) => setSubject(e.target.value)}
          />
        </div>

        <div className="space-y-1.5">
          <Label htmlFor={`bodyText-${template.id}`}>Corpo (testo)</Label>
          <Textarea
            id={`bodyText-${template.id}`}
            className="min-h-[10rem] font-mono text-xs"
            value={bodyText}
            onChange={(e) => setBodyText(e.target.value)}
          />
        </div>

        <details className="rounded-lg border border-[var(--gray-200)] p-3">
          <summary className="cursor-pointer text-sm font-semibold text-[var(--gray-700)]">
            Corpo HTML (formattazione, opzionale)
          </summary>
          <div className="mt-3 space-y-1.5">
            <Label htmlFor={`bodyHtml-${template.id}`}>HTML</Label>
            <Textarea
              id={`bodyHtml-${template.id}`}
              className="min-h-[10rem] font-mono text-xs"
              value={bodyHtml}
              onChange={(e) => setBodyHtml(e.target.value)}
              placeholder="Se valorizzato, l'email verrà inviata anche in formato HTML. Le variabili vengono protette (escape) automaticamente."
            />
          </div>
        </details>

        <div className="rounded-lg bg-[var(--gray-50)] p-3">
          <p className="text-xs font-semibold text-[var(--gray-700)]">Variabili disponibili</p>
          <ul className="mt-2 flex flex-wrap gap-2">
            {ALLOWED_TEMPLATE_VARS.map((v) => (
              <li key={v}>
                <code className="rounded bg-white px-1.5 py-0.5 text-xs text-[var(--primary-800)] ring-1 ring-[var(--gray-200)]">
                  {`{{${v}}}`}
                </code>{" "}
                <span className="text-xs text-[var(--gray-500)]">{TEMPLATE_VAR_LABELS[v]}</span>
              </li>
            ))}
          </ul>
        </div>

        <label className="flex items-center gap-2 text-sm text-[var(--gray-900)]">
          <input
            type="checkbox"
            className="size-4 accent-[var(--primary-700)]"
            checked={isActive}
            onChange={(e) => setIsActive(e.target.checked)}
          />
          Template attivo (se disattivato si usa il testo di fallback predefinito)
        </label>

        {unknown.length > 0 ? (
          <p role="alert" className="text-sm font-medium text-[var(--error-500)]">
            Variabili non valide: {unknown.map((u) => `{{${u}}}`).join(", ")}. Correggi prima di salvare.
          </p>
        ) : null}

        {message ? (
          <p
            role={message.type === "err" ? "alert" : "status"}
            className={
              message.type === "err"
                ? "text-sm font-medium text-[var(--error-500)]"
                : "text-sm font-medium text-[#166534]"
            }
          >
            {message.text}
          </p>
        ) : null}

        <div className="flex flex-wrap items-center gap-3">
          <Button onClick={save} disabled={saving || unknown.length > 0 || !dirty} aria-busy={saving}>
            {saving ? "Salvataggio…" : "Salva modifiche"}
          </Button>
          <Button type="button" variant="outline" onClick={() => setShowPreview((v) => !v)}>
            {showPreview ? "Nascondi anteprima" : "Mostra anteprima"}
          </Button>
        </div>

        {showPreview ? (
          <div className="space-y-2 rounded-lg border border-[var(--gray-200)] bg-white p-3">
            <p className="text-xs font-semibold text-[var(--gray-700)]">
              Anteprima con dati di esempio
            </p>
            <p className="text-sm">
              <strong>Oggetto:</strong> {previewSubject}
            </p>
            <pre className="max-h-48 overflow-auto whitespace-pre-wrap rounded bg-[var(--gray-50)] p-3 text-xs">
              {previewBody}
            </pre>
            {previewHtml ? (
              <div className="space-y-1">
                <p className="text-xs font-semibold text-[var(--gray-700)]">Anteprima HTML</p>
                <div
                  className="overflow-auto rounded border border-[var(--gray-200)] bg-white p-3 text-sm"
                  // Preview lato admin con dati di esempio; le variabili sono HTML-escaped in renderTemplate.
                  dangerouslySetInnerHTML={{ __html: previewHtml }}
                />
              </div>
            ) : null}
          </div>
        ) : null}
      </CardContent>
    </Card>
  );
}

export function TemplatesEditor({ templates }: { templates: TemplateRow[] }) {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-[var(--primary-900)]">Template email</h1>
        <p className="text-[var(--gray-600)]">
          Modifica oggetto, testo e formattazione. Usa solo le variabili elencate.
        </p>
      </div>
      {templates.map((t) => (
        <TemplateCard key={t.id} template={t} />
      ))}
    </div>
  );
}
