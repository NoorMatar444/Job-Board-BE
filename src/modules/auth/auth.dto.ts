import { Transform } from 'class-transformer';
import {
  IsEmail,
  IsIn,
  IsOptional,
  IsString,
  Length,
  Matches,
  MaxLength,
  MinLength,
} from 'class-validator';
import { RoleEnum } from '../../common/enums/user.enum.js';

function normalizeEmail({ value }: { value: unknown }) {
  return typeof value === 'string' ? value.toLowerCase().trim() : value;
}

export class SignupDto {
  @IsString()
  @MinLength(3)
  @MaxLength(30)
  @Matches(/^[a-zA-Z0-9_]+$/, {
    message: 'userName can only contain letters, numbers, and underscores',
  })
  userName!: string;

  @Transform(normalizeEmail)
  @IsEmail()
  email!: string;

  @IsString()
  @MinLength(8)
  @MaxLength(64)
  password!: string;

  @IsOptional()
  @IsString()
  @Matches(/^\+?[0-9]{8,15}$/, {
    message: 'phone must be 8-15 digits and may start with +',
  })
  phone?: string;

  @IsOptional()
  @IsIn([RoleEnum.CANDIDATE, RoleEnum.EMPLOYER, RoleEnum.ADMIN])
  role?: RoleEnum.CANDIDATE | RoleEnum.EMPLOYER | RoleEnum.ADMIN;
}

export class LoginDto {
  @Transform(normalizeEmail)
  @IsEmail()
  email!: string;

  @IsString()
  @MinLength(8)
  @MaxLength(64)
  password!: string;
}

export class ConfirmEmailDto {
  @Transform(normalizeEmail)
  @IsEmail()
  email!: string;

  @IsString()
  @Length(6, 6)
  @Matches(/^\d{6}$/, { message: 'otp must be a 6-digit code' })
  otp!: string;
}

export class ResendConfirmEmailOtpDto {
  @Transform(normalizeEmail)
  @IsEmail()
  email!: string;
}

export class SendForgetPasswordOtpDto {
  @Transform(normalizeEmail)
  @IsEmail()
  email!: string;
}

export class ForgetPasswordDto {
  @Transform(normalizeEmail)
  @IsEmail()
  email!: string;

  @IsString()
  @Length(6, 6)
  @Matches(/^\d{6}$/, { message: 'otp must be a 6-digit code' })
  otp!: string;

  @IsString()
  @MinLength(8)
  @MaxLength(64)
  password!: string;
}
