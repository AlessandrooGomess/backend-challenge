-- CreateTable
CREATE TABLE "vehicle" (
    "id" TEXT NOT NULL,
    "company_id" TEXT NOT NULL,
    "plate" VARCHAR(7) NOT NULL,
    "brand" VARCHAR(50) NOT NULL,
    "model" VARCHAR(50) NOT NULL,
    "year" INTEGER NOT NULL,
    "vehicle_type" VARCHAR(20) NOT NULL,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "description" VARCHAR(255),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "deleted_at" TIMESTAMP(3),

    CONSTRAINT "vehicle_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "vehicle_company_id_idx" ON "vehicle"("company_id");

-- CreateIndex
CREATE INDEX "vehicle_company_id_plate_idx" ON "vehicle"("company_id", "plate");

-- AddForeignKey
ALTER TABLE "vehicle" ADD CONSTRAINT "vehicle_company_id_fkey" FOREIGN KEY ("company_id") REFERENCES "company"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

