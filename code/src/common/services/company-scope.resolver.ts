import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Role } from '../enums/role.enum';
import { AuthUser } from '../interfaces/auth-user.interface';
import { PrismaService } from 'src/prisma/prisma.service';

@Injectable()
export class CompanyScopeResolver {
  constructor(private readonly prisma: PrismaService) {}

  async resolveCompanyId(data: { companyId?: string }, user: AuthUser): Promise<string> {
    if (user.role === Role.ADMIN) {
      if (!data.companyId) {
        throw new BadRequestException('O campo companyId é obrigatório para administradores');
      }

      const company = await this.prisma.company.findFirst({
        where: { id: data.companyId, deletedAt: null },
        select: { id: true },
      });
      if (!company) {
        throw new NotFoundException(`Empresa com ID ${data.companyId} não encontrada`);
      }

      return company.id;
    }

    if (!user.companyId) {
      throw new BadRequestException('O usuário não está vinculado a nenhuma empresa');
    }

    if (data.companyId && data.companyId !== user.companyId) {
      throw new ForbiddenException(
        'Você não tem permissão para criar registros para outra empresa',
      );
    }

    return user.companyId;
  }
}
