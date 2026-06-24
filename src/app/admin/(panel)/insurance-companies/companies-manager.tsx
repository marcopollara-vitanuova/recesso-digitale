"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Modal } from "@/components/ui/modal";

export type CompanyRow = {
  id: string;
  displayName: string;
  legalName: string;
  internalCode: string | null;
  withdrawalEmail: string;
  secondaryEmails: unknown;
  notes: string | null;
  isActive: boolean;
};

type FormState = {
  displayName: string;
  legalName: string;
  internalCode: string;
  withdrawalEmail: string;
  secondaryEmails: string;
  notes: string;
  isActive: boolean;
};

const emptyForm: FormState = {
  displayName: "",
  legalName: "",
  internalCode: "",
  withdrawalEmail: "",
  secondaryEmails: "",
  notes: "",
  isActive: true,
};

function toSecondaryArray(raw: string): string[] {
  return raw
    .split(/[\n,;]+/)
    .map((s) => s.trim())
    .filter(Boolean);
}

function fromSecondary(value: unknown): string {
  if (Array.isArray(value)) return value.filter((v) => typeof v === "string").join(", ");
  return "";
}

export function CompaniesManager({ companies }: { companies: CompanyRow[] }) {
  const router = useRouter();
  const [modalOpen, setModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<FormState>(emptyForm);
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);
  const [busyId, setBusyId] = useState<string | null>(null);

  function openCreate() {
    setEditingId(null);
    setForm(emptyForm);
    setError("");
    setModalOpen(true);
  }

  function openEdit(c: CompanyRow) {
    setEditingId(c.id);
    setForm({
      displayName: c.displayName,
      legalName: c.legalName,
      internalCode: c.internalCode ?? "",
      withdrawalEmail: c.withdrawalEmail,
      secondaryEmails: fromSecondary(c.secondaryEmails),
      notes: c.notes ?? "",
      isActive: c.isActive,
    });
    setError("");
    setModalOpen(true);
  }

  async function save() {
    setSaving(true);
    setError("");
    const payload = {
      displayName: form.displayName.trim(),
      legalName: form.legalName.trim(),
      internalCode: form.internalCode.trim(),
      withdrawalEmail: form.withdrawalEmail.trim(),
      secondaryEmails: toSecondaryArray(form.secondaryEmails),
      notes: form.notes.trim(),
      isActive: form.isActive,
    };
    const url = editingId
      ? `/api/admin/insurance-companies/${editingId}`
      : "/api/admin/insurance-companies";
    const method = editingId ? "PUT" : "POST";

    try {
      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!res.ok) {
        const json = await res.json().catch(() => ({}));
        setError(json.error ?? "Errore durante il salvataggio");
        setSaving(false);
        return;
      }
      setModalOpen(false);
      setSaving(false);
      router.refresh();
    } catch {
      setError("Errore di rete durante il salvataggio");
      setSaving(false);
    }
  }

  async function toggleActive(c: CompanyRow) {
    const action = c.isActive ? "disabilitare" : "riattivare";
    if (!window.confirm(`Vuoi ${action} la compagnia "${c.displayName}"?`)) return;
    setBusyId(c.id);
    try {
      if (c.isActive) {
        await fetch(`/api/admin/insurance-companies/${c.id}`, { method: "DELETE" });
      } else {
        await fetch(`/api/admin/insurance-companies/${c.id}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ isActive: true }),
        });
      }
      router.refresh();
    } finally {
      setBusyId(null);
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <h1 className="text-2xl font-bold text-[var(--primary-900)]">Compagnie assicurative</h1>
        <Button onClick={openCreate}>Nuova compagnia</Button>
      </div>

      <div className="overflow-x-auto rounded-2xl border border-[var(--gray-200)] bg-white">
        <table className="w-full text-sm">
          <caption className="sr-only">Elenco compagnie assicurative ({companies.length})</caption>
          <thead className="bg-[var(--gray-50)] text-left text-[var(--gray-700)]">
            <tr>
              <th scope="col" className="p-3">Nome</th>
              <th scope="col" className="p-3">Codice</th>
              <th scope="col" className="p-3">Email recesso</th>
              <th scope="col" className="p-3">Stato</th>
              <th scope="col" className="p-3 text-right">Azioni</th>
            </tr>
          </thead>
          <tbody>
            {companies.length === 0 ? (
              <tr>
                <td colSpan={5} className="p-6 text-center text-[var(--gray-600)]">
                  Nessuna compagnia presente. Aggiungine una con &quot;Nuova compagnia&quot;.
                </td>
              </tr>
            ) : (
              companies.map((c) => (
                <tr key={c.id} className="border-t border-[var(--gray-100)]">
                  <td className="p-3 font-medium text-[var(--gray-900)]">{c.displayName}</td>
                  <td className="p-3 text-[var(--gray-700)]">{c.internalCode ?? "—"}</td>
                  <td className="p-3 text-[var(--gray-700)]">{c.withdrawalEmail}</td>
                  <td className="p-3">
                    <span
                      className={
                        c.isActive
                          ? "inline-flex rounded-full bg-[var(--success-100)] px-2.5 py-0.5 text-xs font-semibold text-[#166534]"
                          : "inline-flex rounded-full bg-[var(--gray-200)] px-2.5 py-0.5 text-xs font-semibold text-[var(--gray-700)]"
                      }
                    >
                      {c.isActive ? "Attiva" : "Disattivata"}
                    </span>
                  </td>
                  <td className="p-3">
                    <div className="flex flex-wrap justify-end gap-2">
                      <Button size="sm" variant="outline" onClick={() => openEdit(c)}>
                        Modifica
                      </Button>
                      <Button
                        size="sm"
                        variant={c.isActive ? "outline" : "secondary"}
                        disabled={busyId === c.id}
                        onClick={() => toggleActive(c)}
                      >
                        {c.isActive ? "Disabilita" : "Riattiva"}
                      </Button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      <Modal
        open={modalOpen}
        onClose={() => (saving ? null : setModalOpen(false))}
        title={editingId ? "Modifica compagnia" : "Nuova compagnia"}
        description="I campi contrassegnati con * sono obbligatori."
        footer={
          <>
            <Button variant="outline" onClick={() => setModalOpen(false)} disabled={saving}>
              Annulla
            </Button>
            <Button onClick={save} disabled={saving} aria-busy={saving}>
              {saving ? "Salvataggio…" : "Salva"}
            </Button>
          </>
        }
      >
        <form
          className="space-y-4"
          onSubmit={(e) => {
            e.preventDefault();
            save();
          }}
        >
          <div className="space-y-1.5">
            <Label htmlFor="c-displayName">Nome visualizzato *</Label>
            <Input
              id="c-displayName"
              value={form.displayName}
              onChange={(e) => setForm({ ...form, displayName: e.target.value })}
              required
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="c-legalName">Ragione sociale *</Label>
            <Input
              id="c-legalName"
              value={form.legalName}
              onChange={(e) => setForm({ ...form, legalName: e.target.value })}
              required
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="c-internalCode">Codice interno</Label>
            <Input
              id="c-internalCode"
              value={form.internalCode}
              onChange={(e) => setForm({ ...form, internalCode: e.target.value })}
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="c-withdrawalEmail">Email recesso *</Label>
            <Input
              id="c-withdrawalEmail"
              type="email"
              value={form.withdrawalEmail}
              onChange={(e) => setForm({ ...form, withdrawalEmail: e.target.value })}
              required
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="c-secondaryEmails">Email secondarie</Label>
            <Input
              id="c-secondaryEmails"
              value={form.secondaryEmails}
              onChange={(e) => setForm({ ...form, secondaryEmails: e.target.value })}
              placeholder="Separate da virgola"
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="c-notes">Note</Label>
            <Input
              id="c-notes"
              value={form.notes}
              onChange={(e) => setForm({ ...form, notes: e.target.value })}
            />
          </div>
          <label className="flex items-center gap-2 text-sm text-[var(--gray-900)]">
            <input
              type="checkbox"
              className="size-4 accent-[var(--primary-700)]"
              checked={form.isActive}
              onChange={(e) => setForm({ ...form, isActive: e.target.checked })}
            />
            Compagnia attiva (visibile nel form pubblico)
          </label>
          {error ? (
            <p role="alert" className="text-sm font-medium text-[var(--error-500)]">
              {error}
            </p>
          ) : null}
        </form>
      </Modal>
    </div>
  );
}
