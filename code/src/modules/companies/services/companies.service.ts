import { accessibleBy } from '@casl/prisma';
import { ConflictException, Injectable, Logger, NotFoundException } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { AuthUser } from 'src/common/interfaces/auth-user.interface';
import { AbilityFactory } from 'src/modules/ability/ability.factory';
import { PrismaService } from 'src/prisma/prisma.service';
import { CreateCompanyDto } from '../dtos/create-company.dto';
import { QueryCompanyDto } from '../dtos/query-company.dto';
import { UpdateCompanyDto } from '../dtos/update-company.dto';

const COMPANY_SELECT = {
  id: true,
  name: true,
  legalName: true,
  cnpj: true,
  phone: true,
  isActive: true,
  createdAt: true,
  updatedAt: true,
} satisfies Prisma.CompanySelect;

@Injectable()
export class CompaniesService {
  private readonly logger = new Logger(CompaniesService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly abilityFactory: AbilityFactory,
  ) {}

  async create(data: CreateCompanyDto): Promise<{ id: string; message: string }> {
    await this.ensureCnpjIsAvailable(data.cnpj);

    const company = await this.prisma.company.create({
      data,
      select: { id: true },
    });

    this.logger.log(`Company ${company.id} created`);

    return { id: company.id, message: 'Empresa criada com sucesso' };
  }

  async findAll(params: QueryCompanyDto, user: AuthUser) {
    const { page, limit, orderBy, order, ...filters } = params;
    const skip = (page - 1) * limit;

    const ability = this.abilityFactory.createForUser(user);
    const where: Prisma.CompanyWhereInput = {
      AND: [accessibleBy(ability, 'read').Company, this.buildFilters(filters), { deletedAt: null }],
    };

    const [companies, total] = await Promise.all([
      this.prisma.company.findMany({
        where,
        skip,
        take: limit,
        orderBy: { [orderBy]: order },
        select: COMPANY_SELECT,
      }),
      this.prisma.company.count({ where }),
    ]);

    return {
      data: companies,
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

    const company = await this.prisma.company.findFirst({
      where: { AND: [{ id, deletedAt: null }, accessibleBy(ability, 'read').Company] },
      select: COMPANY_SELECT,
    });

    if (!company) {
      throw new NotFoundException(`Empresa com ID ${id} não encontrada`);
    }

    return company;
  }

  async update(
    id: string,
    data: UpdateCompanyDto,
    user: AuthUser,
  ): Promise<{ id: string; message: string }> {
    await this.findOne(id, user);

    if (data.cnpj) {
      await this.ensureCnpjIsAvailable(data.cnpj, id);
    }

    await this.prisma.company.update({
      where: { id },
      data,
    });

    return { id, message: 'Empresa atualizada com sucesso' };
  }

  async remove(id: string, user: AuthUser): Promise<void> {
    await this.findOne(id, user);

    await this.prisma.company.update({
      where: { id },
      data: { deletedAt: new Date() },
    });
  }

  private async ensureCnpjIsAvailable(cnpj: string, ignoreId?: string): Promise<void> {
    const existing = await this.prisma.company.findFirst({
      where: {
        cnpj,
        deletedAt: null,
        ...(ignoreId && { id: { not: ignoreId } }),
      },
      select: { id: true },
    });

    if (existing) {
      throw new ConflictException('Já existe uma empresa cadastrada com este CNPJ');
    }
  }

  private buildFilters(filters: Omit<QueryCompanyDto, 'page' | 'limit' | 'orderBy' | 'order'>) {
    const where: Prisma.CompanyWhereInput = {};

    if (filters.search) {
      where.OR = [
        { name: { contains: filters.search, mode: 'insensitive' } },
        { legalName: { contains: filters.search, mode: 'insensitive' } },
        { cnpj: { contains: filters.search.replace(/\D/g, '') || filters.search } },
      ];
    }

    if (filters.isActive !== undefined) {
      where.isActive = filters.isActive;
    }

    return where;
  }
}
