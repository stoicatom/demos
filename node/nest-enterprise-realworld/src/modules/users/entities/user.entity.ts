import { Entity, Column, OneToMany } from 'typeorm';
import { AppBaseEntity } from '../../../common/entities/base.entity';
import { PostEntity } from '../../posts/entities/post.entity';

export enum UserRole {
  ADMIN = 'ADMIN',
  USER = 'USER',
}

@Entity('users')
export class UserEntity extends AppBaseEntity {
  @Column({ unique: true, length: 50, comment: '用户名' })
  username: string;

  @Column({ unique: true, length: 100, comment: '邮箱' })
  email: string;

  @Column({ select: false, comment: '哈希密码' })
  password: string;

  @Column({ type: 'enum', enum: UserRole, default: UserRole.USER, comment: '用户角色' })
  role: UserRole;

  @Column({ default: true, comment: '是否启用' })
  isActive: boolean;

  @OneToMany(() => PostEntity, (post) => post.author)
  posts: PostEntity[];
}
