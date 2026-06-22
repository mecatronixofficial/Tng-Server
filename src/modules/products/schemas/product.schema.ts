import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';

export type ProductDocument = HydratedDocument<Product>;

@Schema({ _id: false })
class SpecItem {
  @Prop({ required: true }) label: string;
  @Prop({ required: true }) value: string;
}
const SpecItemSchema = SchemaFactory.createForClass(SpecItem);

@Schema({ timestamps: true })
export class Product {
  @Prop({ required: true, trim: true })
  name: string;

  @Prop({ required: true, unique: true, index: true, lowercase: true, trim: true })
  slug: string;

  @Prop({ required: true, index: true })
  category: string; // category slug

  @Prop({ index: true })
  subcategory?: string;

  @Prop({ type: [String], default: [] })
  images: string[];

  @Prop({ required: true })
  description: string;

  @Prop({ required: true })
  clothType: string;

  @Prop({ type: [String], default: [] })
  colors: string[];

  @Prop({ type: [String], default: [] })
  sizes: string[];

  @Prop({ default: 0, min: 0 })
  stock: number;

  @Prop({ required: true, min: 0 })
  offerPrice: number;

  @Prop({ required: true, min: 0 })
  originalPrice: number;

  @Prop({ required: true })
  material: string;

  @Prop()
  gsm?: string;

  @Prop()
  pattern?: string;

  @Prop({ default: true })
  washable: boolean;

  @Prop({ default: false, index: true })
  featured: boolean;

  @Prop({ default: false, index: true })
  newArrival: boolean;

  @Prop({ default: 4.5, min: 0, max: 5 })
  rating: number;

  @Prop({ default: 0, min: 0 })
  reviews: number;

  @Prop({ type: [String], default: [], index: true })
  tags: string[];

  @Prop({ type: [SpecItemSchema], default: [] })
  specifications: { label: string; value: string }[];

  @Prop({ default: true })
  retailEnabled: boolean;

  @Prop({ default: true })
  wholesaleEnabled: boolean;

  @Prop({ default: 12, min: 1 })
  bundleSize: number;

  @Prop({ default: false })
  allowMixedColors: boolean;

  @Prop({ default: false })
  allowMixedSizes: boolean;

  @Prop({ default: true })
  active: boolean;
}

export const ProductSchema = SchemaFactory.createForClass(Product);

// Compound text index for search
ProductSchema.index({ name: 'text', description: 'text', tags: 'text' });

ProductSchema.set('toJSON', {
  virtuals: true,
  versionKey: false,
  transform: (_d, ret: any) => {
    ret.id = ret._id;
    delete ret._id;
    return ret;
  },
});
