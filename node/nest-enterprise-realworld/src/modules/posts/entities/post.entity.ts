import { Entity, Column, ManyToOne, JoinColumn } from 'typeorm';
import { AppBaseEntity } from '../../../common/entities/base.entity';
import { UserEntity } from '../../users/entities/user.entity';

@Entity('posts')
export class PostEntity extends AppBaseEntity {
  @Column({ length: 150, comment: '文章标题' })
  title: string;

  @Column({ type: 'text', comment: '文章正文内容' })
  content: string;

  @Column({ default: true, comment: '发布状态' })
  isPublished: boolean;

  @Column({ default: 0, comment: '浏览量' })
  views: number;

  @ManyToOne(() => UserEntity, (user) => user.posts, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'author_id' })
  author: UserEntity;
}
