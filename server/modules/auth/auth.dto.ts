import {
  IsString,
  IsOptional,
  MinLength,
  MaxLength,
} from 'class-validator';
import type { LoginRequest, RegisterRequest } from '@shared/api.interface';

export class LoginDto implements LoginRequest {
  @IsString()
  @MaxLength(50)
  username!: string;

  @IsString()
  @MinLength(6)
  @MaxLength(50)
  password!: string;
}

export class RegisterDto implements RegisterRequest {
  @IsString()
  @MaxLength(50)
  username!: string;

  @IsString()
  @MinLength(6)
  @MaxLength(50)
  password!: string;

  @IsString()
  @MaxLength(50)
  realName!: string;

  @IsOptional()
  @IsString()
  @MaxLength(20)
  phone?: string;

  @IsOptional()
  @IsString()
  @MaxLength(50)
  dormBuilding?: string;

  @IsOptional()
  @IsString()
  @MaxLength(20)
  dormRoom?: string;
}
