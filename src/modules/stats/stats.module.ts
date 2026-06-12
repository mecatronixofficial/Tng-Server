import { Controller, Get, Injectable, Module, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';

import { Product, ProductDocument } from '../products/schemas/product.schema';
import { Category, CategoryDocument } from '../categories/schemas/category.schema';
import { Blog, BlogDocument } from '../blogs/schemas/blog.schema';
import { Order, OrderDocument, OrderStatus } from '../orders/schemas/order.schema';
import { Testimonial, TestimonialDocument } from '../testimonials/schemas/testimonial.schema';

import { ProductsModule } from '../products/products.module';
import { CategoriesModule } from '../categories/categories.module';
import { BlogsModule } from '../blogs/blogs.module';
import { OrdersModule } from '../orders/orders.module';
import { TestimonialsModule } from '../testimonials/testimonials.module';

import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { Role } from '../../common/enums/role.enum';

@Injectable()
class StatsService {
  constructor(
    @InjectModel(Product.name) private products: Model<ProductDocument>,
    @InjectModel(Category.name) private categories: Model<CategoryDocument>,
    @InjectModel(Blog.name) private blogs: Model<BlogDocument>,
    @InjectModel(Order.name) private orders: Model<OrderDocument>,
    @InjectModel(Testimonial.name) private testimonials: Model<TestimonialDocument>,
  ) {}

  async dashboard() {
    const sevenDaysAgo = new Date(Date.now() - 7 * 86400_000);

    const [
      productsTotal,
      productsActive,
      productsOutOfStock,
      categoriesTotal,
      blogsTotal,
      blogsPublished,
      ordersTotal,
      ordersNew,
      ordersThisWeek,
      ordersByStatus,
      testimonialsTotal,
      recentOrders,
    ] = await Promise.all([
      this.products.countDocuments(),
      this.products.countDocuments({ active: true }),
      this.products.countDocuments({ stock: 0 }),
      this.categories.countDocuments(),
      this.blogs.countDocuments(),
      this.blogs.countDocuments({ published: true }),
      this.orders.countDocuments(),
      this.orders.countDocuments({ status: OrderStatus.NEW }),
      this.orders.countDocuments({ createdAt: { $gte: sevenDaysAgo } }),
      this.orders.aggregate([
        { $group: { _id: '$status', count: { $sum: 1 } } },
      ]),
      this.testimonials.countDocuments(),
      this.orders.find().sort({ createdAt: -1 }).limit(5),
    ]);

    return {
      products: {
        total: productsTotal,
        active: productsActive,
        outOfStock: productsOutOfStock,
      },
      categories: { total: categoriesTotal },
      blogs: { total: blogsTotal, published: blogsPublished },
      orders: {
        total: ordersTotal,
        new: ordersNew,
        last7Days: ordersThisWeek,
        byStatus: Object.fromEntries(
          ordersByStatus.map((s: any) => [s._id, s.count]),
        ),
      },
      testimonials: { total: testimonialsTotal },
      recentOrders,
    };
  }
}

@ApiTags('admin')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(Role.ADMIN, Role.EDITOR)
@Controller('admin/stats')
class StatsController {
  constructor(private readonly service: StatsService) {}
  @Get('dashboard') dashboard() { return this.service.dashboard(); }
}

@Module({
  imports: [
    ProductsModule,
    CategoriesModule,
    BlogsModule,
    OrdersModule,
    TestimonialsModule,
  ],
  controllers: [StatsController],
  providers: [StatsService],
})
export class StatsModule {}
