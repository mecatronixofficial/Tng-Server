import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';

export type BannerDocument = HydratedDocument<Banner>;

export enum BannerKind {
  HERO = 'hero',
  OPENING_CARD = 'opening_card',
}

@Schema({ timestamps: true })
export class Banner {
  @Prop({ required: true, enum: BannerKind, index: true })
  kind: BannerKind;

  @Prop({ required: true }) title: string;
  @Prop() highlight?: string;
  @Prop() subtitle?: string;
  @Prop() eyebrow?: string;
  @Prop({ required: true }) description: string;
  @Prop({ required: true }) image: string;
  @Prop({ required: true }) ctaLabel: string;
  @Prop({ required: true }) ctaHref: string;
  @Prop() secondaryLabel?: string;
  @Prop() secondaryHref?: string;
  @Prop() badge?: string;
  @Prop() expiresAt?: Date;

  @Prop({ default: 0 }) order: number;
  @Prop({ default: true, index: true }) active: boolean;
}

export const BannerSchema = SchemaFactory.createForClass(Banner);
BannerSchema.set('toJSON', {
  virtuals: true,
  versionKey: false,
  transform: (_d, ret: any) => {
    ret.id = ret._id;
    delete ret._id;
    return ret;
  },
});
