import { ExecutionContext, Injectable } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';

@Injectable()
export class GoogleOAuthGuard extends AuthGuard('google') {
  getAuthenticateOptions(context: ExecutionContext) {
    const request = context
      .switchToHttp()
      .getRequest<{ query?: { lang?: string } }>();
    return {
      session: false,
      accessType: 'offline',
      prompt: 'select_account',
      hl: request.query?.lang === 'ar' ? 'ar' : 'en',
    };
  }
}
