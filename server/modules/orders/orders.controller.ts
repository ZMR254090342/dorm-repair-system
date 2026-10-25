import { Controller, Get, Post, Patch, Body, Param, Query, Req } from '@nestjs/common';
import type { Request } from 'express';
import { OrdersService } from './orders.service';
import { AuthService } from '../auth/auth.service';
import {
  CreateOrderDto,
  AssignOrderDto,
  RejectOrderDto,
  UpdateOrderStatusDto,
  CreateReviewDto,
  OrderListQueryDto,
} from './orders.dto';
import type {
  RepairOrder,
  OrderListResponse,
  ReviewInfo,
  UserRole,
} from '@shared/api.interface';

@Controller('api/orders')
export class OrdersController {
  constructor(
    private readonly ordersService: OrdersService,
    private readonly authService: AuthService,
  ) {}

  @Post()
  async createOrder(@Req() req: Request, @Body() dto: CreateOrderDto): Promise<RepairOrder> {
    const { userId, role } = this.authService.requireUser(req, ['student']);
    return this.ordersService.createOrder(userId, dto);
  }

  @Get()
  async listOrders(
    @Req() req: Request,
    @Query() query: OrderListQueryDto,
  ): Promise<OrderListResponse> {
    const { userId, role } = this.authService.requireUser(req);
    return this.ordersService.listOrders({
      role,
      userId,
      status: query.status,
      faultType: query.faultType,
      page: query.page,
      pageSize: query.pageSize,
    });
  }

  @Get('repairers')
  async listRepairers(@Req() req: Request): Promise<Array<{ id: string; realName: string; phone?: string }>> {
    this.authService.requireUser(req, ['admin']);
    return this.ordersService.listRepairers();
  }

  @Get(':id')
  async getOrderDetail(@Req() req: Request, @Param('id') id: string): Promise<RepairOrder> {
    const { userId, role } = this.authService.requireUser(req);
    if (role === 'student' || role === 'repairer') {
      await this.ordersService.checkOrderPermission(id, userId, role as UserRole);
    }
    return this.ordersService.getOrderDetail(id);
  }

  @Patch(':id/assign')
  async assignOrder(
    @Req() req: Request,
    @Param('id') id: string,
    @Body() dto: AssignOrderDto,
  ): Promise<RepairOrder> {
    this.authService.requireUser(req, ['admin', 'super_admin']);
    return this.ordersService.assignOrder(id, dto.repairerId);
  }

  @Patch(':id/reject')
  async rejectOrder(
    @Req() req: Request,
    @Param('id') id: string,
    @Body() dto: RejectOrderDto,
  ): Promise<RepairOrder> {
    this.authService.requireUser(req, ['admin', 'super_admin']);
    return this.ordersService.rejectOrder(id, dto.rejectReason);
  }

  @Patch(':id/status')
  async updateOrderStatus(
    @Req() req: Request,
    @Param('id') id: string,
    @Body() dto: UpdateOrderStatusDto,
  ): Promise<RepairOrder> {
    const { userId } = this.authService.requireUser(req, ['repairer']);
    return this.ordersService.updateOrderStatus(id, userId, dto);
  }

  @Patch(':id/cancel')
  async cancelOrder(@Req() req: Request, @Param('id') id: string): Promise<RepairOrder> {
    const { userId } = this.authService.requireUser(req, ['student']);
    return this.ordersService.cancelOrder(id, userId);
  }

  @Post('review')
  async createReview(@Req() req: Request, @Body() dto: CreateReviewDto): Promise<ReviewInfo> {
    const { userId } = this.authService.requireUser(req, ['student']);
    return this.ordersService.createReview(userId, dto);
  }

  @Get(':id/review')
  async getOrderReview(@Req() req: Request, @Param('id') id: string): Promise<{ review: ReviewInfo | null }> {
    const { userId, role } = this.authService.requireUser(req);
    if (role === 'student' || role === 'repairer') {
      await this.ordersService.checkOrderPermission(id, userId, role as UserRole);
    }
    const review = await this.ordersService.getReviewByOrder(id);
    return { review };
  }
}
