import React, { useEffect, useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { toast } from 'sonner';
import { ClipboardList, Wrench, CheckCircle, ArrowRight, Clock } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@client/src/components/ui/card';
import { Button } from '@client/src/components/ui/button';
import { Badge } from '@client/src/components/ui/badge';
import { useAuth } from '@client/src/contexts/AuthContext';
import { ordersApi } from '@client/src/api';
import {
  FAULT_TYPE_LABELS,
  ORDER_STATUS_LABELS,
  type RepairOrder,
  type OrderStatus,
} from '@shared/api.interface';
import { STATUS_VARIANTS } from './status-utils';

const DashboardPage: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [pendingCount, setPendingCount] = useState(0);
  const [repairingCount, setRepairingCount] = useState(0);
  const [completedCount, setCompletedCount] = useState(0);
  const [recentOrders, setRecentOrders] = useState<RepairOrder[]>([]);

  const loadData = async () => {
    setLoading(true);
    try {
      const [pendingRes, repairingRes, completedRes, recentRes] = await Promise.all([
        ordersApi.list({ status: 'pending_repair', pageSize: 100 }),
        ordersApi.list({ status: 'repairing', pageSize: 100 }),
        ordersApi.list({ status: 'completed', pageSize: 100 }),
        ordersApi.list({ page: 1, pageSize: 5 }),
      ]);
      setPendingCount(pendingRes.total);
      setRepairingCount(repairingRes.total);
      setCompletedCount(completedRes.total);
      setRecentOrders(recentRes.items);
    } catch (error) {
      const msg = error instanceof Error ? error.message : '加载失败';
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const statCards = [
    {
      label: '待处理工单',
      value: pendingCount,
      icon: ClipboardList,
      color: 'text-blue-600',
      bg: 'bg-blue-50',
      status: 'pending_repair' as OrderStatus,
    },
    {
      label: '维修中工单',
      value: repairingCount,
      icon: Wrench,
      color: 'text-indigo-600',
      bg: 'bg-indigo-50',
      status: 'repairing' as OrderStatus,
    },
    {
      label: '已完成工单',
      value: completedCount,
      icon: CheckCircle,
      color: 'text-green-600',
      bg: 'bg-green-50',
      status: 'completed' as OrderStatus,
    },
  ];

  if (loading && recentOrders.length === 0) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-muted-foreground">加载中...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">
            你好，{user?.realName}（维修人员）
          </h1>
          <p className="text-muted-foreground mt-1">
            欢迎回来，今天也要加油哦~
          </p>
        </div>
        <Button onClick={() => navigate('/repairer/orders')}>
          我的工单
          <ArrowRight className="w-4 h-4" />
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {statCards.map((card) => {
          const Icon = card.icon;
          return (
            <Card key={card.label} className="rounded-lg shadow-sm">
              <CardContent className="p-5">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-sm text-muted-foreground mb-1">
                      {card.label}
                    </div>
                    <div className="text-3xl font-bold text-slate-900">
                      {card.value}
                    </div>
                  </div>
                  <div className={`w-12 h-12 rounded-lg ${card.bg} flex items-center justify-center`}>
                    <Icon className={`w-6 h-6 ${card.color}`} />
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      <Card className="rounded-lg shadow-sm">
        <CardHeader className="flex flex-row items-center justify-between pb-3">
          <CardTitle className="text-lg">近期工单</CardTitle>
          <Button variant="ghost" size="sm" onClick={() => navigate('/repairer/orders')}>
            查看全部
            <ArrowRight className="w-4 h-4" />
          </Button>
        </CardHeader>
        <CardContent>
          {recentOrders.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              暂无工单
            </div>
          ) : (
            <div className="space-y-2">
              {recentOrders.map((order) => {
                const sv = STATUS_VARIANTS[order.status];
                return (
                  <Link
                    key={order.id}
                    to={`/repairer/orders/${order.id}`}
                    className="flex items-center justify-between p-3 rounded-lg hover:bg-slate-50 transition-colors"
                  >
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                        <Wrench className="w-5 h-5 text-primary" />
                      </div>
                      <div>
                        <div className="font-medium text-slate-900">
                          {order.orderNo}
                        </div>
                        <div className="text-sm text-muted-foreground">
                          {FAULT_TYPE_LABELS[order.faultType]} · {order.dormBuilding}{order.dormRoom}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-4">
                      <Badge variant={sv.variant} className={sv.className}>
                        {ORDER_STATUS_LABELS[order.status]}
                      </Badge>
                      <div className="text-sm text-muted-foreground flex items-center gap-1">
                        <Clock className="w-3.5 h-3.5" />
                        {new Date(order.createdAt).toLocaleDateString('zh-CN')}
                      </div>
                    </div>
                  </Link>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default DashboardPage;
