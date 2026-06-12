import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';

export type TestimonialDocument = HydratedDocument<Testimonial>;

@Schema({ timestamps: true })
export class Testimonial {
  @Prop({ required: true }) name: string;
  @Prop({ required: true }) role: string;
  @Prop() company?: string;
  @Prop({ required: true }) location: string;
  @Prop({ default: 5, min: 1, max: 5 }) rating: number;
  @Prop({ required: true }) review: string;
  @Prop() image?: string;
  @Prop() productPurchased?: string;
  @Prop({ default: true, index: true }) approved: boolean;
  @Prop({ default: false, index: true }) featured: boolean;
  @Prop({ default: 0 }) order: number;
}

export const TestimonialSchema = SchemaFactory.createForClass(Testimonial);
TestimonialSchema.set('toJSON', {
  virtuals: true,
  versionKey: false,
  transform: (_d, ret: any) => {
    ret.id = ret._id;
    delete ret._id;
    return ret;
  },
});
