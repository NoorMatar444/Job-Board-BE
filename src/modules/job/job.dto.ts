import { Type } from 'class-transformer';
import {
  IsArray,
  IsBoolean,
  IsDate,
  IsEnum,
  IsInt,
  IsNumber,
  IsOptional,
  IsString,
  MaxLength,
  Min,
  MinLength,
  ValidateNested,
} from 'class-validator';
import {
  EmploymentTypeEnum,
  ExperienceLevelEnum,
  PeriodEnum,
  StatusEnum,
  WorkplaceTypeEnum,
} from '../../common/enums/job.enum.js';

export class JobLocationDto {
  @IsOptional()
  @IsString()
  country?: string;

  @IsOptional()
  @IsString()
  city?: string;
}

export class JobSalaryDto {
  @IsOptional()
  @IsNumber()
  @Min(0)
  min?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  max?: number;

  @IsOptional()
  @IsString()
  currency?: string;

  @IsOptional()
  @IsEnum(PeriodEnum)
  period?: PeriodEnum;

  @IsOptional()
  @IsBoolean()
  isPublic?: boolean;
}

export class CreateJobDto {
  @IsString()
  @MinLength(3)
  @MaxLength(120)
  title!: string;

  @IsString()
  @MinLength(20)
  description!: string;

  @IsEnum(EmploymentTypeEnum)
  employmentType!: EmploymentTypeEnum;

  @IsEnum(WorkplaceTypeEnum)
  workPlaceTypeEnum!: WorkplaceTypeEnum;

  @IsOptional()
  @ValidateNested()
  @Type(() => JobLocationDto)
  location?: JobLocationDto;

  @IsOptional()
  @ValidateNested()
  @Type(() => JobSalaryDto)
  salary?: JobSalaryDto;

  @IsString()
  category!: string;

  @IsEnum(ExperienceLevelEnum)
  experienceLevel!: ExperienceLevelEnum;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  skills?: string[];

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  openings?: number;

  @IsOptional()
  @Type(() => Date)
  @IsDate()
  expiresAt?: Date;
}

export class UpdateJobDto {
  @IsOptional()
  @IsString()
  @MinLength(3)
  @MaxLength(120)
  title?: string;

  @IsOptional()
  @IsString()
  @MinLength(20)
  description?: string;

  @IsOptional()
  @IsEnum(EmploymentTypeEnum)
  employmentType?: EmploymentTypeEnum;

  @IsOptional()
  @IsEnum(WorkplaceTypeEnum)
  workPlaceTypeEnum?: WorkplaceTypeEnum;

  @IsOptional()
  @ValidateNested()
  @Type(() => JobLocationDto)
  location?: JobLocationDto;

  @IsOptional()
  @ValidateNested()
  @Type(() => JobSalaryDto)
  salary?: JobSalaryDto;

  @IsOptional()
  @IsString()
  category?: string;

  @IsOptional()
  @IsEnum(ExperienceLevelEnum)
  experienceLevel?: ExperienceLevelEnum;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  skills?: string[];

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  openings?: number;

  @IsOptional()
  @Type(() => Date)
  @IsDate()
  expiresAt?: Date;
}

export class ListMyJobsQueryDto {
  @IsOptional()
  @IsEnum(StatusEnum)
  status?: StatusEnum;
}

export class ListJobsQueryDto {
  @IsOptional()
  @IsString()
  keyword?: string;

  @IsOptional()
  @IsEnum(EmploymentTypeEnum)
  employmentType?: EmploymentTypeEnum;

  @IsOptional()
  @IsEnum(WorkplaceTypeEnum)
  workPlaceTypeEnum?: WorkplaceTypeEnum;

  @IsOptional()
  @IsEnum(ExperienceLevelEnum)
  experienceLevel?: ExperienceLevelEnum;

  @IsOptional()
  @IsString()
  category?: string;

  @IsOptional()
  @IsString()
  skills?: string;

  @IsOptional()
  @IsString()
  city?: string;

  @IsOptional()
  @IsString()
  country?: string;
}
