import { prisma } from "@/lib/prisma";
import { CompaniesManager, type CompanyRow } from "./companies-manager";

export default async function InsuranceCompaniesPage() {
  const companies = await prisma.insuranceCompany.findMany({ orderBy: { displayName: "asc" } });

  const rows: CompanyRow[] = companies.map((c) => ({
    id: c.id,
    displayName: c.displayName,
    legalName: c.legalName,
    internalCode: c.internalCode,
    withdrawalEmail: c.withdrawalEmail,
    secondaryEmails: c.secondaryEmails,
    notes: c.notes,
    isActive: c.isActive,
  }));

  return <CompaniesManager companies={rows} />;
}
