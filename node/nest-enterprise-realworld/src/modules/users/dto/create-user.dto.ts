import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsNotEmpty, IsString, MinLength, MaxLength } from 'class-validator';

export class CreateUserDto {
  @ApiProperty({ description: '用户名', example: 'developer' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(50)
  username: string;

  @ApiProperty({ description: '电子邮箱', example: 'developer@enterprise.com' })
  @IsEmail()
  @IsNotEmpty()
  email: string;

  @ApiProperty({ description: '登录密码', example: 'Secret123' })
  @IsString()
  @MinLength(6)
  @MaxLength(30)
  password: string;
}
