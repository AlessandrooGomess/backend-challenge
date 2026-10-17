-- CreateTable
CREATE TABLE "refueling" (
    "id" TEXT NOT NULL,
    "vehicle_id" TEXT NOT NULL,
    "date" TIMESTAMP(3) NOT NULL,
    "liters" DOUBLE PRECISION NOT NULL,
    "total_value" DOUBLE PRECISION NOT NULL,
    "odometer" INTEGER NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "refueling_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "refueling_vehicle_id_idx" ON "refueling"("vehicle_id");

-- CreateIndex
CREATE INDEX "refueling_vehicle_id_date_idx" ON "refueling"("vehicle_id", "date");

-- AddForeignKey
ALTER TABLE "refueling" ADD CONSTRAINT "refueling_vehicle_id_fkey" FOREIGN KEY ("vehicle_id") REFERENCES "vehicle"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
