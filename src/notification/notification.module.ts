import { Module } from '@nestjs/common';
import { KafkaModule } from '../kafka/kafka.module';
import { NotificationConsumer } from './notification.consumer';
import { NotificationService } from './notification.service';
import { PrismaService } from '../prisma/prisma.service';

@Module({
  imports: [KafkaModule],
  controllers: [NotificationConsumer],
  providers: [NotificationService, PrismaService],
})
export class NotificationModule {}
