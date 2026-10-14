import { z } from 'zod';

export const paginationQuerySchema = z.object({
  page: z.coerce
    .number({ invalid_type_error: 'page deve ser um número' })
    .int({ message: 'page deve ser um número inteiro' })
    .positive({ message: 'page deve ser maior que zero' })
    .default(1),
  limit: z.coerce
    .number({ invalid_type_error: 'limit deve ser um número' })
    .int({ message: 'limit deve ser um número inteiro' })
    .positive({ message: 'limit deve ser maior que zero' })
    .max(100, { message: 'limit deve ser no máximo 100' })
    .default(10),
  order: z
    .enum(['asc', 'desc'], { errorMap: () => ({ message: "order deve ser 'asc' ou 'desc'" }) })
    .default('desc'),
});

export const orderByField = <T extends [string, ...string[]]>(fields: T) =>
  z
    .enum(fields, { errorMap: () => ({ message: `orderBy deve ser um de: ${fields.join(', ')}` }) })
    .default('createdAt' as T[number]);

export const booleanQueryParam = (field: string) =>
  z.preprocess(
    val => {
      if (val === 'true') return true;
      if (val === 'false') return false;
      return val;
    },
    z.boolean({ invalid_type_error: `${field} deve ser "true" ou "false"` }).optional(),
  );
