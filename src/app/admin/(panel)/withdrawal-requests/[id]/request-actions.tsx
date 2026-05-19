"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export function RequestActions({ requestId }: { requestId: string }) {
  const router = useRouter();
  const [note, setNote] = useState("");
  const [loading, setLoading] = useState(false);

  async function action(path: string, body?: object) {
    setLoading(true);
    await fetch(`/api/admin/withdrawal-requests/${requestId}/${path}`, {
      method: "POST",
      headers: body ? { "Content-Type": "application/json" } : undefined,
      body: body ? JSON.stringify(body) : undefined,
    });
    setLoading(false);
    router.refresh();
  }

  return (
    <div className="space-y-4 rounded-xl border border-slate-200 bg-white p-4">
      <h3 className="font-semibold">Azioni</h3>
      <div className="flex flex-wrap gap-2">
        <Button size="sm" disabled={loading} onClick={() => action("resend-company-email")}>
          Reinvia email compagnia
        </Button>
        <Button size="sm" disabled={loading} onClick={() => action("resend-customer-email")}>
          Reinvia email cliente
        </Button>
        <Button size="sm" variant="secondary" disabled={loading} onClick={() => action("mark-manually-resolved")}>
          Segna gestita manualmente
        </Button>
      </div>
      <div className="flex gap-2">
        <Input placeholder="Nota interna" value={note} onChange={(e) => setNote(e.target.value)} />
        <Button size="sm" disabled={loading || !note.trim()} onClick={() => action("notes", { note })}>
          Aggiungi nota
        </Button>
      </div>
    </div>
  );
}
