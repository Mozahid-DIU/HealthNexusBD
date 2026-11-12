-- Indexes for the admin console: the audit log is read newest-first, and the
-- trend charts count rows per day by these timestamps.
CREATE INDEX "audit_logs_created_at_idx" ON "audit_logs"("created_at");
CREATE INDEX "users_created_at_idx" ON "users"("created_at");
CREATE INDEX "medical_records_created_at_idx" ON "medical_records"("created_at");
CREATE INDEX "lab_reports_uploaded_at_idx" ON "lab_reports"("uploaded_at");
CREATE INDEX "access_sessions_granted_at_idx" ON "access_sessions"("granted_at");
