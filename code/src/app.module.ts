import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { APP_FILTER, APP_GUARD } from '@nestjs/core';
import { AllExceptionsFilter } from './common/filters/http-exception.filter';
import { AuthGuard } from './common/guards/auth.guard';
import { PoliciesGuard } from './common/guards/policies.guard';
import { CompanyScopeModule } from './common/services/company-scope.module';
import { PrismaModule } from './prisma/prisma.module';
import { AbilityModule } from './modules/ability/ability.module';
import { AuthModule } from './modules/auth/auth.module';
import { CompaniesModule } from './modules/companies/companies.module';
import { HealthModule } from './modules/health/health.module';
import { UsersModule } from './modules/users/users.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    PrismaModule,
    AbilityModule,
    CompanyScopeModule,
    AuthModule,
    HealthModule,
    CompaniesModule,
    UsersModule,
  ],
  providers: [
    { provide: APP_GUARD, useClass: AuthGuard },
    { provide: APP_GUARD, useClass: PoliciesGuard },
    { provide: APP_FILTER, useClass: AllExceptionsFilter },
  ],
})
export class AppModule {}
