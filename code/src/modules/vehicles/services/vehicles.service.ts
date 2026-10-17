import { accessibleBy } from '@casl/prisma';
import {
  BadRequestException,
  ConflictException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { AuthUser } from 'src/common/interfaces/auth-user.interface';
import { CompanyScopeResolver } from 'src/common/services/company-scope.resolver';
import { AbilityFactory } from 'src/modules/ability/ability.factory';
import { PrismaService } from 'src/prisma/prisma.service';
import { CreateVehicleDto } from '../dtos/create-vehicle.dto';
import { QueryVehicleDto } from '../dtos/query-vehicle.dto';
import { UpdateVehicleDto } from '../dtos/update-vehicle.dto';
import { CreateRefuelingDto } from '../dtos/create-refueling.dto';
import { QueryConsumptionDto } from '../dtos/query-consumption.dto';
import { QueryRefuelingDto } from '../dtos/query-refueling.dto';

export const VEHICLE_SELECT = {
  id: true,
  plate: true,
  brand: true,
  model: true,
  year: true,
  vehicleType: true,
  isActive: true,
  description: true,
  company: { select: { id: true, name: true } },
  createdAt: true,
  updatedAt: true,
} satisfies Prisma.VehicleSelect;

const REFUELING_SELECT = {
  id: true,
  vehicleId: true,
  date: true,
  liters: true,
  totalValue: true,
  odometer: true,
  createdAt: true,
  updatedAt: true,
} satisfies Prisma.RefuelingSelect;

@Injectable()
export class VehiclesService {
  private readonly logger = new Logger(VehiclesService.name);
  constructor(
    private readonly prisma: PrismaService,
    private readonly abilityFactory: AbilityFactory,
    private readonly companyScopeResolver: CompanyScopeResolver,
  ) {}
  async create(data: CreateVehicleDto, user: AuthUser): Promise<{ id: string; message: string }> {
    const companyId = await this.companyScopeResolver.resolveCompanyId(data, user);
    await this.ensurePlateIsAvailable(data.plate, companyId);
    const created = await this.prisma.vehicle.create({
      data: {
        ...data,
        companyId,
      },
      select: { id: true },
    });
    this.logger.log(`Vehicle ${created.id} created in company ${companyId}`);
    return { id: created.id, message: 'Veículo criado com sucesso' };
  }

  async findAll(params: QueryVehicleDto, user: AuthUser) {
    const { page, limit, orderBy, order, ...filters } = params;
    const skip = (page - 1) * limit;

    const ability = this.abilityFactory.createForUser(user);
    const where: Prisma.VehicleWhereInput = {
      AND: [accessibleBy(ability, 'read').Vehicle, this.buildFilters(filters), { deletedAt: null }],
    };

    const [vehicles, total] = await Promise.all([
      this.prisma.vehicle.findMany({
        where,
        skip,
        take: limit,
        orderBy: { [orderBy]: order },
        select: VEHICLE_SELECT,
      }),
      this.prisma.vehicle.count({ where }),
    ]);

    return {
      data: vehicles,
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

    const found = await this.prisma.vehicle.findFirst({
      where: { AND: [{ id, deletedAt: null }, accessibleBy(ability, 'read').Vehicle] },
      select: VEHICLE_SELECT,
    });

    if (!found) {
      throw new NotFoundException(`Veículo com ID ${id} não encontrado`);
    }

    return found;
  }

  async update(
    id: string,
    data: UpdateVehicleDto,
    user: AuthUser,
  ): Promise<{ id: string; message: string }> {
    const vehicle = await this.findOne(id, user);

    if (data.plate) {
      await this.ensurePlateIsAvailable(data.plate, vehicle.company.id, id);
    }

    await this.prisma.vehicle.update({
      where: { id },
      data,
    });

    return { id, message: 'Veículo atualizado com sucesso' };
  }

  async remove(id: string, user: AuthUser): Promise<void> {
    await this.findOne(id, user);

    await this.prisma.vehicle.update({
      where: { id },
      data: { deletedAt: new Date() },
    });
  }

  async createRefueling(
    vehicleId: string,
    data: CreateRefuelingDto,
    user: AuthUser,
  ): Promise<{ id: string; message: string }> {
    const vehicle = await this.findOne(vehicleId, user);

    if (!vehicle.isActive) {
      throw new BadRequestException(
        'Não é possível registrar abastecimento para um veículo inativo',
      );
    }

    await this.ensureValidOdometer(vehicleId, data.date, data.odometer);

    const created = await this.prisma.refueling.create({
      data: {
        ...data,
        vehicleId,
      },
      select: { id: true },
    });

    this.logger.log(`Refueling ${created.id} created for vehicle ${vehicleId}`);

    return { id: created.id, message: 'Abastecimento registrado com sucesso' };
  }

  async findAllRefuelings(vehicleId: string, params: QueryRefuelingDto, user: AuthUser) {
    await this.findOne(vehicleId, user);

    const { page, limit, orderBy, order } = params;
    const skip = (page - 1) * limit;

    const ability = this.abilityFactory.createForUser(user);
    const where: Prisma.RefuelingWhereInput = {
      AND: [accessibleBy(ability, 'read').Refueling, { vehicleId }],
    };

    const [refuelings, total] = await Promise.all([
      this.prisma.refueling.findMany({
        where,
        skip,
        take: limit,
        orderBy: { [orderBy]: order },
        select: REFUELING_SELECT,
      }),
      this.prisma.refueling.count({ where }),
    ]);

    return {
      data: refuelings,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async getConsumptionReport(vehicleId: string, query: QueryConsumptionDto, user: AuthUser) {
    const vehicle = await this.findOne(vehicleId, user);

    const start = new Date(`${query.startDate}T00:00:00.000Z`);
    const end = new Date(`${query.endDate}T23:59:59.999Z`);

    const refuelings = await this.prisma.refueling.findMany({
      where: {
        vehicleId,
        date: { gte: start, lte: end },
      },
      orderBy: [{ date: 'asc' }, { odometer: 'asc' }],
      select: {
        liters: true,
        totalValue: true,
        odometer: true,
      },
    });

    if (refuelings.length < 2) {
      return {
        vehicleId: vehicle.id,
        plate: vehicle.plate,
        period: { startDate: query.startDate, endDate: query.endDate },
        totalKm: 0,
        totalLiters: 0,
        totalSpent: 0,
        averageKmPerLiter: null,
        averageCostPerKm: null,
      };
    }

    const first = refuelings[0];
    const last = refuelings[refuelings.length - 1];
    const totalKm = last.odometer - first.odometer;

    const subsequent = refuelings.slice(1);
    const totalLiters = Number(subsequent.reduce((sum, r) => sum + r.liters, 0).toFixed(2));
    const totalSpent = Number(subsequent.reduce((sum, r) => sum + r.totalValue, 0).toFixed(2));

    return {
      vehicleId: vehicle.id,
      plate: vehicle.plate,
      period: { startDate: query.startDate, endDate: query.endDate },
      totalKm,
      totalLiters,
      totalSpent,
      averageKmPerLiter: totalLiters > 0 ? Number((totalKm / totalLiters).toFixed(2)) : null,
      averageCostPerKm: totalKm > 0 ? Number((totalSpent / totalKm).toFixed(2)) : null,
    };
  }

  private async ensurePlateIsAvailable(
    plate: string,
    companyId: string,
    ignoreId?: string,
  ): Promise<void> {
    const existing = await this.prisma.vehicle.findFirst({
      where: {
        plate,
        companyId,
        deletedAt: null,
        ...(ignoreId && { id: { not: ignoreId } }),
      },
      select: { id: true },
    });
    if (existing) {
      throw new ConflictException('Já existe um veículo cadastrado com esta placa nesta empresa');
    }
  }
  private buildFilters(filters: Omit<QueryVehicleDto, 'page' | 'limit' | 'orderBy' | 'order'>) {
    const where: Prisma.VehicleWhereInput = {};

    if (filters.search) {
      const normalizedPlateSearch = filters.search.replace(/-/g, '') || filters.search;
      where.OR = [
        { plate: { contains: normalizedPlateSearch, mode: 'insensitive' } },
        { brand: { contains: filters.search, mode: 'insensitive' } },
        { model: { contains: filters.search, mode: 'insensitive' } },
      ];
    }

    if (filters.vehicleType?.length) {
      where.vehicleType = { in: filters.vehicleType };
    }

    if (filters.isActive !== undefined) {
      where.isActive = filters.isActive;
    }

    if (filters.companyId) {
      where.companyId = filters.companyId;
    }

    return where;
  }

  private async ensureValidOdometer(
    vehicleId: string,
    date: Date,
    odometer: number,
  ): Promise<void> {
    const [previous, next] = await Promise.all([
      this.prisma.refueling.findFirst({
        where: { vehicleId, date: { lte: date } },
        orderBy: [{ date: 'desc' }, { odometer: 'desc' }],
        select: { odometer: true },
      }),
      this.prisma.refueling.findFirst({
        where: { vehicleId, date: { gt: date } },
        orderBy: [{ date: 'asc' }, { odometer: 'asc' }],
        select: { odometer: true },
      }),
    ]);

    if (previous && odometer <= previous.odometer) {
      throw new BadRequestException(
        `O hodômetro deve ser maior que o do abastecimento anterior (${previous.odometer} km)`,
      );
    }

    if (next && odometer >= next.odometer) {
      throw new BadRequestException(
        `O hodômetro deve ser menor que o do abastecimento posterior (${next.odometer} km)`,
      );
    }
  }
}
