import { Module } from '@nestjs/common';
import { ClientsModule, Transport } from '@nestjs/microservices';
import { Partitioners } from 'kafkajs';
import { KafkaService } from './kafka.service';
import { ConfigService } from '@nestjs/config';

const configService = new ConfigService();
@Module({
  imports: [
    ClientsModule.register([
      {
        name: 'KAFKA_SERVICE',
        transport: Transport.KAFKA,
        options: {
          client: {
            clientId: 'kartwise',
            brokers: [configService.get<string>('KAFKA_BROKER')!],
            ssl: true,
            sasl: {
              mechanism: 'plain',
              username: configService.get<string>('KAFKA_API_KEY')!,
              password: configService.get<string>('KAFKA_API_SECRET')!,
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
      },
    ]),
  ],
  providers: [KafkaService],
  exports: [KafkaService, ClientsModule],
})
export class KafkaModule {}
