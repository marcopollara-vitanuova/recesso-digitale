import { prisma } from "@/lib/prisma";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default async function InsuranceCompaniesPage() {
  const companies = await prisma.insuranceCompany.findMany({ orderBy: { displayName: "asc" } });

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Compagnie assicurative</h1>
      <Card>
        <CardHeader>
          <CardTitle>Elenco ({companies.length})</CardTitle>
        </CardHeader>
        <CardContent className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b text-left text-slate-500">
                <th className="pb-2 pr-4">Nome</th>
                <th className="pb-2 pr-4">Codice</th>
                <th className="pb-2 pr-4">Email recesso</th>
                <th className="pb-2">Attiva</th>
              </tr>
            </thead>
            <tbody>
              {companies.map((c) => (
                <tr key={c.id} className="border-b border-slate-100">
                  <td className="py-2 pr-4 font-medium">{c.displayName}</td>
                  <td className="py-2 pr-4">{c.internalCode ?? "—"}</td>
                  <td className="py-2 pr-4">{c.withdrawalEmail}</td>
                  <td className="py-2">{c.isActive ? "Sì" : "No"}</td>
                </tr>
              ))}
            </tbody>
          </table>
          <p className="mt-4 text-xs text-slate-500">CRUD completo via API admin; UI avanzata in iterazione successiva.</p>
        </CardContent>
      </Card>
    </div>
  );
}
