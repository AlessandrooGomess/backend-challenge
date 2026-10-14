import { createZodDto } from 'nestjs-zod';
import { z } from 'zod';
import {
  booleanQueryParam,
  orderByField,
  paginationQuerySchema,
} from 'src/common/dtos/pagination-query.schema';

export const queryCompanySchema = paginationQuerySchema.extend({
  search: z.string().trim().optional(),
  isActive: booleanQueryParam('isActive'),
  orderBy: orderByField(['name', 'legalName', 'cnpj', 'createdAt']),
});

export class QueryCompanyDto extends createZodDto(queryCompanySchema) {}
