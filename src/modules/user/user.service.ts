import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { UserRepo } from '../../repo/user.repo.js';
import { S3BucketService } from '../../services/s3Bucket.service.js';
import { SecurityService } from '../../securityService.js';
import { ConfigService } from '@nestjs/config';
import { UpdateProfileDto } from './user.dto.js';
import { RoleEnum } from '../../common/enums/user.enum.js';

@Injectable()
export class UserService {
  constructor(
    private readonly UserRepo: UserRepo,
    private readonly S3BucketService: S3BucketService,
    private readonly SecurityService: SecurityService,
    private readonly ConfigService: ConfigService,
  ) {}
  async getMyProfile(userId: string) {
    const user = await this.UserRepo.findOne({
      filter: { _id: userId },
      projection: '-password',
    });
    if (!user) {
      throw new NotFoundException('user not found');
    }
    if (user.phone) {
      user.phone = this.SecurityService.decryptOperation({
        message: user.phone,
        ENCRYPTION_KEY: this.ConfigService.getOrThrow<string>('ENCRYPTION_KEY'),
      });
    }
    if (user.logo) {
      const logoUrl = await this.S3BucketService.createPresignedGetFile({
        key: user.logo,
      });
      return { ...user.toObject(), logoUrl };
    }
    return user;
  }
  async updateProfile(userId: string, body: UpdateProfileDto) {
    const user = await this.UserRepo.findOne({ filter: { _id: userId } });
    if (!user) {
      throw new NotFoundException('user does not exist');
    }
    if (body.companyName && user.role !== RoleEnum.EMPLOYER) {
      throw new BadRequestException('user can not be an employer');
    }
    if (body.userName) {
      const existingUser = await this.UserRepo.findOne({
        filter: { userName: body.userName, _id: { $ne: userId } },
      });
      if (existingUser) {
        throw new ConflictException('userName is already taken');
      }
    }
    if (body.phone) {
      body.phone = this.SecurityService.encryptOperation({
        message: body.phone,
        ENCRYPTION_KEY: this.ConfigService.getOrThrow<string>('ENCRYPTION_KEY'),
      });
    }
    const updatedUser = await this.UserRepo.findOneAndUpdate({
      filter: { _id: userId },
      update: { ...body },
      options: { new: true, projection: '-password' },
    });
    if (!updatedUser) {
      throw new NotFoundException('user does not exist');
    }
    if (updatedUser.phone) {
      updatedUser.phone = this.SecurityService.decryptOperation({
        message: updatedUser.phone,
        ENCRYPTION_KEY: this.ConfigService.getOrThrow<string>('ENCRYPTION_KEY'),
      });
    }
    if (updatedUser.logo) {
      const logoUrl = await this.S3BucketService.createPresignedGetFile({
        key: updatedUser.logo,
      });
      return { ...updatedUser.toObject(), logoUrl };
    }
    return updatedUser;
  }
  async uploadLogo(userId: string, file: Express.Multer.File) {
    if (!file) {
      throw new BadRequestException('file is required');
    }
    const user = await this.UserRepo.findOne({ filter: { _id: userId } });
    if (!user) {
      throw new NotFoundException('user does not exist');
    }
    if (user.role !== RoleEnum.EMPLOYER) {
      throw new BadRequestException('user can not be an employer');
    }
    if (user.logo) {
      await this.S3BucketService.deleteFile({ key: user.logo });
    }

    const key = await this.S3BucketService.uploadFile({ file, path: '/user' });
    const uploadedLogo = await this.UserRepo.findOneAndUpdate({
      filter: { _id: userId },
      update: { logo: key },
      options: { new: true, projection: '-password' },
    });
    return uploadedLogo;
  }
  async removeLogo(userId: string) {
    const user = await this.UserRepo.findOne({ filter: { _id: userId } });
    if (!user) {
      throw new NotFoundException('user does not exist');
    }
    if (user.role !== RoleEnum.EMPLOYER) {
      throw new BadRequestException('user can not be an employer');
    }
    if (user.logo) {
      await this.S3BucketService.deleteFile({ key: user.logo });
    }
    await this.UserRepo.findOneAndUpdate({
      filter: { _id: userId },
      update: { $unset: { logo: 1 } },
    });
    return 'logo removed successfully';
  }
  async getPublicProfile(id: string) {
    const user = await this.UserRepo.findOne({
      filter: { _id: id },
      projection: 'userName role companyName logo',
    });
    if (!user) {
      throw new NotFoundException('user does not exist');
    }
    if (user.logo) {
      const logoUrl = await this.S3BucketService.createPresignedGetFile({
        key: user.logo,
      });
      return {
        userName: user.userName,
        role: user.role,
        companyName: user.companyName,
        logo: user.logo,
        logoUrl,
      };
    }
    return {
      userName: user.userName,
      role: user.role,
      companyName: user.companyName,
      logo: user.logo,
    };
  }
}
