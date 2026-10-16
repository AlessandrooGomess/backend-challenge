import { createZodDto } from 'nestjs-zod';
import { z } from 'zod';
import { VehicleType } from '../enums/vehicle-type.enum';

const normalizePlate = (value: string) => value.trim().toUpperCase().replace(/-/g, '');
const PLATE_REGEX = /^[A-Z]{3}\d[A-Z\d]\d{2}$/;

export const createVehicleSchema = z.object({
  plate: z
    .string({ required_error: 'Placa é obrigatória' })
    .transform(normalizePlate)
    .pipe(
      z.string().regex(PLATE_REGEX, {
        message: 'Placa inválida. Use o formato antigo (ABC1234) ou Mercosul (ABC1D23)',
      }),
    ),
  brand: z
    .string({ required_error: 'Marca é obrigatória' })
    .trim()
    .min(2, { message: 'Marca deve ter pelo menos 2 caracteres' })
    .max(50, { message: 'Marca deve ter no máximo 50 caracteres' }),
  model: z
    .string({ required_error: 'Modelo é obrigatório' })
    .trim()
    .min(2, { message: 'Modelo deve ter pelo menos 2 caracteres' })
    .max(50, { message: 'Modelo deve ter no máximo 50 caracteres' }),
  year: z
    .number({
      required_error: 'Ano é obrigatório',
      invalid_type_error: 'Ano deve ser um número',
    })
    .int({ message: 'Ano deve ser um número inteiro' })
    .min(1950, { message: 'Ano deve ser no mínimo 1950' })
    .refine(year => year <= new Date().getFullYear() + 1, {
      message: 'Ano não pode ser maior que o próximo ano',
    }),
  vehicleType: z.nativeEnum(VehicleType, {
    errorMap: () => ({
      message: `Tipo de veículo deve ser um de: ${Object.values(VehicleType).join(', ')}`,
    }),
  }),
  isActive: z.boolean({ invalid_type_error: 'isActive deve ser booleano' }).default(true),
  description: z
    .string()
    .trim()
    .max(255, { message: 'Descrição deve ter no máximo 255 caracteres' })
    .nullable()
    .optional(),
  companyId: z.string().optional(),
});
export class CreateVehicleDto extends createZodDto(createVehicleSchema) {}
