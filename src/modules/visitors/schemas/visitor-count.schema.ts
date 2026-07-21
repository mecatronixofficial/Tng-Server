import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';

export type VisitorCountDocument = HydratedDocument<VisitorCount>;

@Schema({ timestamps: true })
export class VisitorCount {
  @Prop({ required: true, unique: true, default: 'website' })
  key: string;

  @Prop({ required: true, default: 0, min: 0 })
  count: number;
}

export const VisitorCountSchema = SchemaFactory.createForClass(VisitorCount);
