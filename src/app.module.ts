import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AccountsModule } from './accounts/accounts.module';
import { PrismaModule } from './prisma/prisma.module';
import { KafkaModule } from './kafka/kafka.module';
import { ScheduleModule, SchedulerRegistry } from '@nestjs/schedule';
import { NotificationModule } from './notification/notification.module';
import { AccountsController } from './accounts/accounts.controller';
import { AppController } from './app.controller';
import { BusinessModule } from './business/business.module';
import { AdminModule } from './admin/admin.module';
import { OrdersModule } from './orders/orders.module';
import { ProductsModule } from './products/products.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    AccountsModule,
    PrismaModule,
    KafkaModule,
    NotificationModule,
    ScheduleModule.forRoot(),
    BusinessModule,
    AdminModule,
    OrdersModule,
    ProductsModule,
  ],
  controllers: [AppController],
  providers: [],
})
export class AppModule {}
