-- Enable Row Level Security on all public tables exposed to PostgREST (Supabase Data API).
--
-- Rationale: this application connects to Postgres exclusively via Prisma using the
-- owner role `postgres` (rolbypassrls = true), which BYPASSES RLS. It does NOT use
-- the Supabase Data API (anon/authenticated/PostgREST). Enabling RLS with NO policies
-- therefore denies all Data API access to these tables while leaving the application
-- completely unaffected. This closes the `rls_disabled_in_public` advisory and prevents
-- exposure of sensitive data (users.password_hash, customer PII, audit logs, etc.).
--
-- No policies are created on purpose: these are server-only tables. Access must go
-- through the trusted backend (Prisma/owner role). If, in the future, any table must be
-- reachable via the Data API, add explicit, scoped policies at that time.

ALTER TABLE "users" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "insurance_companies" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "withdrawal_requests" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "email_logs" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "email_templates" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "audit_logs" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "internal_notes" ENABLE ROW LEVEL SECURITY;

-- `settings` already has RLS enabled; re-asserting is a harmless no-op for parity.
ALTER TABLE "settings" ENABLE ROW LEVEL SECURITY;
