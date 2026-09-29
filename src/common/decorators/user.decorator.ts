import {
  createParamDecorator,
  ExecutionContext,
  UnauthorizedException,
} from '@nestjs/common';
import { HydratedUser } from '../../model/user.model.js';

export const currentUser = createParamDecorator(
  (data: keyof HydratedUser | undefined, ctx: ExecutionContext) => {
    const request = ctx.switchToHttp().getRequest<{ user?: HydratedUser }>();
    const user = request.user;
    if (!user) {
      throw new UnauthorizedException('user not found on request');
    }
    return data ? user[data] : user;
  },
);
