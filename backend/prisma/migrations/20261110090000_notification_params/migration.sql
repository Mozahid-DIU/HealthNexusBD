-- Structured values behind each notification's text (e.g. testName, labName, date),
-- so clients can render the message in the user's language. Older rows get '{}'.
ALTER TABLE "notifications" ADD COLUMN "params" JSONB NOT NULL DEFAULT '{}';
