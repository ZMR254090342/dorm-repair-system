import { Injectable, NotFoundException, ForbiddenException, BadRequestException } from '@nestjs/common';
import { Inject } from '@nestjs/common';
import { DRIZZLE_DATABASE, type PostgresJsDatabase } from '@lark-apaas/fullstack-nestjs-core';
import { eq, and, desc, count, like, inArray, aliasedTable } from 'drizzle-orm';

import { repairOrders, users, reviews } from '@server/database/schema';

const repairerUsers = aliasedTable(users, 'repairer_users');
import type {
  RepairOrder,
  OrderStatus,
  FaultType,
  OrderListResponse,
  UserRole,
  ReviewInfo,
} from '@shared/api.interface';

@Injectable()
export class OrdersService {
  constructor(@Inject(DRIZZLE_DATABASE) private readonly db: PostgresJsDatabase) {}

  async createOrder(studentId: string, dto: {
    dormBuilding: string;
    dormRoom: string;
    faultType: FaultType;
    faultDescription: string;
    faultImages?: string[];
  }): Promise<RepairOrder> {
    const orderNo = 'BX' + Date.now() + Math.floor(Math.random() * 1000).toString().padStart(3, '0');

    const inserted = await this.db.insert(repairOrders).values({
      orderNo,
      studentId,
      dormBuilding: dto.dormBuilding,
      dormRoom: dto.dormRoom,
      faultType: dto.faultType,
      faultDescription: dto.faultDescription,
      faultImages: dto.faultImages ?? [],
      status: 'pending_review',
    }).returning();

    return this.getOrderDetail(inserted[0].id);
  }

  async listOrders(params: {
    role: UserRole;
    userId: string;
    status?: OrderStatus;
    faultType?: FaultType;
    page: number;
    pageSize: number;
  }): Promise<OrderListResponse> {
    const { role, userId, status, faultType, page, pageSize } = params;

    const conditions = [];
    if (role === 'student') {
      conditions.push(eq(repairOrders.studentId, userId));
    } else if (role === 'repairer') {
      conditions.push(eq(repairOrders.repairerId, userId));
    }
    if (status) conditions.push(eq(repairOrders.status, status));
    if (faultType) conditions.push(eq(repairOrders.faultType, faultType));

    const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

    const countResult = await this.db
      .select({ count: count() })
      .from(repairOrders)
      .where(whereClause);
    const total = Number(countResult[0]?.count ?? 0);

    const rows = await this.db
      .select({
        order: repairOrders,
        studentName: users.realName,
        studentPhone: users.phone,
        repairerName: repairerUsers.realName,
      })
      .from(repairOrders)
      .leftJoin(users, eq(repairOrders.studentId, users.id))
      .leftJoin(repairerUsers, eq(repairOrders.repairerId, repairerUsers.id))
      .where(whereClause)
      .orderBy(desc(repairOrders.createdAt))
      .limit(pageSize)
      .offset((page - 1) * pageSize);

    const items = rows.map((row) => this.mapRow(row));
    return { items, total, page, pageSize };
  }

  async getOrderDetail(orderId: string): Promise<RepairOrder> {
    const rows = await this.db
      .select({
        order: repairOrders,
        studentName: users.realName,
        studentPhone: users.phone,
        repairerName: repairerUsers.realName,
      })
      .from(repairOrders)
      .leftJoin(users, eq(repairOrders.studentId, users.id))
      .leftJoin(repairerUsers, eq(repairOrders.repairerId, repairerUsers.id))
      .where(eq(repairOrders.id, orderId))
      .limit(1);

    if (rows.length === 0) {
      throw new NotFoundException('工单不存在');
    }

    return this.mapRow(rows[0]);
  }

  async checkOrderPermission(orderId: string, userId: string, role: UserRole): Promise<void> {
    const order = await this.db.select().from(repairOrders).where(eq(repairOrders.id, orderId)).limit(1);
    if (order.length === 0) {
      throw new NotFoundException('工单不存在');
    }
    const o = order[0];
    if (role === 'student' && o.studentId !== userId) {
      throw new ForbiddenException('无权查看此工单');
    }
    if (role === 'repairer' && o.repairerId !== userId) {
      throw new ForbiddenException('无权查看此工单');
    }
  }

  async assignOrder(orderId: string, repairerId: string): Promise<RepairOrder> {
    const order = await this.db.select().from(repairOrders).where(eq(repairOrders.id, orderId)).limit(1);
    if (order.length === 0) {
      throw new NotFoundException('工单不存在');
    }
    if (order[0].status !== 'pending_review') {
      throw new BadRequestException('只有待审核工单可派单');
    }

    const repairer = await this.db.select().from(users).where(eq(users.id, repairerId)).limit(1);
    if (repairer.length === 0 || repairer[0].role !== 'repairer') {
      throw new BadRequestException('维修人员不存在');
    }

    await this.db.update(repairOrders).set({
      status: 'pending_repair',
      repairerId,
      updatedAt: new Date(),
    }).where(eq(repairOrders.id, orderId));

    return this.getOrderDetail(orderId);
  }

  async rejectOrder(orderId: string, rejectReason: string): Promise<RepairOrder> {
    const order = await this.db.select().from(repairOrders).where(eq(repairOrders.id, orderId)).limit(1);
    if (order.length === 0) {
      throw new NotFoundException('工单不存在');
    }
    if (order[0].status !== 'pending_review') {
      throw new BadRequestException('只有待审核工单可驳回');
    }

    await this.db.update(repairOrders).set({
      status: 'rejected',
      rejectReason,
      updatedAt: new Date(),
    }).where(eq(repairOrders.id, orderId));

    return this.getOrderDetail(orderId);
  }

  async updateOrderStatus(orderId: string, repairerId: string, dto: {
    status: 'repairing' | 'pending_review_done';
    repairNote?: string;
    repairResult?: string;
  }): Promise<RepairOrder> {
    const order = await this.db.select().from(repairOrders).where(eq(repairOrders.id, orderId)).limit(1);
    if (order.length === 0) {
      throw new NotFoundException('工单不存在');
    }
    const o = order[0];
    if (o.repairerId !== repairerId) {
      throw new ForbiddenException('无权处理此工单');
    }

    const validTransitions: Record<string, OrderStatus[]> = {
      pending_repair: ['repairing'],
      repairing: ['pending_review_done'],
    };
    const allowed = validTransitions[o.status] ?? [];
    if (!allowed.includes(dto.status)) {
      throw new BadRequestException(`状态不能从 ${o.status} 变更为 ${dto.status}`);
    }

    const patch: Partial<typeof repairOrders.$inferInsert> = {
      status: dto.status,
      updatedAt: new Date(),
    };
    if (dto.repairNote !== undefined) patch.repairNote = dto.repairNote;
    if (dto.repairResult !== undefined) patch.repairResult = dto.repairResult;

    await this.db.update(repairOrders).set(patch).where(eq(repairOrders.id, orderId));
    return this.getOrderDetail(orderId);
  }

  async cancelOrder(orderId: string, studentId: string): Promise<RepairOrder> {
    const order = await this.db.select().from(repairOrders).where(eq(repairOrders.id, orderId)).limit(1);
    if (order.length === 0) {
      throw new NotFoundException('工单不存在');
    }
    const o = order[0];
    if (o.studentId !== studentId) {
      throw new ForbiddenException('无权取消此工单');
    }
    if (o.status !== 'pending_review') {
      throw new BadRequestException('只有待审核工单可取消');
    }

    await this.db.update(repairOrders).set({
      status: 'cancelled',
      updatedAt: new Date(),
    }).where(eq(repairOrders.id, orderId));

    return this.getOrderDetail(orderId);
  }

  async createReview(studentId: string, dto: {
    orderId: string;
    rating: number;
    content?: string;
  }): Promise<ReviewInfo> {
    const order = await this.db.select().from(repairOrders).where(eq(repairOrders.id, dto.orderId)).limit(1);
    if (order.length === 0) {
      throw new NotFoundException('工单不存在');
    }
    const o = order[0];
    if (o.studentId !== studentId) {
      throw new ForbiddenException('无权评价此工单');
    }
    if (o.status !== 'pending_review_done') {
      throw new BadRequestException('只有待评价的工单可评价');
    }

    const existingReview = await this.db.select().from(reviews).where(eq(reviews.orderId, dto.orderId)).limit(1);
    if (existingReview.length > 0) {
      throw new BadRequestException('该工单已评价');
    }

    const inserted = await this.db.insert(reviews).values({
      orderId: dto.orderId,
      studentId,
      rating: dto.rating,
      content: dto.content,
    }).returning();

    await this.db.update(repairOrders).set({
      status: 'completed',
      updatedAt: new Date(),
    }).where(eq(repairOrders.id, dto.orderId));

    return {
      id: inserted[0].id,
      orderId: inserted[0].orderId,
      studentId: inserted[0].studentId,
      rating: inserted[0].rating,
      content: inserted[0].content ?? undefined,
      createdAt: inserted[0].createdAt.toISOString(),
    };
  }

  async getReviewByOrder(orderId: string): Promise<ReviewInfo | null> {
    const rows = await this.db.select().from(reviews).where(eq(reviews.orderId, orderId)).limit(1);
    if (rows.length === 0) return null;
    const r = rows[0];
    return {
      id: r.id,
      orderId: r.orderId,
      studentId: r.studentId,
      rating: r.rating,
      content: r.content ?? undefined,
      createdAt: r.createdAt.toISOString(),
    };
  }

  async listRepairers(): Promise<Array<{ id: string; realName: string; phone?: string }>> {
    const rows = await this.db
      .select({ id: users.id, realName: users.realName, phone: users.phone })
      .from(users)
      .where(and(eq(users.role, 'repairer'), eq(users.status, 'active')))
      .orderBy(users.realName);
    return rows.map((r) => ({
      id: r.id,
      realName: r.realName,
      phone: r.phone ?? undefined,
    }));
  }

  private mapRow(row: {
    order: typeof repairOrders.$inferSelect;
    studentName: string | null;
    studentPhone: string | null;
    repairerName: string | null;
  }): RepairOrder {
    const o = row.order;
    return {
      id: o.id,
      orderNo: o.orderNo,
      studentId: o.studentId,
      studentName: row.studentName ?? '',
      studentPhone: row.studentPhone ?? undefined,
      dormBuilding: o.dormBuilding,
      dormRoom: o.dormRoom,
      faultType: o.faultType as FaultType,
      faultDescription: o.faultDescription,
      faultImages: o.faultImages ?? [],
      status: o.status as OrderStatus,
      rejectReason: o.rejectReason ?? undefined,
      repairerId: o.repairerId ?? undefined,
      repairerName: row.repairerName ?? undefined,
      repairNote: o.repairNote ?? undefined,
      repairResult: o.repairResult ?? undefined,
      createdAt: o.createdAt.toISOString(),
      updatedAt: o.updatedAt.toISOString(),
    };
  }
}
