import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString } from 'class-validator';

export class LoginDto {
  @ApiProperty({ description: '用户名', example: 'developer' })
  @IsString()
  @IsNotEmpty()
  username: string;

  @ApiProperty({ description: '密码', example: 'Secret123' })
  @IsString()
  @IsNotEmpty()
  password: string;
}
