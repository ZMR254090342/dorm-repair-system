import { Controller, Get, Req } from '@nestjs/common';
import type { Request } from 'express';
import { StatsService } from './stats.service';
import { AuthService } from '../auth/auth.service';
import type { OrderStatsResponse } from '@shared/api.interface';

@Controller('api/stats')
export class StatsController {
  constructor(
    private readonly statsService: StatsService,
    private readonly authService: AuthService,
  ) {}

  @Get('orders')
  async getOrderStats(@Req() req: Request): Promise<OrderStatsResponse> {
    this.authService.requireUser(req, ['admin', 'super_admin']);
    return this.statsService.getOrderStats();
  }
}
