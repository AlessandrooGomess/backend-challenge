import { createZodDto } from 'nestjs-zod';
import { z } from 'zod';
import {
  booleanQueryParam,
  orderByField,
  paginationQuerySchema,
} from 'src/common/dtos/pagination-query.schema';
import { VehicleType } from '../enums/vehicle-type.enum';

const vehicleTypeEnum = z.nativeEnum(VehicleType, {
  errorMap: () => ({
    message: `vehicleType deve ser um de: ${Object.values(VehicleType).join(', ')}`,
  }),
});

export const queryVehicleSchema = paginationQuerySchema.extend({
  search: z.string().trim().optional(),
  vehicleType: z.preprocess(
    val => (typeof val === 'string' ? [val] : val),
    z.array(vehicleTypeEnum).optional(),
  ),
  isActive: booleanQueryParam('isActive'),
  companyId: z.string().optional(),
  orderBy: orderByField(['plate', 'year', 'brand', 'createdAt']),
});

export class QueryVehicleDto extends createZodDto(queryVehicleSchema) {}
