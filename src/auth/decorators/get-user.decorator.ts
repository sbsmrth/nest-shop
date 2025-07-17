import {
  createParamDecorator,
  ExecutionContext,
  InternalServerErrorException,
} from '@nestjs/common';
import { User } from '../entities/user.entity';

export const GetUser = createParamDecorator(
  (data: string[] = [], ctx: ExecutionContext) => {
    const req = ctx.switchToHttp().getRequest<Request & { user?: User }>();
    const user = req.user; // The user object is set by the JwtStrategy's validate method (returned user)

    if (!user)
      throw new InternalServerErrorException('User not found in request');

    if (data.length === 0) return user;

    return Object.fromEntries(data.map((key) => [key, user[key]]));
  },
);
