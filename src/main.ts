import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { Transport } from '@nestjs/microservices';
import { ValidationPipe } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

const configService = new ConfigService();

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  const configService = app.get(ConfigService);

  app.connectMicroservice({
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
        groupId: 'kartwise-notification-consumer',
      },
    },
  });

  app.setGlobalPrefix('api/v1');
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );

  await app.listen(process.env.PORT!);
}

bootstrap();
