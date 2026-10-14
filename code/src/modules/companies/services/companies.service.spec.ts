import { ConflictException, NotFoundException } from '@nestjs/common';
import { Role } from 'src/common/enums/role.enum';
import { AuthUser } from 'src/common/interfaces/auth-user.interface';
import { CompaniesService } from './companies.service';

jest.mock('@casl/prisma', () => ({
  accessibleBy: jest.fn(() => ({ Company: {} })),
}));

describe('CompaniesService', () => {
  let service: CompaniesService;
  let prisma: {
    company: {
      create: jest.Mock;
      findFirst: jest.Mock;
      findMany: jest.Mock;
      count: jest.Mock;
      update: jest.Mock;
    };
  };
  let abilityFactory: { createForUser: jest.Mock };

  const admin: AuthUser = { id: 'user-admin', role: Role.ADMIN, companyId: null };

  const createDto = {
    name: 'Transportes Gama',
    legalName: 'Transportes Gama Ltda',
    cnpj: '12345678000190',
    isActive: true,
  };

  beforeEach(() => {
    prisma = {
      company: {
        create: jest.fn(),
        findFirst: jest.fn(),
        findMany: jest.fn(),
        count: jest.fn(),
        update: jest.fn(),
      },
    };
    abilityFactory = { createForUser: jest.fn().mockReturnValue({ can: () => true }) };

    service = new CompaniesService(prisma as any, abilityFactory);
  });

  describe('create', () => {
    it('cria a empresa e retorna id e mensagem de sucesso', async () => {
      prisma.company.findFirst.mockResolvedValue(null);
      prisma.company.create.mockResolvedValue({ id: 'company-1' });

      const result = await service.create(createDto);

      expect(result).toEqual({ id: 'company-1', message: 'Empresa criada com sucesso' });
      expect(prisma.company.create).toHaveBeenCalledWith({
        data: createDto,
        select: { id: true },
      });
    });

    it('lança ConflictException (409) quando já existe empresa não excluída com o mesmo CNPJ', async () => {
      prisma.company.findFirst.mockResolvedValue({ id: 'company-existing' });

      await expect(service.create(createDto)).rejects.toBeInstanceOf(ConflictException);
      expect(prisma.company.findFirst).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({ cnpj: createDto.cnpj, deletedAt: null }),
        }),
      );
      expect(prisma.company.create).not.toHaveBeenCalled();
    });
  });

  describe('findOne', () => {
    it('lança NotFoundException (404) quando a empresa não existe ou está fora do escopo do usuário', async () => {
      prisma.company.findFirst.mockResolvedValue(null);

      await expect(service.findOne('inexistente', admin)).rejects.toBeInstanceOf(NotFoundException);
    });
  });

  describe('findAll', () => {
    it('retorna os dados com o meta de paginação calculado', async () => {
      const companies = [{ id: 'company-1' }, { id: 'company-2' }];
      prisma.company.findMany.mockResolvedValue(companies);
      prisma.company.count.mockResolvedValue(25);

      const result = await service.findAll(
        { page: 2, limit: 10, orderBy: 'createdAt', order: 'desc' },
        admin,
      );

      expect(result).toEqual({
        data: companies,
        meta: { total: 25, page: 2, limit: 10, totalPages: 3 },
      });
      expect(prisma.company.findMany).toHaveBeenCalledWith(
        expect.objectContaining({ skip: 10, take: 10, orderBy: { createdAt: 'desc' } }),
      );
    });
  });

  describe('remove', () => {
    it('faz soft delete preenchendo deletedAt em vez de apagar o registro', async () => {
      prisma.company.findFirst.mockResolvedValue({ id: 'company-1' });

      await service.remove('company-1', admin);

      expect(prisma.company.update).toHaveBeenCalledWith({
        where: { id: 'company-1' },
        data: { deletedAt: expect.any(Date) },
      });
    });
  });
});
