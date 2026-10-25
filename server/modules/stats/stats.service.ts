import { Injectable } from '@nestjs/common';
import { Inject } from '@nestjs/common';
import { DRIZZLE_DATABASE, type PostgresJsDatabase } from '@lark-apaas/fullstack-nestjs-core';
import { eq, count, and, isNotNull } from 'drizzle-orm';
import { sql } from 'drizzle-orm';

import { repairOrders, users } from '@server/database/schema';
import type { OrderStatsResponse, FaultType } from '@shared/api.interface';

@Injectable()
export class StatsService {
  constructor(@Inject(DRIZZLE_DATABASE) private readonly db: PostgresJsDatabase) {}

  async getOrderStats(): Promise<OrderStatsResponse> {
    const totalResult = await this.db.select({ count: count() }).from(repairOrders);
    const total = Number(totalResult[0]?.count ?? 0);

    const completedResult = await this.db
      .select({ count: count() })
      .from(repairOrders)
      .where(eq(repairOrders.status, 'completed'));
    const completed = Number(completedResult[0]?.count ?? 0);

    const pendingResult = await this.db
      .select({ count: count() })
      .from(repairOrders)
      .where(
        sql`${repairOrders.status} IN ${sql.raw(`('pending_review', 'pending_repair')`)}`,
      );
    const pending = Number(pendingResult[0]?.count ?? 0);

    const repairingResult = await this.db
      .select({ count: count() })
      .from(repairOrders)
      .where(eq(repairOrders.status, 'repairing'));
    const repairing = Number(repairingResult[0]?.count ?? 0);

    const byFaultTypeResult = await this.db
      .select({
        type: repairOrders.faultType,
        count: count(),
      })
      .from(repairOrders)
      .groupBy(repairOrders.faultType);

    const byFaultType = byFaultTypeResult.map((row) => ({
      type: row.type as FaultType,
      count: Number(row.count),
    }));

    const byRepairerResult = await this.db
      .select({
        repairerId: repairOrders.repairerId,
        repairerName: users.realName,
        count: count(),
      })
      .from(repairOrders)
      .leftJoin(users, eq(repairOrders.repairerId, users.id))
      .where(and(isNotNull(repairOrders.repairerId), eq(repairOrders.status, 'completed')))
      .groupBy(repairOrders.repairerId, users.realName)
      .orderBy(sql`count DESC`);

    const byRepairer = byRepairerResult
      .filter((row) => row.repairerId)
      .map((row) => ({
        repairerId: row.repairerId!,
        repairerName: row.repairerName ?? '',
        count: Number(row.count),
      }));

    return {
      total,
      completed,
      pending,
      repairing,
      byFaultType,
      byRepairer,
    };
  }
}
