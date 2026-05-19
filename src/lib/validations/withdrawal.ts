import { z } from "zod";
import { isValidItalianFiscalCode } from "@/lib/fiscal-code";

export const withdrawalRequestSchema = z
  .object({
    customerFirstName: z.string().trim().min(1, "Il nome è obbligatorio"),
    customerLastName: z.string().trim().min(1, "Il cognome è obbligatorio"),
    customerFiscalCode: z
      .string()
      .trim()
      .transform((v) => v.toUpperCase())
      .refine(isValidItalianFiscalCode, "Codice fiscale non valido"),
    customerEmail: z.string().trim().email("Email non valida"),
    customerEmailConfirm: z.string().trim().email("Conferma email non valida"),
    customerPhone: z.string().trim().optional(),
    policyNumber: z.string().trim().min(1, "Il numero polizza è obbligatorio"),
    policyIssueDate: z.string().optional(),
    productType: z.string().trim().optional(),
    insuranceCompanyId: z.string().min(1, "Seleziona una compagnia"),
    customerNotes: z.string().trim().optional(),
    privacyAccepted: z.boolean().refine((v) => v === true, { message: "Obbligatorio" }),
    withdrawalDeclarationAccepted: z.boolean().refine((v) => v === true, { message: "Obbligatorio" }),
    dataConfirmationAccepted: z.boolean().refine((v) => v === true, { message: "Obbligatorio" }),
    website: z.string().optional(),
  })
  .refine((d) => d.customerEmail === d.customerEmailConfirm, {
    message: "Le email non coincidono",
    path: ["customerEmailConfirm"],
  });

export type WithdrawalRequestInput = z.infer<typeof withdrawalRequestSchema>;
