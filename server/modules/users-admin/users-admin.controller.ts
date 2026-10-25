import { Controller, Get, Post, Patch, Delete, Body, Param, Query, Req } from '@nestjs/common';
import type { Request } from 'express';
import { UsersAdminService } from './users-admin.service';
import { AuthService } from '../auth/auth.service';
import {
  CreateUserDto,
  UpdateUserDto,
  ResetPasswordDto,
  UserListQueryDto,
} from './users-admin.dto';
import type {
  UserInfo,
  UserListResponse,
} from '@shared/api.interface';

@Controller('api/admin/users')
export class UsersAdminController {
  constructor(
    private readonly usersAdminService: UsersAdminService,
    private readonly authService: AuthService,
  ) {}

  @Get()
  async listUsers(
    @Req() req: Request,
    @Query() query: UserListQueryDto,
  ): Promise<UserListResponse> {
    this.authService.requireUser(req, ['super_admin']);
    return this.usersAdminService.listUsers({
      role: query.role,
      keyword: query.keyword,
      page: query.page,
      pageSize: query.pageSize,
    });
  }

  @Get(':id')
  async getUser(@Req() req: Request, @Param('id') id: string): Promise<UserInfo> {
    this.authService.requireUser(req, ['super_admin']);
    return this.usersAdminService.getUser(id);
  }

  @Post()
  async createUser(@Req() req: Request, @Body() dto: CreateUserDto): Promise<UserInfo> {
    this.authService.requireUser(req, ['super_admin']);
    return this.usersAdminService.createUser(dto);
  }

  @Patch(':id')
  async updateUser(
    @Req() req: Request,
    @Param('id') id: string,
    @Body() dto: UpdateUserDto,
  ): Promise<UserInfo> {
    this.authService.requireUser(req, ['super_admin']);
    return this.usersAdminService.updateUser(id, dto);
  }

  @Patch(':id/reset-password')
  async resetPassword(
    @Req() req: Request,
    @Param('id') id: string,
    @Body() dto: ResetPasswordDto,
  ): Promise<{ success: true }> {
    this.authService.requireUser(req, ['super_admin']);
    return this.usersAdminService.resetPassword(id, dto.newPassword);
  }

  @Delete(':id')
  async deleteUser(@Req() req: Request, @Param('id') id: string): Promise<{ success: true }> {
    this.authService.requireUser(req, ['super_admin']);
    return this.usersAdminService.deleteUser(id);
  }
}
