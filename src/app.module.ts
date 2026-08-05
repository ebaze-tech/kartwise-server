import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AccountsModule } from './accounts/accounts.module';
import { PrismaModule } from './prisma/prisma.module';
import { KafkaModule } from './kafka/kafka.module';
import { ScheduleModule, SchedulerRegistry } from '@nestjs/schedule';
import { NotificationModule } from './notification/notification.module';

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
  ],  
  controllers: [],
  providers: [],
})
export class AppModule {}
