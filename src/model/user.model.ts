import { MongooseModule, Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';
import { ProviderEnum, RoleEnum } from '../common/enums/user.enum.js';

@Schema({ timestamps: true })
export class User {
  @Prop({ type: String, required: true, unique: true })
  userName!: string;

  @Prop({ type: String, required: true, unique: true, lowercase: true })
  email!: string;

  @Prop({
    type: String,
    select: false,
    required: function (this: User) {
      return this.provider === ProviderEnum.SYSTEM;
    },
  })
  password!: string;

  @Prop({ type: String })
  phone?: string;

  @Prop({ type: String, enum: ProviderEnum, default: ProviderEnum.SYSTEM })
  provider!: ProviderEnum;

  @Prop({
    type: String,
    unique: true,
    sparse: true,
    required: function (this: User) {
      return this.provider === ProviderEnum.GOOGLE;
    },
  })
  googleId?: string;

  @Prop({ type: String, enum: RoleEnum, default: RoleEnum.CANDIDATE })
  role!: RoleEnum;

  @Prop({ type: Boolean, default: false })
  confirmEmail!: boolean;

  @Prop({ type: Boolean, default: true })
  isActive!: boolean;

  @Prop({ type: Date })
  changeCreditTime?: Date;

  @Prop({ type: String })
  profilePicture?: string;

  @Prop({type: String})
  logo?: string;

  @Prop({type: String})
    companyName?:string
}

export type HydratedUser = HydratedDocument<User>;
export const userSchema = SchemaFactory.createForClass(User);

const UserModel = MongooseModule.forFeature([
  {
    name: User.name,
    schema: userSchema,
  },
]);
export default UserModel;
