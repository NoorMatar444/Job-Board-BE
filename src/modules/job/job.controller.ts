import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { JobService } from './job.service.js';
import {
  CreateJobDto,
  ListJobsQueryDto,
  ListMyJobsQueryDto,
  UpdateJobDto,
} from './job.dto.js';
import { AuthGuard } from '../../common/Guards/authentication.guard.js';
import { RolesGuard } from '../../common/Guards/authorization.guard.js';
import { Roles } from '../../common/decorators/roles.decorator.js';
import { currentUser } from '../../common/decorators/user.decorator.js';
import { RoleEnum } from '../../common/enums/user.enum.js';
import type { HydratedUser } from '../../model/user.model.js';

@Controller('jobs')
export class JobController {
  constructor(private readonly jobService: JobService) {}

  @Post()
  @UseGuards(AuthGuard, RolesGuard)
  @Roles(RoleEnum.EMPLOYER)
  createJob(@currentUser() user: HydratedUser, @Body() body: CreateJobDto) {
    return this.jobService.createJob(user._id.toString(), body);
  }

  @Get('me')
  @UseGuards(AuthGuard, RolesGuard)
  @Roles(RoleEnum.EMPLOYER)
  listMyJobs(
    @currentUser() user: HydratedUser,
    @Query() query: ListMyJobsQueryDto,
  ) {
    return this.jobService.listMyJobs(user._id.toString(), query);
  }

  @Get()
  listJobs(@Query() query: ListJobsQueryDto) {
    return this.jobService.listJobs(query);
  }

  @Patch(':id')
  @UseGuards(AuthGuard, RolesGuard)
  @Roles(RoleEnum.EMPLOYER)
  updateJob(
    @currentUser() user: HydratedUser,
    @Param('id') id: string,
    @Body() body: UpdateJobDto,
  ) {
    return this.jobService.updateJob(user._id.toString(), id, body);
  }

  @Patch(':id/publish')
  @UseGuards(AuthGuard, RolesGuard)
  @Roles(RoleEnum.EMPLOYER)
  publishJob(@currentUser() user: HydratedUser, @Param('id') id: string) {
    return this.jobService.publishJob(user._id.toString(), id);
  }

  @Patch(':id/close')
  @UseGuards(AuthGuard, RolesGuard)
  @Roles(RoleEnum.EMPLOYER)
  closeJob(@currentUser() user: HydratedUser, @Param('id') id: string) {
    return this.jobService.closeJob(user._id.toString(), id);
  }

  @Patch(':id/archive')
  @UseGuards(AuthGuard, RolesGuard)
  @Roles(RoleEnum.EMPLOYER)
  archiveJob(@currentUser() user: HydratedUser, @Param('id') id: string) {
    return this.jobService.archiveJob(user._id.toString(), id);
  }

  @Get(':slug')
  getJob(@Param('slug') slug: string) {
    return this.jobService.getJob(slug);
  }
}
