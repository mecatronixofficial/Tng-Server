import {
  ApiProperty,
  ApiPropertyOptional,
  ApiTags,
  ApiBearerAuth,
  PartialType,
} from '@nestjs/swagger';
import {
  Body,
  Controller,
  Delete,
  Get,
  Injectable,
  Module,
  NotFoundException,
  Param,
  Patch,
  Post,
  Query,
  Logger,
  UseGuards,
} from '@nestjs/common';
import { InjectModel, MongooseModule } from '@nestjs/mongoose';
import { FilterQuery, Model } from 'mongoose';
import {
  IsEmail,
  IsEnum,
  IsInt,
  IsOptional,
  IsString,
  Min,
  MinLength,
} from 'class-validator';

import {
  Order,
  OrderDocument,
  OrderSchema,
  OrderSource,
  OrderStatus,
} from './schemas/order.schema';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { Role } from '../../common/enums/role.enum';
import {
  PaginationQueryDto,
  buildSort,
} from '../../common/dto/pagination.dto';
import { escapeRegex } from '../../common/utils/slug';
import { AuthModule } from '../auth/auth.module';
import { MailService } from '../auth/mail.service';

class CreateOrderDto {
  @ApiProperty() @IsString() @MinLength(2) customerName!: string;
  @ApiProperty() @IsString() @MinLength(6) phone!: string;
  @ApiPropertyOptional() @IsOptional() @IsEmail() email?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() productSlug?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() productName?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() color?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() size?: string;
  @ApiPropertyOptional({ default: 1 }) @IsOptional() @IsInt() @Min(1) quantity?: number;
  @ApiProperty() @IsString() @MinLength(5) message!: string;
  @ApiPropertyOptional({ enum: OrderSource, default: OrderSource.CONTACT_FORM })
  @IsOptional() @IsEnum(OrderSource) source?: OrderSource;
}

class UpdateOrderDto extends PartialType(CreateOrderDto) {
  @ApiPropertyOptional({ enum: OrderStatus })
  @IsOptional() @IsEnum(OrderStatus) status?: OrderStatus;
  @ApiPropertyOptional() @IsOptional() @IsString() adminNotes?: string;
}

class OrderQueryDto extends PaginationQueryDto {
  @ApiPropertyOptional({ enum: OrderStatus })
  @IsOptional() @IsEnum(OrderStatus) status?: OrderStatus;
  @ApiPropertyOptional({ enum: OrderSource })
  @IsOptional() @IsEnum(OrderSource) source?: OrderSource;
}

@Injectable()
class OrdersService {
  private readonly logger = new Logger(OrdersService.name);

  constructor(
    @InjectModel(Order.name) private readonly model: Model<OrderDocument>,
    private readonly mail: MailService,
  ) {}

  async create(dto: CreateOrderDto) {
    const order = await this.model.create(dto);

    this.mail.sendOrderEnquiry({
      customerName: order.customerName,
      phone: order.phone,
      email: order.email,
      productName: order.productName,
      productSlug: order.productSlug,
      color: order.color,
      size: order.size,
      quantity: order.quantity,
      message: order.message,
      source: order.source,
    }).catch((error) => {
      this.logger.error(
        `Order ${order.id} saved, but enquiry email failed: ${error?.message || error}`,
      );
    });

    return order;
  }

  async list(q: OrderQueryDto) {
    const f: FilterQuery<OrderDocument> = {};
    if (q.status) f.status = q.status;
    if (q.source) f.source = q.source;
    if (q.search) {
      const re = new RegExp(escapeRegex(q.search.trim()), 'i');
      f.$or = [
        { customerName: re },
        { phone: re },
        { email: re },
        { productName: re },
        { message: re },
      ];
    }
    const page = q.page || 1;
    const limit = q.limit || 30;
    const skip = (page - 1) * limit;
    const sort = buildSort(q.sort || '-createdAt');
    const [data, total] = await Promise.all([
      this.model.find(f).sort(sort).skip(skip).limit(limit),
      this.model.countDocuments(f),
    ]);
    return { data, meta: { total, page, limit, pages: Math.max(1, Math.ceil(total / limit)) } };
  }

  async findById(id: string) {
    const o = await this.model.findById(id);
    if (!o) throw new NotFoundException('Order not found');
    return o;
  }

  async update(id: string, dto: UpdateOrderDto) {
    const o = await this.model.findByIdAndUpdate(id, dto, { new: true });
    if (!o) throw new NotFoundException('Order not found');
    return o;
  }

  async remove(id: string) {
    const o = await this.model.findByIdAndDelete(id);
    if (!o) throw new NotFoundException('Order not found');
    return { deleted: true, id };
  }
}

// Public: create only. Anyone can submit an order/enquiry — but reading is admin-only.
@ApiTags('public')
@Controller('orders')
class OrdersPublicController {
  constructor(private readonly service: OrdersService) {}
  @Post() submit(@Body() dto: CreateOrderDto) { return this.service.create(dto); }
}

@ApiTags('admin')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(Role.ADMIN, Role.EDITOR)
@Controller('admin/orders')
class OrdersAdminController {
  constructor(private readonly service: OrdersService) {}
  @Get() list(@Query() q: OrderQueryDto) { return this.service.list(q); }
  @Get(':id') byId(@Param('id') id: string) { return this.service.findById(id); }
  @Patch(':id') update(@Param('id') id: string, @Body() dto: UpdateOrderDto) { return this.service.update(id, dto); }
  @Delete(':id') @Roles(Role.ADMIN) remove(@Param('id') id: string) { return this.service.remove(id); }
}

@Module({
  imports: [
    AuthModule,
    MongooseModule.forFeature([{ name: Order.name, schema: OrderSchema }]),
  ],
  controllers: [OrdersPublicController, OrdersAdminController],
  providers: [OrdersService],
  exports: [OrdersService, MongooseModule],
})
export class OrdersModule {}
