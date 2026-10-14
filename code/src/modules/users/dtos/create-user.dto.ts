import { createZodDto } from 'nestjs-zod';
import { z } from 'zod';
import { Role } from 'src/common/enums/role.enum';

const assignableRoles = [Role.MANAGER, Role.VIEWER] as const;

export const createUserSchema = z.object({
  name: z
    .string({ required_error: 'Nome é obrigatório' })
    .trim()
    .min(3, { message: 'Nome deve ter pelo menos 3 caracteres' })
    .max(100, { message: 'Nome deve ter no máximo 100 caracteres' }),
  email: z
    .string({ required_error: 'E-mail é obrigatório' })
    .trim()
    .toLowerCase()
    .email({ message: 'E-mail inválido' })
    .max(255, { message: 'E-mail deve ter no máximo 255 caracteres' }),
  password: z
    .string({ required_error: 'Senha é obrigatória' })
    .min(8, { message: 'Senha deve ter pelo menos 8 caracteres' })
    .max(72, { message: 'Senha deve ter no máximo 72 caracteres' })
    .regex(/[A-Za-z]/, { message: 'Senha deve conter ao menos uma letra' })
    .regex(/\d/, { message: 'Senha deve conter ao menos um número' }),
  role: z.enum(assignableRoles, {
    errorMap: () => ({ message: `Perfil deve ser um de: ${assignableRoles.join(', ')}` }),
  }),
  isActive: z.boolean({ invalid_type_error: 'isActive deve ser booleano' }).default(true),
  companyId: z.string().optional(),
});

export class CreateUserDto extends createZodDto(createUserSchema) {}
