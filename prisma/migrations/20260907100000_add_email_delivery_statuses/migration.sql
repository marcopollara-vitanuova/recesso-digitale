-- Stati di consegna riportati dai webhook Resend.
-- Additivo: nessun valore esistente viene rinominato o rimosso.
ALTER TYPE "EmailStatus" ADD VALUE IF NOT EXISTS 'DELIVERED';
ALTER TYPE "EmailStatus" ADD VALUE IF NOT EXISTS 'BOUNCED';
ALTER TYPE "EmailStatus" ADD VALUE IF NOT EXISTS 'COMPLAINED';
ALTER TYPE "EmailStatus" ADD VALUE IF NOT EXISTS 'SUPPRESSED';
