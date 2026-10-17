import { createZodDto } from 'nestjs-zod';
import { z } from 'zod';

export const createRefuelingSchema = z.object({
  date: z.coerce.date({
    required_error: 'Data do abastecimento é obrigatória',
    invalid_type_error: 'Data do abastecimento inválida',
  }),
  liters: z
    .number({
      required_error: 'Quantidade de litros é obrigatória',
      invalid_type_error: 'Litros deve ser um número',
    })
    .positive({ message: 'Quantidade de litros deve ser maior que zero' }),
  totalValue: z
    .number({
      required_error: 'Valor total é obrigatório',
      invalid_type_error: 'Valor total deve ser um número',
    })
    .positive({ message: 'Valor total deve ser maior que zero' }),
  odometer: z
    .number({
      required_error: 'Hodômetro é obrigatório',
      invalid_type_error: 'Hodômetro deve ser um número',
    })
    .int({ message: 'Hodômetro deve ser um número inteiro' })
    .positive({ message: 'Hodômetro deve ser maior que zero' }),
});
export class CreateRefuelingDto extends createZodDto(createRefuelingSchema) {}
