import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { UserService } from './user.service.js';
import { UpdateProfileDto } from './user.dto.js';
import { AuthGuard } from '../../common/Guards/authentication.guard.js';
import { RolesGuard } from '../../common/Guards/authorization.guard.js';
import { Roles } from '../../common/decorators/roles.decorator.js';
import { currentUser } from '../../common/decorators/user.decorator.js';
import { RoleEnum } from '../../common/enums/user.enum.js';
import type { HydratedUser } from '../../model/user.model.js';
import {
  allowedFileFormats,
  multerOptions,
} from '../../common/multer/multer.config.js';
import { StorageApproachEnum } from '../../common/enums/multer.enum.js';

@Controller('users')
export class UserController {
  constructor(private readonly userService: UserService) {}

  @Get('me')
  @UseGuards(AuthGuard)
  getMyProfile(@currentUser() user: HydratedUser) {
    return this.userService.getMyProfile(user._id.toString());
  }

  @Patch('me')
  @UseGuards(AuthGuard)
  updateProfile(
    @currentUser() user: HydratedUser,
    @Body() body: UpdateProfileDto,
  ) {
    return this.userService.updateProfile(user._id.toString(), body);
  }

  @Post('me/logo')
  @UseGuards(AuthGuard, RolesGuard)
  @Roles(RoleEnum.EMPLOYER)
  @UseInterceptors(
    FileInterceptor(
      'file',
      multerOptions({
        allowedFormat: allowedFileFormats.image,
        storageApproach: StorageApproachEnum.MEMORY,
        fileSize: 2,
      }),
    ),
  )
  uploadLogo(
    @currentUser() user: HydratedUser,
    @UploadedFile() file: Express.Multer.File,
  ) {
    return this.userService.uploadLogo(user._id.toString(), file);
  }

  @Delete('me/logo')
  @UseGuards(AuthGuard, RolesGuard)
  @Roles(RoleEnum.EMPLOYER)
  removeLogo(@currentUser() user: HydratedUser) {
    return this.userService.removeLogo(user._id.toString());
  }

  @Get(':id')
  getPublicProfile(@Param('id') id: string) {
    return this.userService.getPublicProfile(id);
  }
}
