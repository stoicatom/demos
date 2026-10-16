import { Injectable, NotFoundException, InternalServerErrorException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource } from 'typeorm';
import { PostEntity } from './entities/post.entity';
import { CreatePostDto } from './dto/create-post.dto';
import { QueryPostDto } from './dto/query-post.dto';
import { UserEntity } from '../users/entities/user.entity';
import { RedisService } from '../redis/redis.service';

@Injectable()
export class PostsService {
  constructor(
    @InjectRepository(PostEntity)
    private readonly postRepository: Repository<PostEntity>,
    private readonly dataSource: DataSource,
    private readonly redisService: RedisService,
  ) {}

  // 生产级：使用 QueryRunner 手动事务控制创建文章与关联校验
  async create(authorId: number, dto: CreatePostDto): Promise<PostEntity> {
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      const author = await queryRunner.manager.findOne(UserEntity, { where: { id: authorId } });
      if (!author) {
        throw new NotFoundException('作者用户不存在');
      }

      const post = queryRunner.manager.create(PostEntity, {
        title: dto.title,
        content: dto.content,
        author,
      });

      const saved = await queryRunner.manager.save(post);
      await queryRunner.commitTransaction();

      // 清除文章列表缓存
      await this.redisService.del('cache:posts:page:1');

      return saved;
    } catch (error) {
      await queryRunner.rollbackTransaction();
      if (error instanceof NotFoundException) throw error;
      throw new InternalServerErrorException(`创建文章事务失败: ${error.message}`);
    } finally {
      await queryRunner.release();
    }
  }

  // 分页列表查询与 Redis 缓存加速
  async findAll(query: QueryPostDto) {
    const { page = 1, limit = 10 } = query;
    const cacheKey = `cache:posts:page:${page}:limit:${limit}`;

    const cached = await this.redisService.get(cacheKey);
    if (cached) {
      try {
        return JSON.parse(cached);
      } catch {
        // 缓存反序列化失败则走数据库查询
      }
    }

    const [items, total] = await this.postRepository.findAndCount({
      relations: ['author'],
      select: {
        id: true,
        title: true,
        content: true,
        views: true,
        createdAt: true,
        author: {
          id: true,
          username: true,
          email: true,
        },
      },
      order: { createdAt: 'DESC' },
      skip: (page - 1) * limit,
      take: limit,
    });

    const result = {
      items,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };

    // 缓存 60 秒
    await this.redisService.set(cacheKey, JSON.stringify(result), 60);

    return result;
  }

  async findOne(id: number): Promise<PostEntity> {
    const post = await this.postRepository.findOne({
      where: { id },
      relations: ['author'],
      select: {
        id: true,
        title: true,
        content: true,
        views: true,
        createdAt: true,
        author: {
          id: true,
          username: true,
        },
      },
    });

    if (!post) {
      throw new NotFoundException('文章不存在');
    }

    // 异步累加阅读量
    this.postRepository.increment({ id }, 'views', 1).catch(() => {});

    return post;
  }

  async delete(id: number, userId: number): Promise<boolean> {
    const post = await this.postRepository.findOne({
      where: { id },
      relations: ['author'],
    });

    if (!post) {
      throw new NotFoundException('文章不存在');
    }

    if (post.author.id !== userId) {
      throw new InternalServerErrorException('只有作者本人可以删除该文章');
    }

    await this.postRepository.softDelete(id);
    return true;
  }
}
