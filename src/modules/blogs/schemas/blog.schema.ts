import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';

export type BlogDocument = HydratedDocument<Blog>;

@Schema({ timestamps: true })
export class Blog {
  @Prop({ required: true, trim: true }) title: string;
  @Prop({ required: true, unique: true, index: true, lowercase: true, trim: true })
  slug: string;
  @Prop({ required: true }) excerpt: string;
  @Prop({ required: true }) content: string;
  @Prop({ required: true }) coverImage: string;
  @Prop({ required: true }) author: string;
  @Prop() authorImage?: string;
  @Prop({ required: true, index: true }) category: string;
  @Prop({ type: [String], default: [] }) tags: string[];
  @Prop({ default: 5, min: 1 }) readTime: number;
  @Prop({ default: false, index: true }) featured: boolean;
  @Prop({ default: true, index: true }) published: boolean;
  @Prop({ default: () => new Date() }) publishedAt: Date;
}

export const BlogSchema = SchemaFactory.createForClass(Blog);
BlogSchema.index({ title: 'text', excerpt: 'text', content: 'text', tags: 'text' });
BlogSchema.set('toJSON', {
  virtuals: true,
  versionKey: false,
  transform: (_d, ret: any) => {
    ret.id = ret._id;
    delete ret._id;
    return ret;
  },
});
