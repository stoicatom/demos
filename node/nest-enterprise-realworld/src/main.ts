import { NestFactory } from '@nestjs/core';
import { ValidationPipe, Logger } from '@nestjs/common';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { NestExpressApplication } from '@nestjs/platform-express';
import { join } from 'path';
import { AppModule } from './app.module';

async function bootstrap() {
  const logger = new Logger('Bootstrap');
  const app = await NestFactory.create<NestExpressApplication>(AppModule);

  // 跨域资源共享配置
  app.enableCors({
    origin: '*',
    credentials: true,
  });

  // 全局 API 路由前缀
  app.setGlobalPrefix('api/v1');

  // 全局参数强类型转换与 DTO 白名单校验
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
      forbidNonWhitelisted: false,
      transformOptions: {
        enableImplicitConversion: true,
      },
    }),
  );

  // 挂载静态联调客户端页面 (方便直接访问调试)
  app.useStaticAssets(join(__dirname, '..', 'client'), {
    prefix: '/client/',
  });

  // 根路由自动重定向到前端联调客户端
  app.getHttpAdapter().get('/', (req: any, res: any) => {
    res.redirect('/client/index.html');
  });

  // Swagger OpenAPI 3.0 接口文档配置
  const swaggerConfig = new DocumentBuilder()
    .setTitle('NestJS 企业级核心平台 API')
    .setDescription('包含认证鉴权、RBAC 角色权限、TypeORM 业务与 Redis 缓存的生产级后端 API')
    .setVersion('1.0.0')
    .addBearerAuth()
    .build();

  const document = SwaggerModule.createDocument(app, swaggerConfig);
  SwaggerModule.setup('docs', app, document);

  const port = process.env.PORT || 3000;
  await app.listen(port);

  logger.log(`🚀 应用服务已成功启动: http://localhost:${port}`);
  logger.log(`📚 Swagger API 文档地址: http://localhost:${port}/docs`);
  logger.log(`🖥️ 前端全栈联调控制台: http://localhost:${port}/client/index.html`);
}

bootstrap();
