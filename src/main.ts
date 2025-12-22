import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import cookieParser from 'cookie-parser';
import { NestExpressApplication } from '@nestjs/platform-express';

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule, {
    logger: ['error', 'warn', 'log', 'debug', 'verbose']
  });
  app.enableCors({
      origin: [
        "http://localhost:5173",   // Vite frontend
        "http://localhost:3000",   // Next.js frontend
      ],
      methods: "GET,HEAD,PUT,PATCH,POST,DELETE",
      credentials: true,
  });


  app.setGlobalPrefix('/api/');

  const port = process.env.PORT || 3000;

  app.use(cookieParser());
  await app.listen(port);
}
bootstrap();
