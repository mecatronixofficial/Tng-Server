import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsString, MinLength } from 'class-validator';

export class LoginDto {
  @ApiProperty({ example: 'admin@thangaveltextile.in' })
  @IsEmail()
  email: string;

  @ApiProperty({ example: 'ChangeMe!Admin2026' })
  @IsString()
  @MinLength(8)
  password: string;
}
