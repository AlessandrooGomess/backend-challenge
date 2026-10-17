import { createZodDto } from 'nestjs-zod';
import { orderByField, paginationQuerySchema } from 'src/common/dtos/pagination-query.schema';

export const queryRefuelingSchema = paginationQuerySchema.extend({
  orderBy: orderByField(['date', 'odometer', 'liters', 'totalValue', 'createdAt']),
});

export class QueryRefuelingDto extends createZodDto(queryRefuelingSchema) {}
