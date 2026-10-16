-- CapacitaGov security hardening: restrict direct access to issued certificates.
-- Reviewed against 20261007_init.sql. Apply ONLY to a dedicated development
-- database first; live tenant/user authorization tests are mandatory.
--
-- Prior behavior: "Public certificate verification" FOR SELECT USING (true)
-- exposed the complete certificates table to roles with SELECT privilege.
-- Public verification must use a narrow, rate-limited server endpoint returning
-- an explicitly approved subset of fields, not direct table SELECT.
--
-- Rollback (ONLY after security review; restores the original vulnerability):
-- DROP POLICY IF EXISTS "Certificate owner or superadmin select" ON public.certificates;
-- CREATE POLICY "Public certificate verification" ON public.certificates FOR SELECT USING (true);
-- GRANT SELECT ON public.certificates TO anon;

BEGIN;

ALTER TABLE public.certificates ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Public certificate verification" ON public.certificates;
DROP POLICY IF EXISTS "Certificate owner or superadmin select" ON public.certificates;

-- Do not permit unauthenticated API clients to select certificate rows.
REVOKE SELECT ON TABLE public.certificates FROM anon;

-- A verified Supabase Auth user may see only their own issued certificates.
-- Global superadmins retain access subject to is_superadmin() accuracy.
CREATE POLICY "Certificate owner or superadmin select"
ON public.certificates
FOR SELECT
TO authenticated
USING (
  user_id = (select auth.uid())
  OR public.is_superadmin()
);

COMMIT;
