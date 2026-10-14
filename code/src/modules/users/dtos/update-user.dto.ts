import { createZodDto } from 'nestjs-zod';
import { createUserSchema } from './create-user.dto';

export const updateUserSchema = createUserSchema
  .pick({ name: true, email: true, isActive: true })
  .partial();

export class UpdateUserDto extends createZodDto(updateUserSchema) {}
