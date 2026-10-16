import { Controller, Post, Get, Delete, Body, Param, Query, ParseIntPipe, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { PostsService } from './posts.service';
import { CreatePostDto } from './dto/create-post.dto';
import { QueryPostDto } from './dto/query-post.dto';
import { Public } from '../../common/decorators/public.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';

@ApiTags('文章业务 (Posts)')
@Controller('posts')
export class PostsController {
  constructor(private readonly postsService: PostsService) {}

  @Post()
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: '创建新文章 (需要登录鉴权与事务处理)' })
  async create(@CurrentUser('id') authorId: number, @Body() dto: CreatePostDto) {
    return this.postsService.create(authorId, dto);
  }

  @Public()
  @Get()
  @ApiOperation({ summary: '获取文章列表 (支持分页与 Redis 缓存)' })
  async findAll(@Query() query: QueryPostDto) {
    return this.postsService.findAll(query);
  }

  @Public()
  @Get(':id')
  @ApiOperation({ summary: '获取文章详情 (异步累加浏览计数)' })
  async findOne(@Param('id', ParseIntPipe) id: number) {
    return this.postsService.findOne(id);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: '软删除文章 (需要作者本人权限)' })
  async delete(@Param('id', ParseIntPipe) id: number, @CurrentUser('id') userId: number) {
    return this.postsService.delete(id, userId);
  }
}
