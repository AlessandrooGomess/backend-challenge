import { createZodDto } from 'nestjs-zod';
import { createVehicleSchema } from './create-vehicle.dto';

export const updateVehicleSchema = createVehicleSchema
  .omit({
    companyId: true,
  })
  .partial();

export class UpdateVehicleDto extends createZodDto(updateVehicleSchema) {}
