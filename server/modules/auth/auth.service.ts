import { Injectable, UnauthorizedException, ConflictException, BadRequestException } from '@nestjs/common';
import { Inject } from '@nestjs/common';
import { DRIZZLE_DATABASE, type PostgresJsDatabase } from '@lark-apaas/fullstack-nestjs-core';
import { eq } from 'drizzle-orm';
import * as bcrypt from 'bcryptjs';
import type { Request } from 'express';

import { users } from '@server/database/schema';
import type { UserInfo, UserRole } from '@shared/api.interface';

export const SESSION_COOKIE = 'repair_session';

@Injectable()
export class AuthService {
  constructor(@Inject(DRIZZLE_DATABASE) private readonly db: PostgresJsDatabase) {}

  async login(username: string, password: string): Promise<UserInfo> {
    const userList = await this.db.select().from(users).where(eq(users.username, username)).limit(1);
    if (userList.length === 0) {
      throw new UnauthorizedException('账号或密码错误');
    }

    const user = userList[0];
    if (user.status !== 'active') {
      throw new UnauthorizedException('账号已被禁用，请联系管理员');
    }

    const isPasswordValid = await bcrypt.compare(password, user.passwordHash);
    if (!isPasswordValid) {
      throw new UnauthorizedException('账号或密码错误');
    }

    return this.mapToUserInfo(user);
  }

  async register(dto: {
    username: string;
    password: string;
    realName: string;
    phone?: string;
    dormBuilding?: string;
    dormRoom?: string;
  }): Promise<UserInfo> {
    const existing = await this.db.select({ id: users.id }).from(users).where(eq(users.username, dto.username)).limit(1);
    if (existing.length > 0) {
      throw new ConflictException('用户名已存在');
    }

    const passwordHash = await bcrypt.hash(dto.password, 10);
    const inserted = await this.db.insert(users).values({
      username: dto.username,
      passwordHash,
      realName: dto.realName,
      role: 'student',
      phone: dto.phone,
      dormBuilding: dto.dormBuilding,
      dormRoom: dto.dormRoom,
      status: 'active',
    }).returning();

    return this.mapToUserInfo(inserted[0]);
  }

  async getCurrentUser(req: Request): Promise<UserInfo | null> {
    const sessionData = this.getSessionData(req);
    if (!sessionData) return null;

    const userList = await this.db.select().from(users).where(eq(users.id, sessionData.userId)).limit(1);
    if (userList.length === 0) return null;

    const user = userList[0];
    if (user.status !== 'active') return null;

    return this.mapToUserInfo(user);
  }

  getSessionData(req: Request): { userId: string; role: UserRole } | null {
    const cookie = req.cookies?.[SESSION_COOKIE];
    if (!cookie) return null;
    try {
      const parsed = JSON.parse(Buffer.from(cookie, 'base64').toString('utf-8'));
      if (!parsed.userId || !parsed.role) return null;
      return parsed;
    } catch {
      return null;
    }
  }

  createSessionCookie(userId: string, role: UserRole): string {
    const data = JSON.stringify({ userId, role });
    return Buffer.from(data).toString('base64');
  }

  requireUser(req: Request, allowedRoles?: UserRole[]): { userId: string; role: UserRole } {
    const session = this.getSessionData(req);
    if (!session) {
      throw new UnauthorizedException('请先登录');
    }
    if (allowedRoles && !allowedRoles.includes(session.role)) {
      throw new UnauthorizedException('权限不足');
    }
    return session;
  }

  private mapToUserInfo(user: typeof users.$inferSelect): UserInfo {
    return {
      id: user.id,
      username: user.username,
      realName: user.realName,
      role: user.role as UserRole,
      phone: user.phone ?? undefined,
      status: user.status as 'active' | 'disabled',
      dormBuilding: user.dormBuilding ?? undefined,
      dormRoom: user.dormRoom ?? undefined,
      createdAt: user.createdAt.toISOString(),
    };
  }
}
