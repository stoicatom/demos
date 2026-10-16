import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import * as bcrypt from 'bcrypt';
import { UsersService } from '../users/users.service';
import { RedisService } from '../redis/redis.service';
import { LoginDto } from './dto/login.dto';

@Injectable()
export class AuthService {
  constructor(
    private readonly usersService: UsersService,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
    private readonly redisService: RedisService,
  ) {}

  async login(dto: LoginDto) {
    const user = await this.usersService.findByUsername(dto.username);
    if (!user) {
      throw new UnauthorizedException('用户名或密码错误');
    }

    const isMatch = await bcrypt.compare(dto.password, user.password);
    if (!isMatch) {
      throw new UnauthorizedException('用户名或密码错误');
    }

    if (!user.isActive) {
      throw new UnauthorizedException('该账户已被禁用');
    }

    return this.generateTokens(user);
  }

  async refreshToken(refreshToken: string) {
    try {
      const payload = this.jwtService.verify(refreshToken, {
        secret: this.configService.get<string>('jwt.refreshSecret'),
      });

      // 从 Redis 验证该 Refresh Token 是否在白名单中
      const redisKey = `refresh_token:${payload.sub}`;
      const storedToken = await this.redisService.get(redisKey);
      if (storedToken && storedToken !== refreshToken) {
        throw new UnauthorizedException('令牌已失效或已在其他端刷新');
      }

      const user = await this.usersService.findById(payload.sub);
      return this.generateTokens(user);
    } catch {
      throw new UnauthorizedException('Refresh Token 无效或已过期，请重新登录');
    }
  }

  private async generateTokens(user: any) {
    const payload = { sub: user.id, username: user.username, role: user.role };

    const accessToken = this.jwtService.sign(payload, {
      secret: this.configService.get<string>('jwt.secret'),
      expiresIn: this.configService.get<string>('jwt.expiresIn'),
    });

    const refreshToken = this.jwtService.sign(payload, {
      secret: this.configService.get<string>('jwt.refreshSecret'),
      expiresIn: this.configService.get<string>('jwt.refreshExpiresIn'),
    });

    // 缓存 Refresh Token 至 Redis（有效时长 7 天）
    await this.redisService.set(`refresh_token:${user.id}`, refreshToken, 7 * 24 * 3600);

    return {
      accessToken,
      refreshToken,
      user: {
        id: user.id,
        username: user.username,
        role: user.role,
      },
    };
  }
}
