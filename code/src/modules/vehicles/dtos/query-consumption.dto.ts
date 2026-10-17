import { createZodDto } from 'nestjs-zod';
import { z } from 'zod';

const DATE_REGEX = /^\d{4}-\d{2}-\d{2}$/;

const dateStringField = (field: string) =>
  z
    .string({ required_error: `${field} é obrigatório` })
    .regex(DATE_REGEX, { message: `${field} deve estar no formato AAAA-MM-DD` })
    .refine(val => !Number.isNaN(Date.parse(`${val}T00:00:00.000Z`)), {
      message: `${field} não é uma data válida`,
    });

export const queryConsumptionSchema = z
  .object({
    startDate: dateStringField('startDate'),
    endDate: dateStringField('endDate'),
  })
  .refine(data => data.startDate <= data.endDate, {
    message: 'startDate não pode ser maior que endDate',
    path: ['startDate'],
  });

export class QueryConsumptionDto extends createZodDto(queryConsumptionSchema) {}
