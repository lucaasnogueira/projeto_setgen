import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { AppModule } from './app.module';
import { AllExceptionsFilter } from './common/filters/http-exception.filter';
import { json, urlencoded } from 'express';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  app.use(json({ limit: '50mb' }));
  app.use(urlencoded({ extended: true, limit: '50mb' }));

  app.useGlobalFilters(new AllExceptionsFilter());

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: false, // Permite que campos extras inofensivos sejam filtrados sem rejeitar a requisicao com erro de propriedade
      transform: true,
    }),
  );

  app.enableCors({
    origin: (origin, callback) => {
      // Permite requisições sem origin ou de qualquer origem autorizada
      if (!origin || /^https?:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/.test(origin)) {
        callback(null, true);
      } else {
        callback(null, true);
      }
    },
    credentials: true,
    methods: ['GET', 'HEAD', 'PUT', 'PATCH', 'POST', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'Accept', 'Origin'],
  });

  const config = new DocumentBuilder()
    .setTitle('Portal Setgen API')
    .setDescription('Sistema de Gestão de Serviços')
    .setVersion('1.0')
    .addBearerAuth()
    .build();
  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api/docs', app, document);

  const port = process.env.PORT || 3001;
  // Obrigatório 0.0.0.0 no Railway / Docker para permitir conexões externas e healthcheck
  await app.listen(port, '0.0.0.0');

  console.log(`🚀 API running on: http://0.0.0.0:${port}`);
  console.log(`📚 Swagger docs: http://0.0.0.0:${port}/api/docs`);
}
bootstrap().catch((err) => {
  console.error('Falha ao iniciar a API', err);
  process.exit(1);
});
