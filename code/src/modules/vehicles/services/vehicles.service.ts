import { ConflictException, Injectable, Logger } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { AuthUser } from 'src/common/interfaces/auth-user.interface';
import { CompanyScopeResolver } from 'src/common/services/company-scope.resolver';
import { AbilityFactory } from 'src/modules/ability/ability.factory';
import { PrismaService } from 'src/prisma/prisma.service';
import { CreateVehicleDto } from '../dtos/create-vehicle.dto';

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
}
