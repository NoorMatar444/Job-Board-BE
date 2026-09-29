import { Body, Controller, Get, Post, Req, UseGuards } from '@nestjs/common';
import {
  ConfirmEmailDto,
  ForgetPasswordDto,
  LoginDto,
  ResendConfirmEmailOtpDto,
  SendForgetPasswordOtpDto,
  SignupDto,
} from './auth.dto.js';
import { AuthService } from './auth.service.js';
import { AuthGuard } from '../../common/Guards/authentication.guard.js';
import type { IAuthRequest } from '../../common/interface/auth.interface.js';
import { GoogleOAuthGuard } from './guard/google-OAuth.guard.js';
import type { GoogleProfileUser } from './stratgy/google.stratgy.js';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('signup')
  signup(@Body() body: SignupDto) {
    return this.authService.signup(body);
  }

  @Post('login')
  login(@Body() body: LoginDto) {
    return this.authService.login(body);
  }

  @Post('confirmEmail')
  confirmEmail(@Body() body: ConfirmEmailDto) {
    return this.authService.confirmEmail(body);
  }

  @Post('resend-confirmEmail')
  resendConfirmEmailOtp(@Body() body: ResendConfirmEmailOtpDto) {
    return this.authService.resendConfirmEmailOtp(body);
  }

  @Post('send-forget-password-otp')
  sendForgetPasswordOtp(@Body() body: SendForgetPasswordOtpDto) {
    return this.authService.sendForgetPasswordOtp(body);
  }

  @Post('forget-password')
  forgetPassword(@Body() body: ForgetPasswordDto) {
    return this.authService.forgetPassword(body);
  }

  @Post('logout')
  @UseGuards(AuthGuard)
  logout(@Req() req: IAuthRequest) {
    return this.authService.logout(req.verifiedToken);
  }

  @Get('google')
  @UseGuards(GoogleOAuthGuard)
  googleAuth() {}

  @Get('google/callback')
  @UseGuards(GoogleOAuthGuard)
  googleCallback(@Req() req: { user: GoogleProfileUser }) {
    return this.authService.googleAuth(req.user);
  }
}
