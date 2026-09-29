import {
  Injectable,
  CanActivate,
  ExecutionContext,
  UnauthorizedException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { IAuthRequest } from '../interface/auth.interface.js';
import { TokenService } from '../../services/token.services.js';
import { TokenEnum } from '../enums/token.enum.js';

@Injectable()
export class AuthGuard implements CanActivate {
  constructor(
    private readonly tokenService: TokenService,
    private readonly reflector: Reflector,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<IAuthRequest>();
    const authorization: string | undefined = request.headers.authorization;

    if (!authorization?.startsWith('Bearer ')) {
      throw new UnauthorizedException('token not valid');
    }

    const tokenType =
      this.reflector.getAllAndOverride<TokenEnum>('tokenType', [
        context.getHandler(),
        context.getClass(),
      ]) ?? TokenEnum.ACCESS;

    const { user, verifiedToken } = await this.tokenService.checkToken({
      authorization,
      tokenType,
    });

    request.user = user;
    request.verifiedToken = verifiedToken;
    return true;
  }
}
