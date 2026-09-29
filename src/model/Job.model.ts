import { MongooseModule, Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Types, HydratedDocument } from 'mongoose';
import {
  EmploymentTypeEnum,
  ExperienceLevelEnum,
  PeriodEnum,
  StatusEnum,
  WorkplaceTypeEnum,
} from '../common/enums/job.enum.js';
import { User } from './user.model.js';



@Schema({ timestamps: true })
export class Job {
  @Prop({ type: String, required: true })
  title!: string;
  @Prop({ type: String, required: true, unique: true })
  slug!: string;
  @Prop({ type: String, required: true })
  description!: string;
  @Prop({ type: Types.ObjectId, ref: User.name, required: true, index: true })
  employer!: Types.ObjectId;
  @Prop({ type: String, enum: EmploymentTypeEnum })
  employmentType!: EmploymentTypeEnum;
  @Prop({ type: String, enum: WorkplaceTypeEnum })
  workPlaceTypeEnum!: WorkplaceTypeEnum;
  @Prop({ type: String, enum: StatusEnum, default: StatusEnum.DRAFT })
  status!: StatusEnum;
  @Prop({
    type: {
      country: { type: String },
      city: { type: String },
    },
    _id: false,
  })
  location!: { country?: string; city?: string };
  @Prop({
    type: {
      min: { type: Number },
      max: { type: Number },
      currency: { type: String },
      period: { type: String, enum: PeriodEnum },
      isPublic: { type: Boolean },
    },
  })
  salary?: {
    min?: number;
    max?: number;
    currency?: string;
    period?: PeriodEnum;
    isPublic: boolean;
  };

  @Prop({ type: String })
  category!: string;
  @Prop({ type: String, enum: ExperienceLevelEnum })
  experienceLevel!: ExperienceLevelEnum;
  @Prop({ type: [String] })
  skills!: string[];
  @Prop({ type: Number, default: 1, min: 1 })
  openings!: number;
  @Prop({ type: Date })
  expiresAt!: Date;
  @Prop({ type: Date })
  publishedAt!: Date;
  @Prop({ type: Date })
  closedAt!: Date;
}
export const userSchema = SchemaFactory.createForClass(Job);
export const UserModel=MongooseModule.forFeature([{
    name:Job.name,
    schema:userSchema,
}])
export type HydratedJob= HydratedDocument<Job>
