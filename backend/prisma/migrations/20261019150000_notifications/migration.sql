-- FR-21: in-app notifications for patients, and an idempotency marker for
-- follow-up reminders (set once the reminder for a record has been sent).

-- CreateEnum
CREATE TYPE "NotificationType" AS ENUM ('lab_report', 'follow_up');

-- AlterTable
ALTER TABLE "medical_records" ADD COLUMN "follow_up_reminder_sent_at" TIMESTAMPTZ(6);

-- CreateTable
CREATE TABLE "notifications" (
    "id" UUID NOT NULL,
    "patient_id" UUID NOT NULL,
    "type" "NotificationType" NOT NULL,
    "title" TEXT NOT NULL,
    "body" TEXT NOT NULL,
    "read_at" TIMESTAMPTZ(6),
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "notifications_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "notifications_patient_id_created_at_idx" ON "notifications"("patient_id", "created_at");

-- AddForeignKey
ALTER TABLE "notifications" ADD CONSTRAINT "notifications_patient_id_fkey" FOREIGN KEY ("patient_id") REFERENCES "patients"("id") ON DELETE CASCADE ON UPDATE CASCADE;
