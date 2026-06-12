import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';

export type SubcategoryDocument = HydratedDocument<Subcategory>;

@Schema({ timestamps: true })
export class Subcategory {
  @Prop({ required: true, trim: true })
  name: string;

  @Prop({ required: true, index: true, trim: true, lowercase: true })
  slug: string;

  @Prop({ required: true, index: true, trim: true, lowercase: true })
  category: string;

  @Prop({ default: 0, min: 0 })
  productCount: number;

  @Prop({ default: 0 })
  order: number;

  @Prop({ default: true })
  active: boolean;
}

export const SubcategorySchema = SchemaFactory.createForClass(Subcategory);

SubcategorySchema.index({ category: 1, slug: 1 }, { unique: true });

SubcategorySchema.set('toJSON', {
  virtuals: true,
  versionKey: false,
  transform: (_d, ret: any) => {
    ret.id = ret._id;
    delete ret._id;
    return ret;
  },
});
