-- Patient-friendly side effects of the prescribed medicines, stored with each AI summary.
ALTER TABLE "ai_summaries" ADD COLUMN "side_effects" JSONB NOT NULL DEFAULT '[]';
