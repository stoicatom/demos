import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString, MaxLength, MinLength } from 'class-validator';

export class CreatePostDto {
  @ApiProperty({ description: '文章标题', example: 'NestJS 企业级项目架构实战' })
  @IsString()
  @IsNotEmpty()
  @MinLength(2)
  @MaxLength(150)
  title: string;

  @ApiProperty({ description: '文章详情正文', example: '结合 TypeORM 与 Redis 的深度落地...' })
  @IsString()
  @IsNotEmpty()
  content: string;
}
