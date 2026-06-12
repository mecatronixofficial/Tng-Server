import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';

export type OfferDocument = HydratedDocument<Offer>;

@Schema({ timestamps: true })
export class Offer {
  @Prop({ required: true }) title: string;
  @Prop({ required: true }) description: string;
  @Prop() code?: string;
  @Prop({ default: 0, min: 0, max: 100 }) discountPercent: number;
  @Prop({ required: true }) expiresAt: Date;
  @Prop() image?: string;
  @Prop() ctaLabel?: string;
  @Prop() ctaHref?: string;
  @Prop({ default: true, index: true }) active: boolean;
  @Prop({ default: 0 }) order: number;
}

export const OfferSchema = SchemaFactory.createForClass(Offer);
OfferSchema.set('toJSON', {
  virtuals: true,
  versionKey: false,
  transform: (_d, ret: any) => {
    ret.id = ret._id;
    delete ret._id;
    return ret;
  },
});
