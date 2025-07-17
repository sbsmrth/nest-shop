import { SetMetadata } from '@nestjs/common';
import { ValidRoles } from '../interfaces';

export const ROLES_KEY = 'roles';

export const RoleProtected = (...args: ValidRoles[]) =>
  SetMetadata(ROLES_KEY, args);
