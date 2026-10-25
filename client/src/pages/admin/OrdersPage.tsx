import React, { useState, useEffect } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { toast } from 'sonner';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { ordersApi } from '@client/src/api';
import {
  FAULT_TYPE_LABELS,
  ORDER_STATUS_LABELS,
  type RepairOrder,
  type OrderStatus,
  type FaultType,
} from '@shared/api.interface';
import { Card, CardContent, CardHeader, CardTitle } from '@client/src/components/ui/card';
import { Button } from '@client/src/components/ui/button';
import { Badge } from '@client/src/components/ui/badge';
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from '@client/src/components/ui/select';
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

const OrdersPage: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const [loading, setLoading] = useState(true);
  const [orders, setOrders] = useState<RepairOrder[]>([]);
  const [total, setTotal] = useState(0);
  const page = parseInt(searchParams.get('page') || '1', 10);
  const pageSize = 10;
  const statusFilter = searchParams.get('status') || '';
  const faultTypeFilter = searchParams.get('faultType') || '';

  const fetchOrders = async () => {
    setLoading(true);
    try {
      const params: {
        page: number;
        pageSize: number;
        status?: string;
        faultType?: string;
      } = { page, pageSize };
      if (statusFilter) params.status = statusFilter;
      if (faultTypeFilter) params.faultType = faultTypeFilter;
      const res = await ordersApi.list(params);
      setOrders(res.items);
      setTotal(res.total);
    } catch (error: any) {
      toast.error(error.message || '获取工单列表失败');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrders();
  }, [page, statusFilter, faultTypeFilter]);

  const handleStatusChange = (value: string) => {
    const params = new URLSearchParams(searchParams);
    if (value) {
      params.set('status', value);
    } else {
      params.delete('status');
    }
    params.set('page', '1');
    setSearchParams(params);
  };

  const handleFaultTypeChange = (value: string) => {
    const params = new URLSearchParams(searchParams);
    if (value) {
      params.set('faultType', value);
    } else {
      params.delete('faultType');
    }
    params.set('page', '1');
    setSearchParams(params);
  };

  const totalPages = Math.max(1, Math.ceil(total / pageSize));

  const goToPage = (targetPage: number) => {
    const params = new URLSearchParams(searchParams);
    params.set('page', String(targetPage));
    setSearchParams(params);
  };

  const formatDate = (dateStr: string): string => {
    return new Date(dateStr).toLocaleString('zh-CN', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const statusOptions: { value: string; label: string }[] = [
    { value: '', label: '全部状态' },
    ...Object.entries(ORDER_STATUS_LABELS).map(([value, label]) => ({ value, label })),
  ];

  const faultTypeOptions: { value: string; label: string }[] = [
    { value: '', label: '全部类型' },
    ...Object.entries(FAULT_TYPE_LABELS).map(([value, label]) => ({ value, label })),
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">工单管理</h1>
        <p className="text-sm text-muted-foreground mt-1">管理所有报修工单</p>
      </div>

      <Card className="rounded-lg">
        <CardHeader className="pb-3">
          <div className="flex flex-wrap items-center gap-4">
            <div className="flex items-center gap-2">
              <span className="text-sm text-muted-foreground whitespace-nowrap">状态：</span>
              <Select value={statusFilter} onValueChange={handleStatusChange}>
                <SelectTrigger className="w-40">
                  <SelectValue placeholder="全部状态" />
                </SelectTrigger>
                <SelectContent>
                  {statusOptions.map((opt) => (
                    <SelectItem key={opt.value} value={opt.value}>
                      {opt.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-sm text-muted-foreground whitespace-nowrap">故障类型：</span>
              <Select value={faultTypeFilter} onValueChange={handleFaultTypeChange}>
                <SelectTrigger className="w-40">
                  <SelectValue placeholder="全部类型" />
                </SelectTrigger>
                <SelectContent>
                  {faultTypeOptions.map((opt) => (
                    <SelectItem key={opt.value} value={opt.value}>
                      {opt.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex items-center justify-center h-64 text-muted-foreground">
              加载中...
            </div>
          ) : orders.length === 0 ? (
            <div className="flex items-center justify-center h-64 text-muted-foreground">
              暂无工单数据
            </div>
          ) : (
            <>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>工单号</TableHead>
                    <TableHead>宿舍楼栋/宿舍</TableHead>
                    <TableHead>故障类型</TableHead>
                    <TableHead>状态</TableHead>
                    <TableHead>提交时间</TableHead>
                    <TableHead>维修人员</TableHead>
                    <TableHead>操作</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {orders.map((order) => (
                    <TableRow key={order.id}>
                      <TableCell className="font-mono text-xs">{order.orderNo}</TableCell>
                      <TableCell>{`${order.dormBuilding} ${order.dormRoom}`}</TableCell>
                      <TableCell>{FAULT_TYPE_LABELS[order.faultType as FaultType]}</TableCell>
                      <TableCell>
                        <Badge
                          variant="outline"
                          className={STATUS_VARIANTS[order.status as OrderStatus]}
                        >
                          {ORDER_STATUS_LABELS[order.status as OrderStatus]}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-muted-foreground text-xs">
                        {formatDate(order.createdAt)}
                      </TableCell>
                      <TableCell>{order.repairerName || '-'}</TableCell>
                      <TableCell>
                        {order.status === 'pending_review' ? (
                          <Link
                            to={`/admin/orders/${order.id}`}
                            className="text-primary hover:underline text-sm font-medium"
                          >
                            审核
                          </Link>
                        ) : (
                          <Link
                            to={`/admin/orders/${order.id}`}
                            className="text-primary hover:underline text-sm"
                          >
                            查看详情
                          </Link>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>

              <div className="flex items-center justify-between mt-4 pt-4 border-t border-slate-100">
                <div className="text-sm text-muted-foreground">
                  共 {total} 条，第 {page} / {totalPages} 页
                </div>
                <div className="flex items-center gap-1">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => goToPage(page - 1)}
                    disabled={page <= 1}
                  >
                    <ChevronLeft className="w-4 h-4" />
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => goToPage(page + 1)}
                    disabled={page >= totalPages}
                  >
                    <ChevronRight className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default OrdersPage;
