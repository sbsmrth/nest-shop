// Composition of auth decorators for Authentication & Authorization
import { applyDecorators, UseGuards } from '@nestjs/common';
import { ValidRoles } from '../interfaces';
import { UserRoleGuard } from '../guards/user-role.guard';
import { AuthGuard } from '@nestjs/passport';
import { RoleProtected } from './role-protected.decorator';

export function Auth(...roles: ValidRoles[]) {
  return applyDecorators(
    RoleProtected(...roles),
    UseGuards(AuthGuard(), UserRoleGuard),
  );
}
