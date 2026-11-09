import type { OrderStatus } from '@shared/api.interface';
import { ORDER_STATUS_LABELS } from '@shared/api.interface';

export type StatusBadgeVariant = 'default' | 'secondary' | 'destructive' | 'outline';

export const STATUS_BADGE_VARIANT: Record<OrderStatus, StatusBadgeVariant> = {
  pending_review: 'secondary',
  pending_repair: 'default',
  repairing: 'outline',
  pending_review_done: 'default',
  completed: 'default',
  rejected: 'destructive',
  cancelled: 'secondary',
};

export const STATUS_BADGE_CLASS: Record<OrderStatus, string> = {
  pending_review: 'bg-slate-100 text-slate-700 border-slate-200',
  pending_repair: 'bg-blue-100 text-blue-700 border-blue-200',
  repairing: 'bg-orange-100 text-orange-700 border-orange-200',
  pending_review_done: 'bg-emerald-100 text-emerald-700 border-emerald-200',
  completed: 'bg-green-100 text-green-700 border-green-200',
  rejected: 'bg-red-100 text-red-700 border-red-200',
  cancelled: 'bg-slate-100 text-slate-500 border-slate-200',
};

export { ORDER_STATUS_LABELS };
