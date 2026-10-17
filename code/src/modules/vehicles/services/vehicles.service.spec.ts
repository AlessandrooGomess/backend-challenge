import { BadRequestException, ConflictException, NotFoundException } from '@nestjs/common';
import { Role } from 'src/common/enums/role.enum';
import { AuthUser } from 'src/common/interfaces/auth-user.interface';
import { VehicleType } from '../enums/vehicle-type.enum';
import { VehiclesService } from './vehicles.service';

jest.mock('@casl/prisma', () => ({
  accessibleBy: jest.fn(() => ({ Vehicle: {}, Refueling: {} })),
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
    refueling: {
      create: jest.Mock;
      findFirst: jest.Mock;
      findMany: jest.Mock;
      count: jest.Mock;
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
      refueling: {
        create: jest.fn(),
        findFirst: jest.fn(),
        findMany: jest.fn(),
        count: jest.fn(),
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

  describe('createRefueling', () => {
    const refuelingDto = {
      date: new Date('2026-01-15T10:00:00.000Z'),
      liters: 40,
      totalValue: 240,
      odometer: 1500,
    };

    it('registra o abastecimento quando o veículo está ativo e o hodômetro é válido', async () => {
      prisma.vehicle.findFirst.mockResolvedValue({ id: 'vehicle-1', isActive: true });
      prisma.refueling.findFirst
        .mockResolvedValueOnce({ odometer: 1000 })
        .mockResolvedValueOnce({ odometer: 2000 });
      prisma.refueling.create.mockResolvedValue({ id: 'refueling-1' });

      const result = await service.createRefueling('vehicle-1', refuelingDto, manager);

      expect(result).toEqual({
        id: 'refueling-1',
        message: 'Abastecimento registrado com sucesso',
      });
      expect(prisma.refueling.create).toHaveBeenCalledWith({
        data: { ...refuelingDto, vehicleId: 'vehicle-1' },
        select: { id: true },
      });
    });

    it('lança BadRequestException (400) quando o veículo está inativo', async () => {
      prisma.vehicle.findFirst.mockResolvedValue({ id: 'vehicle-1', isActive: false });

      await expect(
        service.createRefueling('vehicle-1', refuelingDto, manager),
      ).rejects.toBeInstanceOf(BadRequestException);
      expect(prisma.refueling.create).not.toHaveBeenCalled();
    });

    it('lança BadRequestException (400) quando o hodômetro não é maior que o do abastecimento anterior', async () => {
      prisma.vehicle.findFirst.mockResolvedValue({ id: 'vehicle-1', isActive: true });
      prisma.refueling.findFirst
        .mockResolvedValueOnce({ odometer: 1500 })
        .mockResolvedValueOnce(null);

      await expect(
        service.createRefueling('vehicle-1', refuelingDto, manager),
      ).rejects.toBeInstanceOf(BadRequestException);
      expect(prisma.refueling.create).not.toHaveBeenCalled();
    });

    it('lança BadRequestException (400) quando lançado no meio do histórico com hodômetro maior ou igual ao próximo', async () => {
      prisma.vehicle.findFirst.mockResolvedValue({ id: 'vehicle-1', isActive: true });
      prisma.refueling.findFirst
        .mockResolvedValueOnce({ odometer: 1000 })
        .mockResolvedValueOnce({ odometer: 1400 });

      await expect(
        service.createRefueling('vehicle-1', refuelingDto, manager),
      ).rejects.toBeInstanceOf(BadRequestException);
      expect(prisma.refueling.create).not.toHaveBeenCalled();
    });
  });

  describe('getConsumptionReport', () => {
    it('calcula totalKm, totalLiters, totalSpent e médias ignorando os litros e valor do primeiro abastecimento', async () => {
      prisma.vehicle.findFirst.mockResolvedValue({ id: 'vehicle-1', plate: 'ABC1D23' });
      prisma.refueling.findMany.mockResolvedValue([
        { odometer: 10000, liters: 50, totalValue: 300 },
        { odometer: 10600, liters: 50, totalValue: 310.25 },
        { odometer: 11200, liters: 50, totalValue: 310.25 },
      ]);

      const result = await service.getConsumptionReport(
        'vehicle-1',
        { startDate: '2026-01-01', endDate: '2026-01-31' },
        manager,
      );

      expect(result).toEqual({
        vehicleId: 'vehicle-1',
        plate: 'ABC1D23',
        period: { startDate: '2026-01-01', endDate: '2026-01-31' },
        totalKm: 1200,
        totalLiters: 100,
        totalSpent: 620.5,
        averageKmPerLiter: 12,
        averageCostPerKm: 0.52,
      });
    });

    it('retorna totais zerados e médias nulas quando há menos de dois abastecimentos no período', async () => {
      prisma.vehicle.findFirst.mockResolvedValue({ id: 'vehicle-1', plate: 'ABC1D23' });
      prisma.refueling.findMany.mockResolvedValue([
        { odometer: 10000, liters: 50, totalValue: 300 },
      ]);

      const result = await service.getConsumptionReport(
        'vehicle-1',
        { startDate: '2026-01-01', endDate: '2026-01-31' },
        manager,
      );

      expect(result).toEqual({
        vehicleId: 'vehicle-1',
        plate: 'ABC1D23',
        period: { startDate: '2026-01-01', endDate: '2026-01-31' },
        totalKm: 0,
        totalLiters: 0,
        totalSpent: 0,
        averageKmPerLiter: null,
        averageCostPerKm: null,
      });
    });
  });
});
