import {
  IsString,
  IsOptional,
  IsIn,
  IsInt,
  Min,
  Max,
  MinLength,
} from 'class-validator';
import { Type } from 'class-transformer';
import type {
  CreateUserRequest,
  UpdateUserRequest,
  ResetPasswordRequest,
  UserRole,
  UserStatus,
} from '@shared/api.interface';

const ROLES: UserRole[] = ['student', 'repairer', 'admin', 'super_admin'];
const STATUSES: UserStatus[] = ['active', 'disabled'];

export class CreateUserDto implements CreateUserRequest {
  @IsString()
  username!: string;

  @IsString()
  @MinLength(6)
  password!: string;

  @IsString()
  realName!: string;

  @IsString()
  @IsIn(ROLES)
  role!: UserRole;

  @IsOptional()
  @IsString()
  phone?: string;

  @IsOptional()
  @IsString()
  dormBuilding?: string;

  @IsOptional()
  @IsString()
  dormRoom?: string;
}

export class UpdateUserDto implements UpdateUserRequest {
  @IsOptional()
  @IsString()
  realName?: string;

  @IsOptional()
  @IsString()
  @IsIn(ROLES)
  role?: UserRole;

  @IsOptional()
  @IsString()
  phone?: string;

  @IsOptional()
  @IsString()
  @IsIn(STATUSES)
  status?: UserStatus;

  @IsOptional()
  @IsString()
  dormBuilding?: string;

  @IsOptional()
  @IsString()
  dormRoom?: string;
}

export class ResetPasswordDto implements ResetPasswordRequest {
  @IsString()
  @MinLength(6)
  newPassword!: string;
}

export class UserListQueryDto {
  @IsOptional()
  @IsString()
  @IsIn(ROLES)
  role?: UserRole;

  @IsOptional()
  @IsString()
  keyword?: string;

  @IsOptional()
  @IsInt()
  @Type(() => Number)
  @Min(1)
  page: number = 1;

  @IsOptional()
  @IsInt()
  @Type(() => Number)
  @Min(1)
  @Max(100)
  pageSize: number = 10;
}
