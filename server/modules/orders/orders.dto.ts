import {
  IsString,
  IsOptional,
  IsArray,
  IsIn,
  IsInt,
  Min,
  Max,
} from 'class-validator';
import { Type } from 'class-transformer';
import type {
  CreateOrderRequest,
  AssignOrderRequest,
  RejectOrderRequest,
  UpdateOrderStatusRequest,
  CreateReviewRequest,
  FaultType,
  OrderStatus,
} from '@shared/api.interface';

const FAULT_TYPES: FaultType[] = ['water_electric', 'furniture', 'door_window', 'network', 'other'];
const STATUS_VALUES: OrderStatus[] = [
  'pending_review', 'pending_repair', 'repairing', 'pending_review_done',
  'completed', 'rejected', 'cancelled',
];

export class CreateOrderDto implements CreateOrderRequest {
  @IsString()
  dormBuilding!: string;

  @IsString()
  dormRoom!: string;

  @IsString()
  @IsIn(FAULT_TYPES)
  faultType!: FaultType;

  @IsString()
  faultDescription!: string;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  faultImages?: string[];
}

export class AssignOrderDto implements AssignOrderRequest {
  @IsString()
  repairerId!: string;
}

export class RejectOrderDto implements RejectOrderRequest {
  @IsString()
  rejectReason!: string;
}

export class UpdateOrderStatusDto implements UpdateOrderStatusRequest {
  @IsString()
  @IsIn(['repairing', 'pending_review_done'])
  status!: 'repairing' | 'pending_review_done';

  @IsOptional()
  @IsString()
  repairNote?: string;

  @IsOptional()
  @IsString()
  repairResult?: string;
}

export class CreateReviewDto implements CreateReviewRequest {
  @IsString()
  orderId!: string;

  @IsInt()
  @Type(() => Number)
  @Min(1)
  @Max(5)
  rating!: number;

  @IsOptional()
  @IsString()
  content?: string;
}

export class OrderListQueryDto {
  @IsOptional()
  @IsString()
  @IsIn(STATUS_VALUES)
  status?: OrderStatus;

  @IsOptional()
  @IsString()
  @IsIn(FAULT_TYPES)
  faultType?: FaultType;

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
