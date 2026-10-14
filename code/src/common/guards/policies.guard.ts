import { CanActivate, ExecutionContext, ForbiddenException, Injectable } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Request } from 'express';
import { AbilityFactory } from 'src/modules/ability/ability.factory';
import { CAN_KEY, RequiredPermission } from '../decorators/can.decorator';
import { AuthUser } from '../interfaces/auth-user.interface';

@Injectable()
export class PoliciesGuard implements CanActivate {
  constructor(
    private readonly reflector: Reflector,
    private readonly abilityFactory: AbilityFactory,
  ) {}

  canActivate(context: ExecutionContext): boolean {
    const permission = this.reflector.get<RequiredPermission | undefined>(
      CAN_KEY,
      context.getHandler(),
    );
    if (!permission) return true;

    const { user } = context.switchToHttp().getRequest<Request & { user: AuthUser }>();
    const ability = this.abilityFactory.createForUser(user);

    if (!ability.can(permission.action, permission.subject)) {
      throw new ForbiddenException('Você não tem permissão para acessar este recurso');
    }

    return true;
  }
}
