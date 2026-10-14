import { createZodDto } from 'nestjs-zod';
import { createCompanySchema } from './create-company.dto';

export const updateCompanySchema = createCompanySchema.partial();

export class UpdateCompanyDto extends createZodDto(updateCompanySchema) {}
