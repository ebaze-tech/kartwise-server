import { Module } from '@nestjs/common';
import { ClientsModule, Transport } from '@nestjs/microservices';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { Partitioners } from 'kafkajs';
import { KafkaService } from './kafka.service';

@Module({
  imports: [
    ClientsModule.registerAsync([
      {
        name: 'KAFKA_SERVICE',
        imports: [ConfigModule],
        inject: [ConfigService],
        useFactory: (configService: ConfigService) => ({
          transport: Transport.KAFKA,
          options: {
            client: {
              clientId: 'kartwise',
              brokers: [configService.getOrThrow<string>('KAFKA_BROKER')],
              ssl: true,
              sasl: {
                mechanism: 'plain',
                username: configService.getOrThrow<string>('KAFKA_API_KEY'),
                password: configService.getOrThrow<string>('KAFKA_API_SECRET'),
              },
              connectionTimeout: 30000,
              authenticationTimeout: 30000,
              requestTimeout: 30000,
            },
            consumer: {
              groupId: 'kartwise-consumer',
            },
            producer: {
              createPartitioner: Partitioners.LegacyPartitioner,
            },
          },
        }),
      },
    ]),
  ],
  providers: [KafkaService],
  exports: [KafkaService],
})
export class KafkaModule {}
