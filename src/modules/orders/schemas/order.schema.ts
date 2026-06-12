import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';

export type OrderDocument = HydratedDocument<Order>;

export enum OrderStatus {
  NEW = 'new',
  CONTACTED = 'contacted',
  QUOTED = 'quoted',
  CONFIRMED = 'confirmed',
  DESPATCHED = 'despatched',
  DELIVERED = 'delivered',
  CANCELLED = 'cancelled',
}

export enum OrderSource {
  CONTACT_FORM = 'contact_form',
  PRODUCT_ENQUIRY = 'product_enquiry',
  WHATSAPP = 'whatsapp',
  WHOLESALE = 'wholesale',
}

@Schema({ timestamps: true })
export class Order {
  @Prop({ required: true }) customerName: string;
  @Prop({ required: true, index: true }) phone: string;
  @Prop({ index: true }) email?: string;

  @Prop() productSlug?: string;
  @Prop() productName?: string;
  @Prop() color?: string;
  @Prop() size?: string;
  @Prop({ default: 1, min: 1 }) quantity: number;

  @Prop({ required: true }) message: string;

  @Prop({ enum: OrderSource, default: OrderSource.CONTACT_FORM, index: true })
  source: OrderSource;

  @Prop({ enum: OrderStatus, default: OrderStatus.NEW, index: true })
  status: OrderStatus;

  @Prop() adminNotes?: string;
}

export const OrderSchema = SchemaFactory.createForClass(Order);
OrderSchema.set('toJSON', {
  virtuals: true,
  versionKey: false,
  transform: (_d, ret: any) => {
    ret.id = ret._id;
    delete ret._id;
    return ret;
  },
});
