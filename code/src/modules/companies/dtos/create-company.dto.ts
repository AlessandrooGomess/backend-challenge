import { createZodDto } from 'nestjs-zod';
import { z } from 'zod';

const onlyDigits = (value: string) => value.replace(/\D/g, '');

export const createCompanySchema = z.object({
  name: z
    .string({ required_error: 'Nome fantasia é obrigatório' })
    .trim()
    .min(3, { message: 'Nome fantasia deve ter pelo menos 3 caracteres' })
    .max(150, { message: 'Nome fantasia deve ter no máximo 150 caracteres' }),
  legalName: z
    .string({ required_error: 'Razão social é obrigatória' })
    .trim()
    .min(3, { message: 'Razão social deve ter pelo menos 3 caracteres' })
    .max(200, { message: 'Razão social deve ter no máximo 200 caracteres' }),
  cnpj: z
    .string({ required_error: 'CNPJ é obrigatório' })
    .transform(onlyDigits)
    .pipe(z.string().length(14, { message: 'O CNPJ deve ter 14 dígitos' })),
  phone: z
    .string()
    .transform(onlyDigits)
    .pipe(
      z
        .string()
        .min(10, { message: 'Telefone deve ter pelo menos 10 dígitos' })
        .max(20, { message: 'Telefone deve ter no máximo 20 dígitos' }),
    )
    .nullable()
    .optional(),
  isActive: z.boolean({ invalid_type_error: 'isActive deve ser booleano' }).default(true),
});

export class CreateCompanyDto extends createZodDto(createCompanySchema) {}
