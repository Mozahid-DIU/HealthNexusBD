/*
  Warnings:

  - Added the required column `doctor_id` to the `otp_tokens` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "otp_tokens" ADD COLUMN     "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "doctor_id" UUID NOT NULL,
ADD COLUMN     "reason" TEXT;

-- CreateIndex
CREATE INDEX "otp_tokens_doctor_id_patient_id_is_used_idx" ON "otp_tokens"("doctor_id", "patient_id", "is_used");

-- AddForeignKey
ALTER TABLE "otp_tokens" ADD CONSTRAINT "otp_tokens_doctor_id_fkey" FOREIGN KEY ("doctor_id") REFERENCES "doctors"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
