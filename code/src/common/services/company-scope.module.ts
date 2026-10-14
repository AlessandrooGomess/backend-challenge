import { Global, Module } from '@nestjs/common';
import { CompanyScopeResolver } from './company-scope.resolver';

@Global()
@Module({
  providers: [CompanyScopeResolver],
  exports: [CompanyScopeResolver],
})
export class CompanyScopeModule {}
