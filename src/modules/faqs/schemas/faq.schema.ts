import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';

export type FaqDocument = HydratedDocument<Faq>;

@Schema({ timestamps: true })
export class Faq {
  @Prop({ required: true }) question: string;
  @Prop({ required: true }) answer: string;
  @Prop({ default: true, index: true }) active: boolean;
  @Prop({ default: 0 }) order: number;
}

export const FaqSchema = SchemaFactory.createForClass(Faq);
FaqSchema.set('toJSON', {
  virtuals: true,
  versionKey: false,
  transform: (_d, ret: any) => {
    ret.id = ret._id;
    delete ret._id;
    return ret;
  },
});
