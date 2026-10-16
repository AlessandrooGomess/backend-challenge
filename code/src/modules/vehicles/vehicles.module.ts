import { Module } from '@nestjs/common';
import { CompanyScopeResolver } from 'src/common/services/company-scope.resolver';
import { VehiclesController } from './controllers/vehicles.controller';
import { VehiclesService } from './services/vehicles.service';

@Module({
  controllers: [VehiclesController],
  providers: [VehiclesService, CompanyScopeResolver],
  exports: [VehiclesService],
})
export class VehiclesModule {}
