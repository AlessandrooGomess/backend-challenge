import { accessibleBy } from '@casl/prisma';
import { ConflictException, Injectable, Logger, NotFoundException } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import * as bcrypt from 'bcrypt';
import { AuthUser } from 'src/common/interfaces/auth-user.interface';
import { CompanyScopeResolver } from 'src/common/services/company-scope.resolver';
import { AbilityFactory } from 'src/modules/ability/ability.factory';
import { PrismaService } from 'src/prisma/prisma.service';
import { CreateUserDto } from '../dtos/create-user.dto';
import { QueryUserDto } from '../dtos/query-user.dto';
import { UpdateUserDto } from '../dtos/update-user.dto';

const USER_SELECT = {
  id: true,
  name: true,
  email: true,
  role: true,
  isActive: true,
  company: { select: { id: true, name: true } },
  createdAt: true,
  updatedAt: true,
} satisfies Prisma.UserSelect;

@Injectable()
export class UsersService {
  private readonly logger = new Logger(UsersService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly abilityFactory: AbilityFactory,
    private readonly companyScopeResolver: CompanyScopeResolver,
  ) {}

  async create(data: CreateUserDto, user: AuthUser): Promise<{ id: string; message: string }> {
    const companyId = await this.companyScopeResolver.resolveCompanyId(data, user);

    await this.ensureEmailIsAvailable(data.email);

    const created = await this.prisma.user.create({
      data: {
        ...data,
        companyId,
        password: await bcrypt.hash(data.password, 10),
      },
      select: { id: true },
    });

    this.logger.log(`User ${created.id} created in company ${companyId}`);

    return { id: created.id, message: 'Usuário criado com sucesso' };
  }

  async findAll(params: QueryUserDto, user: AuthUser) {
    const { page, limit, orderBy, order, ...filters } = params;
    const skip = (page - 1) * limit;

    const ability = this.abilityFactory.createForUser(user);
    const where: Prisma.UserWhereInput = {
      AND: [accessibleBy(ability, 'read').User, this.buildFilters(filters), { deletedAt: null }],
    };

    const [users, total] = await Promise.all([
      this.prisma.user.findMany({
        where,
        skip,
        take: limit,
        orderBy: { [orderBy]: order },
        select: USER_SELECT,
      }),
      this.prisma.user.count({ where }),
    ]);

    return {
      data: users,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async findOne(id: string, user: AuthUser) {
    const ability = this.abilityFactory.createForUser(user);

    const found = await this.prisma.user.findFirst({
      where: { AND: [{ id, deletedAt: null }, accessibleBy(ability, 'read').User] },
      select: USER_SELECT,
    });

    if (!found) {
      throw new NotFoundException(`Usuário com ID ${id} não encontrado`);
    }

    return found;
  }

  async update(
    id: string,
    data: UpdateUserDto,
    user: AuthUser,
  ): Promise<{ id: string; message: string }> {
    await this.findOne(id, user);

    if (data.email) {
      await this.ensureEmailIsAvailable(data.email, id);
    }

    await this.prisma.user.update({
      where: { id },
      data,
    });

    return { id, message: 'Usuário atualizado com sucesso' };
  }

  async remove(id: string, user: AuthUser): Promise<void> {
    await this.findOne(id, user);

    await this.prisma.user.update({
      where: { id },
      data: { deletedAt: new Date() },
    });
  }

  private async ensureEmailIsAvailable(email: string, ignoreId?: string): Promise<void> {
    const existing = await this.prisma.user.findFirst({
      where: {
        email,
        deletedAt: null,
        ...(ignoreId && { id: { not: ignoreId } }),
      },
      select: { id: true },
    });

    if (existing) {
      throw new ConflictException('Já existe um usuário cadastrado com este e-mail');
    }
  }

  private buildFilters(filters: Omit<QueryUserDto, 'page' | 'limit' | 'orderBy' | 'order'>) {
    const where: Prisma.UserWhereInput = {};

    if (filters.search) {
      where.OR = [
        { name: { contains: filters.search, mode: 'insensitive' } },
        { email: { contains: filters.search, mode: 'insensitive' } },
      ];
    }

    if (filters.role) {
      where.role = filters.role;
    }

    if (filters.isActive !== undefined) {
      where.isActive = filters.isActive;
    }

    if (filters.companyId) {
      where.companyId = filters.companyId;
    }

    return where;
  }
}
