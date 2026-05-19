"use client";

import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { withdrawalRequestSchema, type WithdrawalRequestInput } from "@/lib/validations/withdrawal";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatDateTimeRome } from "@/lib/datetime";

type Company = { id: string; displayName: string };

type Step = "landing" | "form" | "review" | "success" | "error";

export function RecessoFlow({ privacyUrl }: { privacyUrl: string }) {
  const [step, setStep] = useState<Step>("landing");
  const [companies, setCompanies] = useState<Company[]>([]);
  const [submitError, setSubmitError] = useState("");
  const [result, setResult] = useState<{ publicId: string; submittedAt: string; emailWarning?: boolean; message?: string } | null>(null);

  const form = useForm<WithdrawalRequestInput>({
    resolver: zodResolver(withdrawalRequestSchema),
    defaultValues: {
      privacyAccepted: false,
      withdrawalDeclarationAccepted: false,
      dataConfirmationAccepted: false,
      website: "",
    },
  });

  useEffect(() => {
    fetch("/api/public/insurance-companies")
      .then((r) => r.json())
      .then(setCompanies)
      .catch(() => setCompanies([]));
  }, []);

  async function onConfirm() {
    const data = form.getValues();
    setSubmitError("");
    const res = await fetch("/api/public/withdrawal-requests", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
    const json = await res.json();
    if (!res.ok) {
      setSubmitError(json.error ?? "Errore durante l'invio");
      setStep("error");
      return;
    }
    setResult(json);
    setStep(json.emailWarning ? "error" : "success");
  }

  const values = form.watch();

  if (step === "landing") {
    return (
      <Card className="mx-auto max-w-2xl">
        <CardHeader>
          <CardTitle className="text-2xl">Esercita il diritto di recesso</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4 text-slate-600">
          <p>
            Puoi inviare online la richiesta di recesso relativa a una polizza assicurativa acquistata tramite
            canale digitale. La richiesta sarà trasmessa alla compagnia selezionata e al broker.
          </p>
          <p className="text-sm">Ti serviranno: nome, cognome, codice fiscale, email, numero polizza e compagnia assicurativa.</p>
          <Button variant="teal" size="lg" onClick={() => setStep("form")}>
            Inizia la richiesta di recesso
          </Button>
        </CardContent>
      </Card>
    );
  }

  if (step === "success" && result) {
    return (
      <Card className="mx-auto max-w-2xl border-teal-200">
        <CardHeader>
          <CardTitle className="text-teal-800">Richiesta di recesso inviata correttamente</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p>
            Abbiamo ricevuto la tua richiesta. È stata trasmessa alla compagnia assicurativa e al broker in data{" "}
            <strong>{formatDateTimeRome(new Date(result.submittedAt))}</strong>.
          </p>
          <p>
            <strong>ID richiesta:</strong> {result.publicId}
          </p>
          <p className="text-sm text-slate-600">Riceverai una email di conferma all&apos;indirizzo indicato.</p>
          <Button variant="secondary" onClick={() => (window.location.href = "/")}>
            Torna alla homepage
          </Button>
        </CardContent>
      </Card>
    );
  }

  if (step === "error") {
    return (
      <Card className="mx-auto max-w-2xl border-amber-200">
        <CardHeader>
          <CardTitle className="text-amber-800">Attenzione</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p>{result?.message ?? submitError ?? "Si è verificato un problema."}</p>
          {result?.publicId && <p><strong>ID richiesta:</strong> {result.publicId}</p>}
          <div className="flex gap-3">
            <Button variant="secondary" onClick={() => setStep("form")}>Modifica dati</Button>
            {result?.publicId && (
              <Button onClick={() => (window.location.href = "/")}>Torna alla homepage</Button>
            )}
          </div>
        </CardContent>
      </Card>
    );
  }

  if (step === "review") {
    const company = companies.find((c) => c.id === values.insuranceCompanyId);
    return (
      <Card className="mx-auto max-w-2xl">
        <CardHeader>
          <CardTitle>Riepilogo richiesta</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 text-sm">
          <p><strong>Cliente:</strong> {values.customerFirstName} {values.customerLastName}</p>
          <p><strong>CF:</strong> {values.customerFiscalCode}</p>
          <p><strong>Email:</strong> {values.customerEmail}</p>
          <p><strong>Polizza:</strong> {values.policyNumber}</p>
          <p><strong>Compagnia:</strong> {company?.displayName}</p>
          {values.policyIssueDate && <p><strong>Data emissione:</strong> {values.policyIssueDate}</p>}
          {values.customerNotes && <p><strong>Note:</strong> {values.customerNotes}</p>}
          <p className="text-slate-600">Dichiari di voler esercitare il diritto di recesso sui dati indicati.</p>
          <div className="flex gap-3 pt-4">
            <Button variant="secondary" type="button" onClick={() => setStep("form")}>Modifica dati</Button>
            <Button variant="teal" type="button" onClick={onConfirm}>Conferma e invia richiesta di recesso</Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="mx-auto max-w-2xl">
      <CardHeader>
        <CardTitle>Richiesta di recesso</CardTitle>
      </CardHeader>
      <CardContent>
        <form
          className="space-y-4"
          onSubmit={form.handleSubmit(() => setStep("review"))}
        >
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <Label>Nome *</Label>
              <Input {...form.register("customerFirstName")} />
              <p className="text-xs text-red-600">{form.formState.errors.customerFirstName?.message}</p>
            </div>
            <div>
              <Label>Cognome *</Label>
              <Input {...form.register("customerLastName")} />
              <p className="text-xs text-red-600">{form.formState.errors.customerLastName?.message}</p>
            </div>
          </div>
          <div>
            <Label>Codice fiscale *</Label>
            <Input {...form.register("customerFiscalCode")} className="uppercase" />
            <p className="text-xs text-red-600">{form.formState.errors.customerFiscalCode?.message}</p>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <Label>Email *</Label>
              <Input type="email" {...form.register("customerEmail")} />
              <p className="text-xs text-red-600">{form.formState.errors.customerEmail?.message}</p>
            </div>
            <div>
              <Label>Conferma email *</Label>
              <Input type="email" {...form.register("customerEmailConfirm")} />
              <p className="text-xs text-red-600">{form.formState.errors.customerEmailConfirm?.message}</p>
            </div>
          </div>
          <div>
            <Label>Telefono</Label>
            <Input {...form.register("customerPhone")} />
          </div>
          <div>
            <Label>Numero polizza / contratto *</Label>
            <Input {...form.register("policyNumber")} />
            <p className="text-xs text-red-600">{form.formState.errors.policyNumber?.message}</p>
          </div>
          <div>
            <Label>Compagnia assicurativa *</Label>
            <select
              className="flex h-10 w-full rounded-lg border border-slate-300 bg-white px-3 text-sm"
              {...form.register("insuranceCompanyId")}
            >
              <option value="">Seleziona...</option>
              {companies.map((c) => (
                <option key={c.id} value={c.id}>{c.displayName}</option>
              ))}
            </select>
            <p className="text-xs text-red-600">{form.formState.errors.insuranceCompanyId?.message}</p>
          </div>
          <div>
            <Label>Data emissione / decorrenza</Label>
            <Input type="date" {...form.register("policyIssueDate")} />
          </div>
          <div>
            <Label>Prodotto / tipo polizza</Label>
            <Input {...form.register("productType")} />
          </div>
          <div>
            <Label>Note</Label>
            <textarea
              className="min-h-[80px] w-full rounded-lg border border-slate-300 p-3 text-sm"
              {...form.register("customerNotes")}
            />
          </div>
          <input type="text" className="hidden" tabIndex={-1} autoComplete="off" {...form.register("website")} />
          <div className="space-y-2 border-t pt-4">
            <label className="flex items-start gap-2 text-sm">
              <input type="checkbox" {...form.register("withdrawalDeclarationAccepted")} className="mt-1" />
              Dichiaro di voler esercitare il diritto di recesso relativo alla polizza/contratto indicato.
            </label>
            <label className="flex items-start gap-2 text-sm">
              <input type="checkbox" {...form.register("dataConfirmationAccepted")} className="mt-1" />
              Confermo che i dati inseriti sono corretti.
            </label>
            <label className="flex items-start gap-2 text-sm">
              <input type="checkbox" {...form.register("privacyAccepted")} className="mt-1" />
              Ho preso visione dell&apos;
              <a href={privacyUrl} target="_blank" rel="noopener noreferrer" className="text-teal-700 underline">
                informativa privacy
              </a>
              .
            </label>
          </div>
          <Button type="submit" variant="teal" className="w-full">Continua al riepilogo</Button>
        </form>
      </CardContent>
    </Card>
  );
}
