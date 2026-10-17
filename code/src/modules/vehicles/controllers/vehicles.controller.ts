import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Patch,
  Post,
  Query,
} from '@nestjs/common';
import { Can } from 'src/common/decorators/can.decorator';
import { CurrentUser } from 'src/common/decorators/current-user.decorator';
import { AuthUser } from 'src/common/interfaces/auth-user.interface';
import { CreateVehicleDto } from '../dtos/create-vehicle.dto';
import { QueryVehicleDto } from '../dtos/query-vehicle.dto';
import { UpdateVehicleDto } from '../dtos/update-vehicle.dto';
import { VehiclesService } from '../services/vehicles.service';
import { CreateRefuelingDto } from '../dtos/create-refueling.dto';
import { QueryConsumptionDto } from '../dtos/query-consumption.dto';
import { QueryRefuelingDto } from '../dtos/query-refueling.dto';

@Controller('vehicles')
export class VehiclesController {
  constructor(private readonly vehiclesService: VehiclesService) {}

  @Can('create', 'Vehicle')
  @Post()
  @HttpCode(HttpStatus.CREATED)
  async create(@Body() createVehicleDto: CreateVehicleDto, @CurrentUser() user: AuthUser) {
    return this.vehiclesService.create(createVehicleDto, user);
  }

  @Can('read', 'Vehicle')
  @Get()
  async findAll(@Query() query: QueryVehicleDto, @CurrentUser() user: AuthUser) {
    return this.vehiclesService.findAll(query, user);
  }

  @Can('read', 'Vehicle')
  @Get(':id')
  async findOne(@Param('id') id: string, @CurrentUser() user: AuthUser) {
    return this.vehiclesService.findOne(id, user);
  }

  @Can('update', 'Vehicle')
  @Patch(':id')
  async update(
    @Param('id') id: string,
    @Body() updateVehicleDto: UpdateVehicleDto,
    @CurrentUser() user: AuthUser,
  ) {
    return this.vehiclesService.update(id, updateVehicleDto, user);
  }

  @Can('create', 'Refueling')
  @Post(':id/refuelings')
  @HttpCode(HttpStatus.CREATED)
  async createRefueling(
    @Param('id') id: string,
    @Body() createRefuelingDto: CreateRefuelingDto,
    @CurrentUser() user: AuthUser,
  ) {
    return this.vehiclesService.createRefueling(id, createRefuelingDto, user);
  }

  @Can('read', 'Refueling')
  @Get(':id/refuelings')
  async findAllRefuelings(
    @Param('id') id: string,
    @Query() query: QueryRefuelingDto,
    @CurrentUser() user: AuthUser,
  ) {
    return this.vehiclesService.findAllRefuelings(id, query, user);
  }

  @Can('read', 'Refueling')
  @Get(':id/consumption')
  async getConsumptionReport(
    @Param('id') id: string,
    @Query() query: QueryConsumptionDto,
    @CurrentUser() user: AuthUser,
  ) {
    return this.vehiclesService.getConsumptionReport(id, query, user);
  }
  @Can('delete', 'Vehicle')
  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  async remove(@Param('id') id: string, @CurrentUser() user: AuthUser) {
    await this.vehiclesService.remove(id, user);
  }
}
