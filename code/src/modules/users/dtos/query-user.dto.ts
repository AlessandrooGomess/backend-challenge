import { createZodDto } from 'nestjs-zod';
import { z } from 'zod';
import { Role } from 'src/common/enums/role.enum';
import {
  booleanQueryParam,
  orderByField,
  paginationQuerySchema,
} from 'src/common/dtos/pagination-query.schema';

export const queryUserSchema = paginationQuerySchema.extend({
  search: z.string().trim().optional(),
  role: z
    .nativeEnum(Role, {
      errorMap: () => ({ message: `role deve ser um de: ${Object.values(Role).join(', ')}` }),
    })
    .optional(),
  isActive: booleanQueryParam('isActive'),
  companyId: z.string().optional(),
  orderBy: orderByField(['name', 'email', 'role', 'createdAt']),
});

export class QueryUserDto extends createZodDto(queryUserSchema) {}
