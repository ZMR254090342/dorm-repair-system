import { Injectable, NotFoundException, ConflictException, BadRequestException } from '@nestjs/common';
import { Inject } from '@nestjs/common';
import { DRIZZLE_DATABASE, type PostgresJsDatabase } from '@lark-apaas/fullstack-nestjs-core';
import { eq, and, desc, count, like, or } from 'drizzle-orm';
import * as bcrypt from 'bcryptjs';

import { users } from '@server/database/schema';
import type {
  UserInfo,
  UserRole,
  UserStatus,
  UserListResponse,
} from '@shared/api.interface';

function extractPostgresErrorCode(error: unknown): string | undefined {
  let current: unknown = error;
  for (let depth = 0; depth < 4 && current && typeof current === 'object'; depth += 1) {
    const { code, cause } = current as { code?: unknown; cause?: unknown };
    if (typeof code === 'string') return code;
    current = cause;
  }
  return undefined;
}

@Injectable()
export class UsersAdminService {
  constructor(@Inject(DRIZZLE_DATABASE) private readonly db: PostgresJsDatabase) {}

  async listUsers(params: {
    role?: UserRole;
    keyword?: string;
    page: number;
    pageSize: number;
  }): Promise<UserListResponse> {
    const { role, keyword, page, pageSize } = params;
    const conditions = [];
    if (role) conditions.push(eq(users.role, role));
    if (keyword) {
      conditions.push(
        or(
          like(users.username, `%${keyword}%`),
          like(users.realName, `%${keyword}%`),
        ),
      );
    }
    const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

    const countResult = await this.db.select({ count: count() }).from(users).where(whereClause);
    const total = Number(countResult[0]?.count ?? 0);

    const rows = await this.db
      .select()
      .from(users)
      .where(whereClause)
      .orderBy(desc(users.createdAt))
      .limit(pageSize)
      .offset((page - 1) * pageSize);

    return {
      items: rows.map((u) => this.mapToUserInfo(u)),
      total,
      page,
      pageSize,
    };
  }

  async getUser(id: string): Promise<UserInfo> {
    const rows = await this.db.select().from(users).where(eq(users.id, id)).limit(1);
    if (rows.length === 0) throw new NotFoundException('用户不存在');
    return this.mapToUserInfo(rows[0]);
  }

  async createUser(dto: {
    username: string;
    password: string;
    realName: string;
    role: UserRole;
    phone?: string;
    dormBuilding?: string;
    dormRoom?: string;
  }): Promise<UserInfo> {
    const passwordHash = await bcrypt.hash(dto.password, 10);
    try {
      const inserted = await this.db.insert(users).values({
        username: dto.username,
        passwordHash,
        realName: dto.realName,
        role: dto.role,
        phone: dto.phone,
        dormBuilding: dto.dormBuilding,
        dormRoom: dto.dormRoom,
        status: 'active',
      }).returning();
      return this.mapToUserInfo(inserted[0]);
    } catch (error) {
      if (extractPostgresErrorCode(error) === '23505') {
        throw new ConflictException('用户名已存在');
      }
      throw error;
    }
  }

  async updateUser(id: string, dto: {
    realName?: string;
    role?: UserRole;
    phone?: string;
    status?: UserStatus;
    dormBuilding?: string;
    dormRoom?: string;
  }): Promise<UserInfo> {
    const existing = await this.db.select().from(users).where(eq(users.id, id)).limit(1);
    if (existing.length === 0) throw new NotFoundException('用户不存在');

    const patch: Partial<typeof users.$inferInsert> = { updatedAt: new Date() };
    if (dto.realName !== undefined) patch.realName = dto.realName;
    if (dto.role !== undefined) patch.role = dto.role;
    if (dto.phone !== undefined) patch.phone = dto.phone;
    if (dto.status !== undefined) patch.status = dto.status;
    if (dto.dormBuilding !== undefined) patch.dormBuilding = dto.dormBuilding;
    if (dto.dormRoom !== undefined) patch.dormRoom = dto.dormRoom;

    if (Object.keys(patch).length === 1) {
      return this.mapToUserInfo(existing[0]);
    }

    const updated = await this.db.update(users).set(patch).where(eq(users.id, id)).returning();
    return this.mapToUserInfo(updated[0]);
  }

  async resetPassword(id: string, newPassword: string): Promise<{ success: true }> {
    const existing = await this.db.select({ id: users.id }).from(users).where(eq(users.id, id)).limit(1);
    if (existing.length === 0) throw new NotFoundException('用户不存在');

    const passwordHash = await bcrypt.hash(newPassword, 10);
    await this.db.update(users).set({
      passwordHash,
      updatedAt: new Date(),
    }).where(eq(users.id, id));

    return { success: true };
  }

  async deleteUser(id: string): Promise<{ success: true }> {
    const existing = await this.db.select({ id: users.id }).from(users).where(eq(users.id, id)).limit(1);
    if (existing.length === 0) throw new NotFoundException('用户不存在');

    await this.db.delete(users).where(eq(users.id, id));
    return { success: true };
  }

  private mapToUserInfo(user: typeof users.$inferSelect): UserInfo {
    return {
      id: user.id,
      username: user.username,
      realName: user.realName,
      role: user.role as UserRole,
      phone: user.phone ?? undefined,
      status: user.status as UserStatus,
      dormBuilding: user.dormBuilding ?? undefined,
      dormRoom: user.dormRoom ?? undefined,
      createdAt: user.createdAt.toISOString(),
    };
  }
}
