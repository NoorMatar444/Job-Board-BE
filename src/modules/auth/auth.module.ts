import { Module } from '@nestjs/common';
import { PassportModule } from '@nestjs/passport';
import { AuthController } from './auth.controller.js';
import { AuthService } from './auth.service.js';
import { AuthGuard } from '../../common/Guards/authentication.guard.js';
import { TokenService } from '../../services/token.services.js';
import { UserRepo } from '../../repo/user.repo.js';
import { SecurityService } from '../../securityService.js';
import { EmailService } from '../../services/email.services.js';
import { RedisModule } from '../../services/reids.module.js';
import UserModel from '../../model/user.model.js';
import { GoogleStrategy } from './stratgy/google.stratgy.js';
import { GoogleOAuthGuard } from './guard/google-OAuth.guard.js';

@Module({
  imports: [RedisModule, UserModel, PassportModule.register({ session: false })],
  controllers: [AuthController],
  providers: [
    AuthService,
    AuthGuard,
    TokenService,
    UserRepo,
    SecurityService,
    EmailService,
    GoogleStrategy,
    GoogleOAuthGuard,
  ],
})
export class AuthModule {}
