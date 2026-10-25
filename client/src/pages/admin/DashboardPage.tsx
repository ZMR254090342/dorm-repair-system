import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import {
  ClipboardList,
  Clock,
  Wrench,
  CheckCircle2,
  ChevronRight,
  BarChart3,
} from 'lucide-react';
import { ordersApi } from '@client/src/api';
import {
  FAULT_TYPE_LABELS,
  ORDER_STATUS_LABELS,
  type RepairOrder,
  type OrderStatus,
} from '@shared/api.interface';
import { Card, CardContent, CardHeader, CardTitle } from '@client/src/components/ui/card';
import { Button } from '@client/src/components/ui/button';
import { Badge } from '@client/src/components/ui/badge';
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableCell,
  TableHead,
} from '@client/src/components/ui/table';

const STATUS_VARIANTS: Record<OrderStatus, string> = {
  pending_review: 'bg-amber-100 text-amber-700 border-amber-200',
  pending_repair: 'bg-blue-100 text-blue-700 border-blue-200',
  repairing: 'bg-indigo-100 text-indigo-700 border-indigo-200',
  pending_review_done: 'bg-emerald-100 text-emerald-700 border-emerald-200',
  completed: 'bg-emerald-100 text-emerald-700 border-emerald-200',
  rejected: 'bg-red-100 text-red-700 border-red-200',
  cancelled: 'bg-slate-100 text-slate-600 border-slate-200',
};

const DashboardPage: React.FC = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [recentOrders, setRecentOrders] = useState<RepairOrder[]>([]);
  const [stats, setStats] = useState({
    total: 0,
    pendingReview: 0,
    repairing: 0,
    completed: 0,
  });

  const fetchData = async () => {
    setLoading(true);
    try {
      const res = await ordersApi.list({ page: 1, pageSize: 10 });
      setRecentOrders(res.items);

      let pendingReview = 0;
      let repairing = 0;
      let completed = 0;
      let page = 1;
      const pageSize = 50;
      let hasMore = true;
      let totalCount = 0;

      while (hasMore) {
        const pageRes = await ordersApi.list({ page, pageSize });
        totalCount = pageRes.total;
        for (const order of pageRes.items) {
          if (order.status === 'pending_review') pendingReview++;
          if (order.status === 'repairing') repairing++;
          if (order.status === 'completed') completed++;
        }
        if (page * pageSize >= pageRes.total) {
          hasMore = false;
        } else {
          page++;
        }
      }

      setStats({
        total: totalCount,
        pendingReview,
        repairing,
        completed,
      });
    } catch (error: any) {
      toast.error(error.message || '获取数据失败');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const statCards = [
    {
      label: '总工单数',
      value: stats.total,
      icon: ClipboardList,
      color: 'bg-primary/10 text-primary',
    },
    {
      label: '待审核',
      value: stats.pendingReview,
      icon: Clock,
      color: 'bg-amber-100 text-amber-600',
    },
    {
      label: '维修中',
      value: stats.repairing,
      icon: Wrench,
      color: 'bg-indigo-100 text-indigo-600',
    },
    {
      label: '已完成',
      value: stats.completed,
      icon: CheckCircle2,
      color: 'bg-emerald-100 text-emerald-600',
    },
  ];

  const formatDate = (dateStr: string): string => {
    return new Date(dateStr).toLocaleString('zh-CN', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">管理后台</h1>
          <p className="text-sm text-muted-foreground mt-1">欢迎回来，查看工单概览</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {statCards.map((card) => {
          const Icon = card.icon;
          return (
            <Card key={card.label} className="rounded-lg">
              <CardContent className="p-5">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">{card.label}</p>
                    <p className="text-3xl font-bold text-slate-900 mt-1">
                      {loading ? '--' : card.value}
                    </p>
                  </div>
                  <div className={`w-12 h-12 rounded-lg flex items-center justify-center ${card.color}`}>
                    <Icon className="w-6 h-6" />
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      <div className="flex items-center gap-3">
        <Button onClick={() => navigate('/admin/orders')}>
          <ClipboardList className="w-4 h-4" />
          工单管理
        </Button>
        <Button variant="outline" onClick={() => navigate('/admin/stats')}>
          <BarChart3 className="w-4 h-4" />
          数据统计
        </Button>
      </div>

      <Card className="rounded-lg">
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <CardTitle className="text-lg">近期工单</CardTitle>
          <Link
            to="/admin/orders"
            className="text-sm text-primary hover:underline flex items-center"
          >
            查看全部
            <ChevronRight className="w-4 h-4" />
          </Link>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex items-center justify-center h-48 text-muted-foreground">
              加载中...
            </div>
          ) : recentOrders.length === 0 ? (
            <div className="flex items-center justify-center h-48 text-muted-foreground">
              暂无工单
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>工单号</TableHead>
                  <TableHead>学生宿舍</TableHead>
                  <TableHead>故障类型</TableHead>
                  <TableHead>状态</TableHead>
                  <TableHead>提交时间</TableHead>
                  <TableHead>操作</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {recentOrders.map((order) => (
                  <TableRow key={order.id}>
                    <TableCell className="font-mono text-xs">{order.orderNo}</TableCell>
                    <TableCell>{`${order.dormBuilding} ${order.dormRoom}`}</TableCell>
                    <TableCell>{FAULT_TYPE_LABELS[order.faultType]}</TableCell>
                    <TableCell>
                      <Badge
                        variant="outline"
                        className={STATUS_VARIANTS[order.status]}
                      >
                        {ORDER_STATUS_LABELS[order.status]}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-muted-foreground text-xs">
                      {formatDate(order.createdAt)}
                    </TableCell>
                    <TableCell>
                      <Link
                        to={`/admin/orders/${order.id}`}
                        className="text-primary hover:underline text-sm"
                      >
                        查看详情
                      </Link>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default DashboardPage;
