import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import cookieParser from 'cookie-parser';
import { NestExpressApplication } from '@nestjs/platform-express';
import { constantValues } from './common/constants';
import { ValidationPipe } from '@nestjs/common';
import { AllExceptionsFilter } from './common/filters/exception-filter';
import { join } from 'path';

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule, {
    logger: ['error', 'warn', 'log', 'debug', 'verbose']
  });
  app.enableCors({
    origin: [
      "http://localhost:5173",   // Vite frontend
      "http://localhost:3000",   // Next.js frontend
      "http://localhost:3001",   // Next.js frontend
      "*",
    ],
    methods: "GET,HEAD,PUT,PATCH,POST,DELETE",
    credentials: true,
  });

  app.useStaticAssets(join(__dirname, '..', 'uploads'), {
    prefix: '/uploads',
  })

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true, // strip unknown fields
      forbidNonWhitelisted: true, // throw error for unknown fields
      transform: true, // auto-transform types like string -> Date
      errorHttpStatusCode: 400,
    }),
  );

  app.useGlobalFilters(new AllExceptionsFilter());


  app.setGlobalPrefix(constantValues.globalPrefix);

  app.use(cookieParser());
  await app.listen(constantValues.port, "0.0.0.0");
}
bootstrap();
