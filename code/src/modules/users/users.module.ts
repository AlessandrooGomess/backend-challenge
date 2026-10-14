import { Module } from '@nestjs/common';
import { CompanyScopeResolver } from 'src/common/services/company-scope.resolver';
import { UsersController } from './controllers/users.controller';
import { UsersService } from './services/users.service';

@Module({
  controllers: [UsersController],
  providers: [UsersService, CompanyScopeResolver],
  exports: [UsersService],
})
export class UsersModule {}
