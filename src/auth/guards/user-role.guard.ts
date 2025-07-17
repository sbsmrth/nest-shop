import {
  Injectable,
  CanActivate,
  ExecutionContext,
  BadRequestException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { ValidRoles } from '../interfaces';
import { Observable } from 'rxjs';
import { ROLES_KEY } from '../decorators/role-protected.decorator';
import { User } from '../entities/user.entity';

@Injectable()
export class UserRoleGuard implements CanActivate {
  constructor(private reflector: Reflector) {}
  // Reflector is used to access metadata set by decorators

  canActivate(
    context: ExecutionContext,
  ): boolean | Promise<boolean> | Observable<boolean> {
    const requiredRoles = this.reflector.getAllAndOverride<ValidRoles[]>(
      ROLES_KEY,
      [context.getHandler(), context.getClass()],
    );

    if (!requiredRoles || requiredRoles.length === 0) {
      return true;
    }

    const req = context.switchToHttp().getRequest<Request & { user?: User }>();
    const user = req.user; // The user object is set by the JwtStrategy's validate method (returned user)

    if (!user) throw new BadRequestException('User not found in request');

    return requiredRoles.some((role) => user.roles?.includes(role));
  }
}
