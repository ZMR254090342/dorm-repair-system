import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import {
  ClipboardList,
  CheckCircle2,
  Star,
  PlusCircle,
  ArrowRight,
  Wrench,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@client/src/components/ui/card';
import { Button } from '@client/src/components/ui/button';
import { Badge } from '@client/src/components/ui/badge';
import { useAuth } from '@client/src/contexts/AuthContext';
import { ordersApi } from '@client/src/api';
import {
  FAULT_TYPE_LABELS,
  ORDER_STATUS_LABELS,
  type OrderStatus,
  type RepairOrder,
} from '@shared/api.interface';

const STATUS_VARIANTS: Record<OrderStatus, string> = {
  pending_review: 'bg-amber-100 text-amber-700 border-amber-200',
  pending_repair: 'bg-blue-100 text-blue-700 border-blue-200',
  repairing: 'bg-indigo-100 text-indigo-700 border-indigo-200',
  pending_review_done: 'bg-emerald-100 text-emerald-700 border-emerald-200',
  completed: 'bg-emerald-100 text-emerald-700 border-emerald-200',
  rejected: 'bg-red-100 text-red-700 border-red-200',
  cancelled: 'bg-slate-100 text-slate-600 border-slate-200',
};

const PENDING_STATUSES: OrderStatus[] = [
  'pending_review',
  'pending_repair',
  'repairing',
];

const DashboardPage: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [recentOrders, setRecentOrders] = useState<RepairOrder[]>([]);
  const [pendingCount, setPendingCount] = useState(0);
  const [completedCount, setCompletedCount] = useState(0);
  const [reviewCount, setReviewCount] = useState(0);

  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true);
        const res = await ordersApi.list({ page: 1, pageSize: 100 });
        const allOrders = res.items;

        const pending = allOrders.filter((o: RepairOrder) =>
          PENDING_STATUSES.includes(o.status)
        ).length;
        const completed = allOrders.filter(
          (o: RepairOrder) => o.status === 'completed'
        ).length;

        setPendingCount(pending);
        setCompletedCount(completed);
        setReviewCount(completed);
        setRecentOrders(allOrders.slice(0, 5));
      } catch (error) {
        toast.error(error instanceof Error ? error.message : '加载失败');
      } finally {
        setLoading(false);
      }
    };
    loadData();
  }, []);

  const statCards = [
    {
      label: '待处理工单',
      value: pendingCount,
      icon: Wrench,
      color: 'text-amber-600',
      bg: 'bg-amber-50',
    },
    {
      label: '已完成工单',
      value: completedCount,
      icon: CheckCircle2,
      color: 'text-emerald-600',
      bg: 'bg-emerald-50',
    },
    {
      label: '我的评价数',
      value: reviewCount,
      icon: Star,
      color: 'text-primary',
      bg: 'bg-primary/10',
    },
  ];

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="text-muted-foreground">加载中...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-slate-900">
            你好，{user?.realName || '同学'}
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            欢迎使用宿舍报修管理系统
          </p>
        </div>
        <Button onClick={() => navigate('/student/submit')}>
          <PlusCircle className="w-4 h-4" />
          快速报修
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {statCards.map((card) => {
          const Icon = card.icon;
          return (
            <Card key={card.label} className="rounded-lg">
              <CardContent className="p-5 flex items-center gap-4">
                <div className={`w-12 h-12 rounded-lg ${card.bg} flex items-center justify-center`}>
                  <Icon className={`w-6 h-6 ${card.color}`} />
                </div>
                <div>
                  <div className="text-2xl font-semibold text-slate-900">
                    {card.value}
                  </div>
                  <div className="text-sm text-muted-foreground mt-0.5">
                    {card.label}
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      <Card className="rounded-lg">
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <CardTitle className="text-lg font-semibold">近期工单</CardTitle>
          <Link
            to="/student/orders"
            className="text-sm text-primary hover:underline flex items-center gap-1"
          >
            查看全部
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </CardHeader>
        <CardContent>
          {recentOrders.length === 0 ? (
            <div className="py-10 text-center text-muted-foreground">
              <ClipboardList className="w-10 h-10 mx-auto mb-2 opacity-30" />
              <p>暂无报修记录</p>
              <Button
                variant="outline"
                size="sm"
                className="mt-3"
                onClick={() => navigate('/student/submit')}
              >
                <PlusCircle className="w-4 h-4" />
                立即报修
              </Button>
            </div>
          ) : (
            <div className="space-y-2">
              {recentOrders.map((order: RepairOrder) => (
                <Link
                  key={order.id}
                  to={`/student/orders/${order.id}`}
                  className="flex items-center justify-between p-3 rounded-lg hover:bg-slate-50 transition-colors border border-transparent hover:border-slate-100"
                >
                  <div className="flex items-center gap-4">
                    <div>
                      <div className="font-medium text-slate-900 text-sm">
                        {order.orderNo}
                      </div>
                      <div className="text-xs text-muted-foreground mt-0.5">
                        {FAULT_TYPE_LABELS[order.faultType]}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="text-right">
                      <Badge
                        variant="outline"
                        className={STATUS_VARIANTS[order.status]}
                      >
                        {ORDER_STATUS_LABELS[order.status]}
                      </Badge>
                      <div className="text-xs text-muted-foreground mt-1.5">
                        {new Date(order.createdAt).toLocaleString('zh-CN')}
                      </div>
                    </div>
                    <ArrowRight className="w-4 h-4 text-slate-400" />
                  </div>
                </Link>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default DashboardPage;
