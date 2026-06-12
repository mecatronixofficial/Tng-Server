import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';
import { Role } from '../../../common/enums/role.enum';

export type UserDocument = HydratedDocument<User>;

@Schema({ timestamps: true })
export class User {
  @Prop({ required: true, unique: true, lowercase: true, trim: true })
  email: string;

  @Prop({ required: true })
  passwordHash: string;

  @Prop({ required: true })
  name: string;

  @Prop({ enum: Role, default: Role.USER, index: true })
  role: Role;

  @Prop({ default: true })
  active: boolean;

  @Prop()
  lastLoginAt?: Date;

  @Prop()
  resetOtp?: string;

  @Prop()
  resetOtpExpiry?: Date;
}

export const UserSchema = SchemaFactory.createForClass(User);

// Don't leak passwordHash via JSON
UserSchema.set('toJSON', {
  versionKey: false,
  transform: (_doc, ret: any) => {
    delete ret.passwordHash;
    return ret;
  },
});
