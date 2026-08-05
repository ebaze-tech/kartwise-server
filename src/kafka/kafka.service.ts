import {
  Inject,
  Injectable,
  OnModuleDestroy,
  OnModuleInit,
} from '@nestjs/common';
import { ClientKafka } from '@nestjs/microservices';
import { firstValueFrom } from 'rxjs';

@Injectable()
export class KafkaService implements OnModuleInit, OnModuleDestroy {
  constructor(
    @Inject('KAFKA_SERVICE') private readonly kafkaClient: ClientKafka,
  ) {}

  async onModuleInit() {
    console.log('Kafka Client Connected');
    await this.kafkaClient.connect();
  }
  async onModuleDestroy() {
    console.log('Kafka Client Disconnected');
    await this.kafkaClient.close();
  }
  async publish(topic: string, payload: unknown): Promise<void> {
    const result = await firstValueFrom(this.kafkaClient.emit(topic, payload));

    return result;
  }
}
