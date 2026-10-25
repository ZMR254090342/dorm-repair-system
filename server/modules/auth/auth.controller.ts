import { Controller, Post, Body, Get, Req, Res } from '@nestjs/common';
import type { Request, Response } from 'express';
import { AuthService, SESSION_COOKIE } from './auth.service';
import { LoginDto, RegisterDto } from './auth.dto';
import type { LoginResponse, UserInfo } from '@shared/api.interface';

@Controller('api/auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('login')
  async login(@Body() dto: LoginDto, @Res({ passthrough: true }) res: Response): Promise<LoginResponse> {
    const user = await this.authService.login(dto.username, dto.password);
    const cookie = this.authService.createSessionCookie(user.id, user.role);
    res.cookie(SESSION_COOKIE, cookie, {
      httpOnly: true,
      sameSite: 'lax',
      path: '/',
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });
    return { user };
  }

  @Post('register')
  async register(@Body() dto: RegisterDto, @Res({ passthrough: true }) res: Response): Promise<LoginResponse> {
    const user = await this.authService.register(dto);
    const cookie = this.authService.createSessionCookie(user.id, user.role);
    res.cookie(SESSION_COOKIE, cookie, {
      httpOnly: true,
      sameSite: 'lax',
      path: '/',
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });
    return { user };
  }

  @Post('logout')
  async logout(@Res({ passthrough: true }) res: Response): Promise<{ success: true }> {
    res.clearCookie(SESSION_COOKIE, { path: '/' });
    return { success: true };
  }

  @Get('me')
  async me(@Req() req: Request): Promise<{ user: UserInfo | null }> {
    const user = await this.authService.getCurrentUser(req);
    return { user };
  }
}
