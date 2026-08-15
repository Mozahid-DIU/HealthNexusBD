-- CreateTable
CREATE TABLE "doctor_registry" (
    "id" UUID NOT NULL,
    "bmdc_number" TEXT NOT NULL,
    "full_name" TEXT NOT NULL,
    "specialization" TEXT,
    "is_claimed" BOOLEAN NOT NULL DEFAULT false,
    "claimed_by_user_id" UUID,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "doctor_registry_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "lab_registry" (
    "id" UUID NOT NULL,
    "license_number" TEXT NOT NULL,
    "center_name" TEXT NOT NULL,
    "address" TEXT,
    "is_claimed" BOOLEAN NOT NULL DEFAULT false,
    "claimed_by_user_id" UUID,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "lab_registry_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "doctor_registry_bmdc_number_key" ON "doctor_registry"("bmdc_number");

-- CreateIndex
CREATE UNIQUE INDEX "lab_registry_license_number_key" ON "lab_registry"("license_number");
