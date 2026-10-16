import { Injectable, ConflictException, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as bcrypt from 'bcrypt';
import { UserEntity, UserRole } from './entities/user.entity';
import { CreateUserDto } from './dto/create-user.dto';

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(UserEntity)
    private readonly userRepository: Repository<UserEntity>,
  ) {}

  async create(dto: CreateUserDto): Promise<UserEntity> {
    const existing = await this.userRepository.findOne({
      where: [{ username: dto.username }, { email: dto.email }],
    });
    if (existing) {
      throw new ConflictException('用户名或邮箱已存在');
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(dto.password, salt);

    const user = this.userRepository.create({
      username: dto.username,
      email: dto.email,
      password: hashedPassword,
      role: UserRole.USER,
    });

    const saved = await this.userRepository.save(user);
    delete saved.password;
    return saved;
  }

  async findByUsername(username: string): Promise<UserEntity | null> {
    return this.userRepository.findOne({
      where: { username },
      select: ['id', 'username', 'email', 'password', 'role', 'isActive'],
    });
  }

  async findById(id: number): Promise<UserEntity> {
    const user = await this.userRepository.findOne({ where: { id } });
    if (!user) {
      throw new NotFoundException('用户不存在');
    }
    return user;
  }
}
