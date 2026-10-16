import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { APP_GUARD, APP_INTERCEPTOR, APP_FILTER } from '@nestjs/core';

import configuration from './config/configuration';
import { UserEntity } from './modules/users/entities/user.entity';
import { PostEntity } from './modules/posts/entities/post.entity';

import { RedisModule } from './modules/redis/redis.module';
import { UsersModule } from './modules/users/users.module';
import { AuthModule } from './modules/auth/auth.module';
import { PostsModule } from './modules/posts/posts.module';

import { JwtAuthGuard } from './common/guards/jwt-auth.guard';
import { RolesGuard } from './common/guards/roles.guard';
import { TransformInterceptor } from './common/interceptors/transform.interceptor';
import { LoggingInterceptor } from './common/interceptors/logging.interceptor';
import { AllExceptionsFilter } from './common/filters/all-exceptions.filter';

@Module({
  imports: [
    // 全局环境配置加载
    ConfigModule.forRoot({
      isGlobal: true,
      load: [configuration],
    }),

    // 动态异步加载 TypeORM 数据库连接
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => {
        const dbConfig = configService.get('database');
        return {
          type: 'mysql',
          host: dbConfig.host,
          port: dbConfig.port,
          username: dbConfig.username,
          password: dbConfig.password,
          database: dbConfig.database,
          entities: [UserEntity, PostEntity],
          synchronize: process.env.NODE_ENV !== 'production', // 仅开发环境自动同步
          logging: process.env.NODE_ENV === 'development',
        };
      },
    }),

    RedisModule,
    UsersModule,
    AuthModule,
    PostsModule,
  ],
  providers: [
    // 全局异常过滤器
    {
      provide: APP_FILTER,
      useClass: AllExceptionsFilter,
    },
    // 全局统一响应转换拦截器
    {
      provide: APP_INTERCEPTOR,
      useClass: TransformInterceptor,
    },
    // 全局网络日志拦截器
    {
      provide: APP_INTERCEPTOR,
      useClass: LoggingInterceptor,
    },
    // 全局默认开启 JWT 鉴权守卫 (通过 @Public() 免除)
    {
      provide: APP_GUARD,
      useClass: JwtAuthGuard,
    },
    // 全局 RBAC 角色鉴权守卫
    {
      provide: APP_GUARD,
      useClass: RolesGuard,
    },
  ],
})
export class AppModule {}
