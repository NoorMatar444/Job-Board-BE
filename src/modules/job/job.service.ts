import {
  ForbiddenException,
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { CreateJobDto, ListJobsQueryDto, ListMyJobsQueryDto, UpdateJobDto } from './job.dto.js';
import { JobRepo } from '../../repo/job.repo.js';
import { UserRepo } from '../../repo/user.repo.js';
import { S3BucketService } from '../../services/s3Bucket.service.js';
import { StatusEnum } from '../../common/enums/job.enum.js';
import { HydratedJob, Job } from '../../model/Job.model.js';
import { QueryFilter, Types } from 'mongoose';

@Injectable()
export class JobService {
  constructor(
    private readonly JobRepo: JobRepo,
    private readonly UserRepo: UserRepo,
    private readonly S3BucketService: S3BucketService,
  ) {}
  async createJob(employerId: string, body: CreateJobDto) {
    const slug = await this.generateSlug(body.title);
    const job = await this.JobRepo.create({
      data: {
        ...body,
        slug,
        employer: new Types.ObjectId(employerId),
        status: StatusEnum.DRAFT,
      },
    });
    return job;
  }
  async updateJob(employerId: string, jobId: string, body: UpdateJobDto) {
    const job = await this.getOwnedJob(employerId, jobId);
    if (job.status === StatusEnum.ARCHIVED || job.status === StatusEnum.CLOSED) {
      throw new UnauthorizedException('can not update archived or closed jobs');
    }
    if (job.status === StatusEnum.DRAFT || job.status === StatusEnum.PUBLISHED) {
      const update: UpdateJobDto & { slug?: string } = { ...body };
      if (body.title) {
        update.slug = await this.generateSlug(body.title, job._id.toString());
      }
      const updatedJob = await this.JobRepo.findOneAndUpdate({
        filter: { _id: jobId, employer: new Types.ObjectId(employerId) },
        update,
      });
      return updatedJob;
    }
  }
  async publishJob(employerId: string, jobId: string) {
    const job = await this.getOwnedJob(employerId, jobId);
    if (job.status === StatusEnum.DRAFT) {
      await this.JobRepo.findOneAndUpdate({
        filter: { _id: jobId, employer: new Types.ObjectId(employerId) },
        update: {
          status: StatusEnum.PUBLISHED,
          publishedAt: new Date(),
        },
      });
    } else {
      throw new ForbiddenException('the status has to be draft');
    }
  }
  async closeJob(employerId: string, jobId: string) {
    const job = await this.getOwnedJob(employerId, jobId);
    if (job.status === StatusEnum.PUBLISHED) {
      await this.JobRepo.findOneAndUpdate({
        filter: { _id: jobId, employer: new Types.ObjectId(employerId) },
        update: { status: StatusEnum.CLOSED, closedAt: new Date() },
      });
    }
  }
  async archiveJob(employerId: string, jobId: string) {
    const job = await this.getOwnedJob(employerId, jobId);
    if (job.status === StatusEnum.DRAFT || job.status === StatusEnum.CLOSED) {
      await this.JobRepo.findOneAndUpdate({
        filter: { _id: jobId, employer: new Types.ObjectId(employerId) },
        update: { status: StatusEnum.ARCHIVED },
      });
    }
  }
  async listMyJobs(employerId: string, query: ListMyJobsQueryDto = {}) {
    const filter: QueryFilter<Job> = {
      employer: new Types.ObjectId(employerId),
    };
    if (query.status) {
      filter.status = query.status;
    }
    return this.JobRepo.findAll({
      filter,
      options: { sort: { createdAt: -1 } },
    });
  }
  async listJobs(query: ListJobsQueryDto = {}) {
    const filter: QueryFilter<Job> = {
      status: StatusEnum.PUBLISHED,
      // Keep jobs with no expiry, or an expiry still in the future.
      $or: [
        { expiresAt: { $exists: false } },
        { expiresAt: null },
        { expiresAt: { $gt: new Date() } },
      ],
    };
    if (query.keyword?.trim()) {
      // Case-insensitive substring match. escapeRegex treats the input as
      // plain text so characters like + or . are not regex operators.
      const keyword = new RegExp(this.escapeRegex(query.keyword.trim()), 'i');
      // Nest this $or in $and so it does not overwrite the expiry $or above.
      filter.$and = [{ $or: [{ title: keyword }, { description: keyword }] }];
    }
    if (query.employmentType) {
      filter.employmentType = query.employmentType;
    }
    if (query.workPlaceTypeEnum) {
      filter.workPlaceTypeEnum = query.workPlaceTypeEnum;
    }
    if (query.experienceLevel) {
      filter.experienceLevel = query.experienceLevel;
    }
    if (query.category?.trim()) {
      filter.category = this.exactRegex(query.category);
    }
    if (query.city?.trim()) {
      filter['location.city'] = this.exactRegex(query.city);
    }
    if (query.country?.trim()) {
      filter['location.country'] = this.exactRegex(query.country);
    }
    if (query.skills?.trim()) {
      const skills = query.skills
        .split(',')
        .map((skill) => skill.trim())
        .filter(Boolean)
        .map((skill) => this.exactRegex(skill));
      if (skills.length) {
        filter.skills = { $in: skills };
      }
    }
    const jobs = await this.JobRepo.findAll({
      filter,
      options: { sort: { publishedAt: -1 } },
    });
    return jobs.map((job: HydratedJob) => {
      const plain = job.toObject();
      if (plain.salary && plain.salary.isPublic === false) {
        plain.salary = { isPublic: false };
      }
      return plain;
    });
  }
  async getJob(slug: string) {
    const job = await this.JobRepo.findOne({
      filter: {
        slug,
        status: StatusEnum.PUBLISHED,
        $or: [
          { expiresAt: { $exists: false } },
          { expiresAt: null },
          { expiresAt: { $gt: new Date() } },
        ],
      },
    });
    if (!job) {
      throw new NotFoundException('job does not exist');
    }
    const employer = await this.UserRepo.findOne({
      filter: { _id: job.employer },
      projection: 'companyName logo',
    });
    const plain = job.toObject();
    if (plain.salary && plain.salary.isPublic === false) {
      plain.salary = { isPublic: false };
    }
    if (employer?.logo) {
      const logoUrl = await this.S3BucketService.createPresignedGetFile({
        key: employer.logo,
      });
      return {
        ...plain,
        companyName: employer.companyName,
        logo: employer.logo,
        logoUrl,
      };
    }
    return {
      ...plain,
      companyName: employer?.companyName,
      logo: employer?.logo,
    };
  }
  private async getOwnedJob(employerId: string, jobId: string) {
    if (!Types.ObjectId.isValid(jobId) || !Types.ObjectId.isValid(employerId)) {
      throw new NotFoundException('job does not exist');
    }
    const job = await this.JobRepo.findOne({
      filter: {
        _id: new Types.ObjectId(jobId),
        employer: new Types.ObjectId(employerId),
      },
    });
    if (!job) {
      throw new NotFoundException('job does not exist');
    }
    return job;
  }
  private async generateSlug(title: string, ignoreJobId?: string) {
    const base =
      title
        .toLowerCase()
        .trim()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-+|-+$/g, '')
        .slice(0, 80) || 'job';
    let slug = base;
    let suffix = 0;
    while (true) {
      const existing = await this.JobRepo.findOne({ filter: { slug } });
      if (!existing || existing._id.toString() === ignoreJobId) {
        return slug;
      }
      suffix += 1;
      slug = `${base}-${suffix}`;
    }
  }
  private exactRegex(value: string) {
    return new RegExp(`^${this.escapeRegex(value.trim())}$`, 'i');
  }
  private escapeRegex(value: string) {
    return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  }
}
