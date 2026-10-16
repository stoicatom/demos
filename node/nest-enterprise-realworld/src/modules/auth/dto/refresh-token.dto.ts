import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString } from 'class-validator';

export class RefreshTokenDto {
  @ApiProperty({ description: '长效 Refresh Token 令牌' })
  @IsString()
  @IsNotEmpty()
  refreshToken: string;
}
