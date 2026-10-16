import { ConflictException, NotFoundException } from '@nestjs/common';
import { Role } from 'src/common/enums/role.enum';
import { AuthUser } from 'src/common/interfaces/auth-user.interface';
import { VehicleType } from '../enums/vehicle-type.enum';
import { VehiclesService } from './vehicles.service';

jest.mock('@casl/prisma', () => ({
  accessibleBy: jest.fn(() => ({ Vehicle: {} })),
}));

describe('VehiclesService', () => {
  let service: VehiclesService;
  let prisma: {
    vehicle: {
      create: jest.Mock;
      findFirst: jest.Mock;
      findMany: jest.Mock;
      count: jest.Mock;
      update: jest.Mock;
    };
  };
  let abilityFactory: { createForUser: jest.Mock };
  let companyScopeResolver: { resolveCompanyId: jest.Mock };

  const manager: AuthUser = { id: 'user-manager', role: Role.MANAGER, companyId: 'company-1' };

  const createDto = {
    plate: 'ABC1D23',
    brand: 'Fiat',
    model: 'Strada',
    year: 2023,
    vehicleType: VehicleType.CAR,
    isActive: true,
    description: 'Veículo de frota',
  };

  beforeEach(() => {
    prisma = {
      vehicle: {
        create: jest.fn(),
        findFirst: jest.fn(),
        findMany: jest.fn(),
        count: jest.fn(),
        update: jest.fn(),
      },
    };
    abilityFactory = { createForUser: jest.fn().mockReturnValue({ can: () => true }) };
    companyScopeResolver = { resolveCompanyId: jest.fn().mockResolvedValue('company-1') };

    service = new VehiclesService(prisma as any, abilityFactory, companyScopeResolver as any);
  });

  describe('create', () => {
    it('cria o veículo e retorna id e mensagem de sucesso', async () => {
      prisma.vehicle.findFirst.mockResolvedValue(null);
      prisma.vehicle.create.mockResolvedValue({ id: 'vehicle-1' });

      const result = await service.create(createDto, manager);

      expect(result).toEqual({ id: 'vehicle-1', message: 'Veículo criado com sucesso' });
      expect(companyScopeResolver.resolveCompanyId).toHaveBeenCalledWith(createDto, manager);
      expect(prisma.vehicle.create).toHaveBeenCalledWith({
        data: { ...createDto, companyId: 'company-1' },
        select: { id: true },
      });
    });

    it('lança ConflictException (409) quando já existe veículo não excluído com a mesma placa na empresa', async () => {
      prisma.vehicle.findFirst.mockResolvedValue({ id: 'vehicle-existing' });

      await expect(service.create(createDto, manager)).rejects.toBeInstanceOf(ConflictException);
      expect(prisma.vehicle.findFirst).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            plate: createDto.plate,
            companyId: 'company-1',
            deletedAt: null,
          }),
        }),
      );
      expect(prisma.vehicle.create).not.toHaveBeenCalled();
    });
  });

  describe('findOne', () => {
    it('lança NotFoundException (404) quando o veículo não existe ou pertence a outra empresa', async () => {
      prisma.vehicle.findFirst.mockResolvedValue(null);

      await expect(service.findOne('inexistente', manager)).rejects.toBeInstanceOf(
        NotFoundException,
      );
    });
  });

  describe('findAll', () => {
    it('retorna os dados com o meta de paginação calculado e aplica filtros', async () => {
      const vehicles = [{ id: 'vehicle-1' }, { id: 'vehicle-2' }];
      prisma.vehicle.findMany.mockResolvedValue(vehicles);
      prisma.vehicle.count.mockResolvedValue(15);

      const result = await service.findAll(
        {
          page: 2,
          limit: 10,
          orderBy: 'plate',
          order: 'asc',
          search: 'Fiat',
          vehicleType: [VehicleType.CAR],
          isActive: true,
        },
        manager,
      );

      expect(result).toEqual({
        data: vehicles,
        meta: { total: 15, page: 2, limit: 10, totalPages: 2 },
      });
      expect(prisma.vehicle.findMany).toHaveBeenCalledWith(
        expect.objectContaining({ skip: 10, take: 10, orderBy: { plate: 'asc' } }),
      );
    });
  });

  describe('update', () => {
    it('atualiza o veículo validando disponibilidade da nova placa na mesma empresa', async () => {
      prisma.vehicle.findFirst
        .mockResolvedValueOnce({ id: 'vehicle-1', company: { id: 'company-1', name: 'Alfa' } })
        .mockResolvedValueOnce(null);
      prisma.vehicle.update.mockResolvedValue({ id: 'vehicle-1' });

      const result = await service.update('vehicle-1', { plate: 'NEW1A23' }, manager);

      expect(result).toEqual({ id: 'vehicle-1', message: 'Veículo atualizado com sucesso' });
      expect(prisma.vehicle.findFirst).toHaveBeenLastCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            plate: 'NEW1A23',
            companyId: 'company-1',
            deletedAt: null,
            id: { not: 'vehicle-1' },
          }),
        }),
      );
    });
  });

  describe('remove', () => {
    it('faz soft delete preenchendo deletedAt em vez de apagar o registro', async () => {
      prisma.vehicle.findFirst.mockResolvedValue({
        id: 'vehicle-1',
        company: { id: 'company-1', name: 'Alfa' },
      });

      await service.remove('vehicle-1', manager);

      expect(prisma.vehicle.update).toHaveBeenCalledWith({
        where: { id: 'vehicle-1' },
        data: { deletedAt: expect.any(Date) },
      });
    });
  });
});
