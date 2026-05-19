"use client";

import { useEffect, useRef, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { withdrawalRequestSchema, type WithdrawalRequestInput } from "@/lib/validations/withdrawal";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { FormField } from "@/components/ui/form-field";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { StepIndicator } from "@/components/recesso/step-indicator";
import { formatDateTimeRome } from "@/lib/datetime";

type Company = { id: string; displayName: string };

type Step = "landing" | "form" | "review" | "success" | "error";

function fieldError(
  errors: ReturnType<typeof useForm<WithdrawalRequestInput>>["formState"]["errors"],
  name: keyof WithdrawalRequestInput,
) {
  const message = errors[name]?.message;
  return typeof message === "string" ? message : undefined;
}

export function RecessoFlow({ privacyUrl }: { privacyUrl: string }) {
  const [step, setStep] = useState<Step>("landing");
  const [companies, setCompanies] = useState<Company[]>([]);
  const [submitError, setSubmitError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [result, setResult] = useState<{
    publicId: string;
    submittedAt: string;
    emailWarning?: boolean;
    message?: string;
  } | null>(null);

  const titleRef = useRef<HTMLHeadingElement>(null);
  const statusRef = useRef<HTMLDivElement>(null);

  const form = useForm<WithdrawalRequestInput>({
    resolver: zodResolver(withdrawalRequestSchema),
    defaultValues: {
      privacyAccepted: false,
      withdrawalDeclarationAccepted: false,
      dataConfirmationAccepted: false,
      website: "",
    },
  });

  const { errors } = form.formState;

  useEffect(() => {
    fetch("/api/public/insurance-companies")
      .then((r) => r.json())
      .then(setCompanies)
      .catch(() => setCompanies([]));
  }, []);

  useEffect(() => {
    if (step === "success" || step === "error") {
      statusRef.current?.focus();
      return;
    }
    titleRef.current?.focus();
  }, [step]);

  async function onConfirm() {
    const data = form.getValues();
    setSubmitError("");
    setSubmitting(true);
    try {
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
    } finally {
      setSubmitting(false);
    }
  }

  const values = form.watch();

  if (step === "landing") {
    return (
      <>
        <StepIndicator current={step} />
        <Card className="mx-auto max-w-2xl" aria-labelledby="recesso-landing-title">
          <CardHeader>
            <CardTitle id="recesso-landing-title" ref={titleRef} tabIndex={-1} className="text-2xl">
              Esercita il diritto di recesso
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4 text-[var(--gray-700)]">
            <p>
              Puoi inviare online la richiesta di recesso relativa a una polizza assicurativa acquistata tramite
              canale digitale. La richiesta sarà trasmessa alla compagnia selezionata e al broker.
            </p>
            <p className="text-sm">
              Ti serviranno: nome, cognome, codice fiscale, email, numero polizza e compagnia assicurativa.
            </p>
            <Button variant="teal" size="lg" onClick={() => setStep("form")}>
              Inizia la richiesta di recesso
            </Button>
          </CardContent>
        </Card>
      </>
    );
  }

  if (step === "success" && result) {
    return (
      <>
        <StepIndicator current={step} />
        <Card className="mx-auto max-w-2xl border-[var(--primary-200)]" aria-labelledby="recesso-success-title">
          <CardHeader>
            <CardTitle id="recesso-success-title" ref={titleRef} tabIndex={-1} className="text-[var(--primary-900)]">
              Richiesta di recesso inviata correttamente
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div
              ref={statusRef}
              tabIndex={-1}
              role="status"
              aria-live="polite"
              className="space-y-4 outline-none"
            >
              <p>
                Abbiamo ricevuto la tua richiesta. È stata trasmessa alla compagnia assicurativa e al broker in data{" "}
                <strong>{formatDateTimeRome(new Date(result.submittedAt))}</strong>.
              </p>
              <p>
                <strong>ID richiesta:</strong> {result.publicId}
              </p>
              <p className="text-sm text-slate-700">
                Riceverai un&apos;email di conferma all&apos;indirizzo indicato.
              </p>
            </div>
            <Button variant="secondary" onClick={() => (window.location.href = "/")}>
              Torna alla homepage
            </Button>
          </CardContent>
        </Card>
      </>
    );
  }

  if (step === "error") {
    return (
      <>
        <StepIndicator current={step} />
        <Card className="mx-auto max-w-2xl border-[var(--warning-500)]" aria-labelledby="recesso-error-title">
          <CardHeader>
            <CardTitle id="recesso-error-title" ref={titleRef} tabIndex={-1} className="text-[var(--primary-900)]">
              Attenzione
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div ref={statusRef} tabIndex={-1} role="alert" className="space-y-4 outline-none">
              <p>{result?.message ?? submitError ?? "Si è verificato un problema."}</p>
              {result?.publicId && (
                <p>
                  <strong>ID richiesta:</strong> {result.publicId}
                </p>
              )}
            </div>
            <div className="flex flex-wrap gap-3">
              <Button variant="secondary" onClick={() => setStep("form")}>
                Modifica dati
              </Button>
              {result?.publicId && (
                <Button onClick={() => (window.location.href = "/")}>Torna alla homepage</Button>
              )}
            </div>
          </CardContent>
        </Card>
      </>
    );
  }

  if (step === "review") {
    const company = companies.find((c) => c.id === values.insuranceCompanyId);
    return (
      <>
        <StepIndicator current={step} />
        <Card className="mx-auto max-w-2xl" aria-labelledby="recesso-review-title">
          <CardHeader>
            <CardTitle id="recesso-review-title" ref={titleRef} tabIndex={-1}>
              Riepilogo richiesta
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm text-slate-900">
            <dl className="grid gap-2 sm:grid-cols-2">
              <div>
                <dt className="font-semibold">Cliente</dt>
                <dd>
                  {values.customerFirstName} {values.customerLastName}
                </dd>
              </div>
              <div>
                <dt className="font-semibold">Codice fiscale</dt>
                <dd>{values.customerFiscalCode}</dd>
              </div>
              <div>
                <dt className="font-semibold">Email</dt>
                <dd>{values.customerEmail}</dd>
              </div>
              <div>
                <dt className="font-semibold">Polizza</dt>
                <dd>{values.policyNumber}</dd>
              </div>
              <div className="sm:col-span-2">
                <dt className="font-semibold">Compagnia</dt>
                <dd>{company?.displayName}</dd>
              </div>
              {values.policyIssueDate && (
                <div>
                  <dt className="font-semibold">Data emissione</dt>
                  <dd>{values.policyIssueDate}</dd>
                </div>
              )}
              {values.customerNotes && (
                <div className="sm:col-span-2">
                  <dt className="font-semibold">Note</dt>
                  <dd>{values.customerNotes}</dd>
                </div>
              )}
            </dl>
            <p className="text-slate-700">Dichiari di voler esercitare il diritto di recesso sui dati indicati.</p>
            <div className="flex flex-wrap gap-3 pt-4">
              <Button variant="secondary" type="button" onClick={() => setStep("form")}>
                Modifica dati
              </Button>
              <Button variant="teal" type="button" onClick={onConfirm} disabled={submitting} aria-busy={submitting}>
                {submitting ? "Invio in corso…" : "Conferma e invia richiesta di recesso"}
              </Button>
            </div>
          </CardContent>
        </Card>
      </>
    );
  }

  return (
    <>
      <StepIndicator current={step} />
      <Card className="mx-auto max-w-2xl" aria-labelledby="recesso-form-title">
        <CardHeader>
          <CardTitle id="recesso-form-title" ref={titleRef} tabIndex={-1}>
            Richiesta di recesso
          </CardTitle>
        </CardHeader>
        <CardContent>
          <form className="space-y-4" onSubmit={form.handleSubmit(() => setStep("review"))} noValidate>
            <div className="grid gap-4 sm:grid-cols-2">
              <FormField
                id="customerFirstName"
                label="Nome"
                required
                error={fieldError(errors, "customerFirstName")}
              >
                <Input autoComplete="given-name" {...form.register("customerFirstName")} />
              </FormField>
              <FormField
                id="customerLastName"
                label="Cognome"
                required
                error={fieldError(errors, "customerLastName")}
              >
                <Input autoComplete="family-name" {...form.register("customerLastName")} />
              </FormField>
            </div>

            <FormField
              id="customerFiscalCode"
              label="Codice fiscale"
              required
              hint="16 caratteri alfanumerici"
              error={fieldError(errors, "customerFiscalCode")}
            >
              <Input autoComplete="off" className="uppercase" {...form.register("customerFiscalCode")} />
            </FormField>

            <div className="grid gap-4 sm:grid-cols-2">
              <FormField id="customerEmail" label="Email" required error={fieldError(errors, "customerEmail")}>
                <Input type="email" autoComplete="email" {...form.register("customerEmail")} />
              </FormField>
              <FormField
                id="customerEmailConfirm"
                label="Conferma email"
                required
                error={fieldError(errors, "customerEmailConfirm")}
              >
                <Input type="email" autoComplete="email" {...form.register("customerEmailConfirm")} />
              </FormField>
            </div>

            <FormField id="customerPhone" label="Telefono" error={fieldError(errors, "customerPhone")}>
              <Input type="tel" autoComplete="tel" {...form.register("customerPhone")} />
            </FormField>

            <FormField
              id="policyNumber"
              label="Numero polizza / contratto"
              required
              error={fieldError(errors, "policyNumber")}
            >
              <Input {...form.register("policyNumber")} />
            </FormField>

            <FormField
              id="insuranceCompanyId"
              label="Compagnia assicurativa"
              required
              error={fieldError(errors, "insuranceCompanyId")}
            >
              <Select {...form.register("insuranceCompanyId")}>
                <option value="">Seleziona una compagnia</option>
                {companies.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.displayName}
                  </option>
                ))}
              </Select>
            </FormField>

            <FormField id="policyIssueDate" label="Data emissione / decorrenza" error={fieldError(errors, "policyIssueDate")}>
              <Input type="date" {...form.register("policyIssueDate")} />
            </FormField>

            <FormField id="productType" label="Prodotto / tipo polizza" error={fieldError(errors, "productType")}>
              <Input {...form.register("productType")} />
            </FormField>

            <FormField id="customerNotes" label="Note" error={fieldError(errors, "customerNotes")}>
              <Textarea {...form.register("customerNotes")} />
            </FormField>

            <input
              type="text"
              className="sr-only"
              tabIndex={-1}
              autoComplete="off"
              aria-hidden="true"
              {...form.register("website")}
            />

            <fieldset className="space-y-3 border-t border-slate-200 pt-4">
              <legend className="text-sm font-semibold text-slate-900">Dichiarazioni obbligatorie</legend>

              <div className="space-y-1">
                <label className="flex items-start gap-3 text-sm text-slate-900">
                  <input
                    type="checkbox"
                    id="withdrawalDeclarationAccepted"
                    className="mt-1 size-4 shrink-0 accent-[var(--primary)]"
                    {...form.register("withdrawalDeclarationAccepted")}
                  />
                  <span>
                    Dichiaro di voler esercitare il diritto di recesso relativo alla polizza o al contratto indicato.
                  </span>
                </label>
                {fieldError(errors, "withdrawalDeclarationAccepted") && (
                  <p id="withdrawalDeclarationAccepted-error" role="alert" className="text-sm font-medium text-red-800">
                    {fieldError(errors, "withdrawalDeclarationAccepted")}
                  </p>
                )}
              </div>

              <div className="space-y-1">
                <label className="flex items-start gap-3 text-sm text-slate-900">
                  <input
                    type="checkbox"
                    id="dataConfirmationAccepted"
                    className="mt-1 size-4 shrink-0 accent-[var(--primary)]"
                    {...form.register("dataConfirmationAccepted")}
                  />
                  <span>Confermo che i dati inseriti sono corretti.</span>
                </label>
                {fieldError(errors, "dataConfirmationAccepted") && (
                  <p id="dataConfirmationAccepted-error" role="alert" className="text-sm font-medium text-red-800">
                    {fieldError(errors, "dataConfirmationAccepted")}
                  </p>
                )}
              </div>

              <div className="space-y-1">
                <label className="flex items-start gap-3 text-sm text-slate-900">
                  <input
                    type="checkbox"
                    id="privacyAccepted"
                    className="mt-1 size-4 shrink-0 accent-[var(--primary)]"
                    {...form.register("privacyAccepted")}
                  />
                  <span>
                    Ho preso visione dell&apos;
                    <a
                      href={privacyUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="link-external font-semibold text-[var(--primary-700)] underline underline-offset-2"
                    >
                      informativa privacy
                    </a>
                    .
                  </span>
                </label>
                {fieldError(errors, "privacyAccepted") && (
                  <p id="privacyAccepted-error" role="alert" className="text-sm font-medium text-red-800">
                    {fieldError(errors, "privacyAccepted")}
                  </p>
                )}
              </div>
            </fieldset>

            <Button type="submit" variant="teal" className="w-full">
              Continua al riepilogo
            </Button>
          </form>
        </CardContent>
      </Card>
    </>
  );
}
