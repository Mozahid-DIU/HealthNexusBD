-- Make audit_logs append-only at the database level (SRS: "immutable audit log").
--
-- UPDATE, DELETE and TRUNCATE are rejected by triggers, so neither an application
-- bug nor a stray query can rewrite history. Rows can still be INSERTed.
--
-- Escape hatch for dev/test tooling only (seed refresh, check scripts): a
-- transaction that runs  SELECT set_config('app.audit_purge', 'on', true)  may
-- delete rows. The application itself never sets it (see prisma/audit-purge.ts).
-- Note: deleting a patient that has audit history is blocked too, because the
-- patient_id FK's ON DELETE SET NULL is an UPDATE on audit_logs.

CREATE OR REPLACE FUNCTION audit_logs_block_mutation() RETURNS trigger
LANGUAGE plpgsql AS $$
BEGIN
  IF current_setting('app.audit_purge', true) = 'on' THEN
    IF TG_OP = 'UPDATE' THEN
      RETURN NEW;
    END IF;
    RETURN OLD;
  END IF;
  RAISE EXCEPTION 'audit_logs is append-only: % is not allowed', TG_OP
    USING ERRCODE = 'insufficient_privilege';
END;
$$;

CREATE TRIGGER audit_logs_no_update_delete
  BEFORE UPDATE OR DELETE ON "audit_logs"
  FOR EACH ROW EXECUTE FUNCTION audit_logs_block_mutation();

CREATE TRIGGER audit_logs_no_truncate
  BEFORE TRUNCATE ON "audit_logs"
  FOR EACH STATEMENT EXECUTE FUNCTION audit_logs_block_mutation();
