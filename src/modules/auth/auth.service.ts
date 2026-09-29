import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import {
  ConfirmEmailDto,
  ForgetPasswordDto,
  LoginDto,
  ResendConfirmEmailOtpDto,
  SendForgetPasswordOtpDto,
  SignupDto,
} from './auth.dto.js';
import { UserRepo } from '../../repo/user.repo.js';
import { ProviderEnum, RoleEnum } from '../../common/enums/user.enum.js';
import { SecurityService } from '../../securityService.js';
import { ConfigService } from '@nestjs/config';
import { EmailService } from '../../services/email.services.js';
import { RedisService } from '../../services/redis.service.js';
import { TokenService } from '../../services/token.services.js';
import { HydratedUser } from '../../model/user.model.js';
import { GoogleProfileUser } from './stratgy/google.stratgy.js';

@Injectable()
export class AuthService {
  constructor(
    private readonly UserRepo: UserRepo,
    private readonly SecurityService: SecurityService,
    private readonly ConfigService: ConfigService,
    private readonly emailService: EmailService,
    private readonly RedisService: RedisService,
    private readonly TokenService: TokenService,
  ) {}
  async signup(body: SignupDto) {
    const { email, role } = body;
    const user = await this.UserRepo.findOne({ filter: { email } });
    if (user) {
      throw new BadRequestException('user already exist');
    }
    if (role === RoleEnum.ADMIN) {
      throw new UnauthorizedException('Admin can not create an account');
    }
    const hashedPassword = await this.SecurityService.hashOperation({
      data: body.password,
      saltOrRounds: Number(
        this.ConfigService.getOrThrow<string>('SALT_OR_ROUNDS'),
      ),
    });
    body.password = hashedPassword;
    const encryptedPhone = this.SecurityService.encryptOperation({
      message: body.phone,
      ENCRYPTION_KEY: this.ConfigService.getOrThrow<string>('ENCRYPTION_KEY'),
    });
    body.phone = encryptedPhone;
    const newUser = this.UserRepo.create({
      data: {
        changeCreditTime: new Date(),
        ...body,
      },
    });
    const otp = this.SecurityService.generateOtp();
    const hashedOtp = await this.SecurityService.hashOperation({
      data: otp,
      saltOrRounds: this.ConfigService.getOrThrow<string>('SALT_OR_ROUNDS'),
    });
    this.emailService.sendEmail({
      to: this.ConfigService.getOrThrow<string>('USER_EMAIL'),
      subject: 'your confirm email otp',
      text: hashedOtp,
    });
    this.RedisService.set({ key: `confirm email otp`, value: hashedOtp });
    return newUser;
  }

  async login(_body: LoginDto) {
    const user = await this.UserRepo.findOne({
      filter: {
        email: _body.email,
        confirmEmail: true,
        provider: ProviderEnum.SYSTEM,
      },
    });
    if (!user) {
      throw new NotFoundException('user does not exist');
    }
    if (
      !this.SecurityService.compareOperation({
        data: _body.password,
        encrypted: user.password,
      })
    ) {
      throw new UnauthorizedException('password does not match');
    }
    return this.TokenService.generateAccessAndRefreshTokens(user.role, user);
  }

  async confirmEmail(_body: ConfirmEmailDto) {
    const user = await this.UserRepo.findOne({
      filter: { email: _body.email },
    });
    if (!user) {
      throw new NotFoundException('user does not exist');
    }
    const storedOtp = await this.RedisService.get({ key: 'confirm email otp' });
    const isValid = await this.SecurityService.compareOperation({
      data: _body.otp,
      encrypted: storedOtp ?? '',
    });
    if (!isValid) {
      throw new BadRequestException('invalid otp');
    }
    await this.UserRepo.findOneAndUpdate({
      filter: { email: _body.email },
      update: { confirmEmail: true },
    });
    return 'email confirmed successfully';
  }

  async resendConfirmEmailOtp(_body: ResendConfirmEmailOtpDto) {
    if (
      await this.UserRepo.findOne({
        filter: { email: _body.email, confirmEmail: false },
      })
    ) {
      const otp = this.SecurityService.generateOtp();
      const hashedOtp = await this.SecurityService.hashOperation({
        data: otp,
        saltOrRounds: this.ConfigService.getOrThrow<string>('SALT_OR_ROUNDS'),
      });
      this.emailService.sendEmail({
        to: this.ConfigService.getOrThrow<string>('USER_EMAIL'),
        subject: 'resend confirm email otp',
        text: hashedOtp,
      });
      this.RedisService.set({ key: 'confirm email otp', value: hashedOtp });
    } else {
      throw new NotFoundException('user does not exist');
    }
    return { message: 'confirm email otp was sent to you' };
  }

  async sendForgetPasswordOtp(_body: SendForgetPasswordOtpDto) {
    const otp = this.SecurityService.generateOtp();
    const hashedOtp = await this.SecurityService.hashOperation({
      data: otp,
      saltOrRounds: this.ConfigService.getOrThrow<string>('SALT_OR_ROUNDS'),
    });
    if (await this.UserRepo.findOne({ filter: { email: _body.email } })) {
      this.emailService.sendEmail({
        to: this.ConfigService.getOrThrow<string>('USER_EMAIL'),
        subject: 'resend confirm email otp',
        text: hashedOtp,
      });
      this.RedisService.set({ key: 'confirm email otp', value: hashedOtp });
    } else {
      throw new NotFoundException('user does not exist');
    }
    return { message: 'forget password otp was sent to you' };
  }

  async forgetPassword(_body: ForgetPasswordDto) {
    if (!(await this.UserRepo.findOne({ filter: { email: _body.email } }))) {
      throw new NotFoundException('user does not exist');
    }
    const storedOtp = await this.RedisService.get({ key: 'confirm email otp' });
    const isValid = await this.SecurityService.compareOperation({
      data: _body.otp,
      encrypted: storedOtp ?? '',
    });
    if (!isValid) {
      throw new BadRequestException('invalid otp');
    }
    const hashedPassword = await this.SecurityService.hashOperation({
      data: _body.password,
      saltOrRounds: Number(
        this.ConfigService.getOrThrow<string>('SALT_OR_ROUNDS'),
      ),
    });
    await this.UserRepo.findOneAndUpdate({
      filter: { email: _body.email },
      update: { password: hashedPassword },
    });
    return 'password updated successfully';
  }
  async refresh(user: HydratedUser) {
    if (await this.UserRepo.findOne({ filter: { email: user.email } })) {
      return this.TokenService.generateAccessAndRefreshTokens(user.role, user);
    }
  }

  async logout(tokenPayload: { sub?: string; jti?: string }) {
    const { sub, jti } = tokenPayload;
    if (!sub || !jti) {
      throw new UnauthorizedException('token not valid');
    }
    const key = `revoked:${jti}`;
    await this.RedisService.set({ key, value: sub });
    await this.RedisService.expire({
      key,
      seconds: 365 * 24 * 60 * 60,
    });
    return { message: 'logged out successfully' };
  }
  async googleAuth(googleUser: GoogleProfileUser) {
    const existByGoogleId = await this.UserRepo.findOne({
      filter: { googleId: googleUser.googleId },
    });
    if (existByGoogleId) {
      if (!existByGoogleId.isActive) {
        throw new UnauthorizedException('the account is deactivated');
      }
      return this.TokenService.generateAccessAndRefreshTokens(
        existByGoogleId.role,
        existByGoogleId as HydratedUser,
      );
    }
    const existByEmail = await this.UserRepo.findOne({
      filter: { email: googleUser.email },
    });
    if (existByEmail) {
      if (existByEmail.provider !== ProviderEnum.GOOGLE) {
        throw new ConflictException('please sign through email and password');
      }
      if (!existByEmail.isActive) {
        throw new UnauthorizedException('the account is deactivated');
      }
      if (
        existByEmail.googleId &&
        existByEmail.googleId !== googleUser.googleId
      ) {
        throw new ConflictException('google account does not match this email');
      }
      if (!existByEmail.googleId) {
        await this.UserRepo.findOneAndUpdate({
          filter: { email: googleUser.email },
          update: { googleId: googleUser.googleId },
        });
        existByEmail.googleId = googleUser.googleId;
      }
      return this.TokenService.generateAccessAndRefreshTokens(
        existByEmail.role,
        existByEmail as HydratedUser,
      );
    }
    const createUser = await this.UserRepo.create({
      data: {
        userName: this.googleUserName(googleUser),
        email: googleUser.email,
        googleId: googleUser.googleId,
        provider: ProviderEnum.GOOGLE,
        confirmEmail: true,
        ...(googleUser.profilePicture
          ? { profilePicture: googleUser.profilePicture }
          : {}),
      },
    });
    return this.TokenService.generateAccessAndRefreshTokens(
      createUser.role,
      createUser,
    );
  }

  private googleUserName(googleUser: GoogleProfileUser) {
    const source = googleUser.userName || googleUser.email.split('@')[0];
    const base =
      source
        .toLowerCase()
        .replace(/[^a-z0-9_]+/g, '_')
        .replace(/^_+|_+$/g, '')
        .slice(0, 20) || 'user';
    return `${base}_${googleUser.googleId.slice(-8)}`;
  }
}
