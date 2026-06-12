import { Module, OnModuleInit, Logger } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { MongooseModule } from '@nestjs/mongoose';
import { ThrottlerModule, ThrottlerGuard } from '@nestjs/throttler';
import { APP_GUARD } from '@nestjs/core';

import { AuthModule } from './modules/auth/auth.module';
import { UsersModule } from './modules/users/users.module';
import { ProductsModule } from './modules/products/products.module';
import { CategoriesModule } from './modules/categories/categories.module';
import { BlogsModule } from './modules/blogs/blogs.module';
import { BannersModule } from './modules/banners/banners.module';
import { OffersModule } from './modules/offers/offers.module';
import { TestimonialsModule } from './modules/testimonials/testimonials.module';
import { OrdersModule } from './modules/orders/orders.module';
import { UploadsModule } from './modules/uploads/uploads.module';
import { StatsModule } from './modules/stats/stats.module';
import { FaqsModule } from './modules/faqs/faqs.module';
import { UsersService } from './modules/users/users.service';
import { SubcategoriesModule } from './modules/subcategories/subcategories.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true, envFilePath: '.env' }),

    MongooseModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (cfg: ConfigService) => ({
        uri: cfg.get<string>('MONGODB_URI'),
      }),
    }),

    // Rate limit: 100 requests / minute per IP
    ThrottlerModule.forRoot([{ ttl: 60_000, limit: 100 }]),

    AuthModule,
    UsersModule,
    ProductsModule,
    CategoriesModule,
    BlogsModule,
    BannersModule,
    OffersModule,
    TestimonialsModule,
    OrdersModule,
    UploadsModule,
    StatsModule,
    FaqsModule,
    SubcategoriesModule,
  ],
  providers: [{ provide: APP_GUARD, useClass: ThrottlerGuard }],
})
export class AppModule implements OnModuleInit {
  private readonly logger = new Logger(AppModule.name);

  constructor(private readonly usersService: UsersService) {}

  // Create initial admin user on first boot if none exists
  async onModuleInit() {
    try {
      await this.usersService.ensureInitialAdmin();
    } catch (err) {
      this.logger.warn(
        `Could not ensure initial admin: ${(err as Error).message}`,
      );
    }
  }
}
