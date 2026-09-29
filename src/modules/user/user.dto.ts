import { IsOptional, IsString, Matches, MaxLength, MinLength } from 'class-validator';

export class UpdateProfileDto {
  @IsOptional()
  @IsString()
  @MinLength(3)
  @MaxLength(30)
  @Matches(/^[a-zA-Z0-9_]+$/, {
    message: 'userName can only contain letters, numbers, and underscores',
  })
  userName?: string;

  @IsOptional()
  @IsString()
  @Matches(/^\+?[0-9]{8,15}$/, {
    message: 'phone must be 8-15 digits and may start with +',
  })
  phone?: string;

  @IsOptional()
  @IsString()
  companyName?: string;
}
