import type { OrderStatus } from '@shared/api.interface';
import { ORDER_STATUS_LABELS } from '@shared/api.interface';

export const STATUS_VARIANTS: Record<
  OrderStatus,
  { variant: 'default' | 'secondary' | 'destructive' | 'outline'; className: string }
> = {
  pending_review: {
    variant: 'outline',
    className: 'bg-amber-50 text-amber-700 border-amber-200',
  },
  pending_repair: {
    variant: 'default',
    className: '',
  },
  repairing: {
    variant: 'default',
    className: 'bg-indigo-600 border-indigo-600',
  },
  pending_review_done: {
    variant: 'default',
    className: 'bg-green-600 border-green-600',
  },
  completed: {
    variant: 'default',
    className: 'bg-green-600 border-green-600',
  },
  rejected: {
    variant: 'destructive',
    className: '',
  },
  cancelled: {
    variant: 'secondary',
    className: '',
  },
};

export { ORDER_STATUS_LABELS };
