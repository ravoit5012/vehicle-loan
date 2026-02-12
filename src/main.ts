import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import cookieParser from 'cookie-parser';
import { NestExpressApplication } from '@nestjs/platform-express';
import { constantValues } from './common/constants';
import { ValidationPipe } from '@nestjs/common';
import { BadRequestException } from '@nestjs/common';
import { AllExceptionsFilter } from './common/filters/exception-filter';
import { join } from 'path';
import * as bodyParser from 'body-parser';


async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule, {
    logger: ['error', 'warn', 'log', 'debug', 'verbose']
  });
  // app.use(bodyParser.json({ limit: '50mb' }));
  // app.use(bodyParser.urlencoded({ limit: '50mb', extended: true }));

  app.enableCors({
    origin: [
      "http://13.63.34.69",   // Vite frontend
      "http://localhost:3000",   // Next.js frontend
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
      exceptionFactory: (errors) => {
        console.log(errors)
        return new BadRequestException(errors)
      },
    }),
  );

  app.useGlobalFilters(new AllExceptionsFilter());


  app.setGlobalPrefix(constantValues.globalPrefix);

  app.use(cookieParser());
  await app.listen(constantValues.port, "0.0.0.0");
}
bootstrap();
