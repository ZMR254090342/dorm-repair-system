import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { Eye, ChevronLeft, ChevronRight } from 'lucide-react';
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
import { ordersApi } from '@client/src/api';
import {
  FAULT_TYPE_LABELS,
  ORDER_STATUS_LABELS,
  type RepairOrder,
  type OrderStatus,
} from '@shared/api.interface';
import { STATUS_VARIANTS } from './status-utils';

const STATUS_FILTERS: { value: string; label: string }[] = [
  { value: '', label: '全部' },
  { value: 'pending_repair', label: '待维修' },
  { value: 'repairing', label: '维修中' },
  { value: 'completed', label: '已完成' },
  { value: 'pending_review_done', label: '待评价' },
];

const OrdersPage: React.FC = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [orders, setOrders] = useState<RepairOrder[]>([]);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [pageSize] = useState(10);
  const [statusFilter, setStatusFilter] = useState('');

  const totalPages = Math.ceil(total / pageSize);

  const loadOrders = async () => {
    setLoading(true);
    try {
      const params: { status?: string; page: number; pageSize: number } = {
        page,
        pageSize,
      };
      if (statusFilter) params.status = statusFilter;
      const res = await ordersApi.list(params);
      setOrders(res.items);
      setTotal(res.total);
    } catch (error) {
      const msg = error instanceof Error ? error.message : '加载失败';
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadOrders();
  }, [page, statusFilter]);

  const handleStatusChange = (value: string) => {
    setStatusFilter(value);
    setPage(1);
  };

  const handlePrev = () => {
    if (page > 1) setPage(page - 1);
  };

  const handleNext = () => {
    if (page < totalPages) setPage(page + 1);
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-slate-900">我的工单</h1>
      </div>

      <Card className="rounded-lg shadow-sm">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg">工单列表</CardTitle>
            <div className="flex items-center gap-3">
              <div className="text-sm text-muted-foreground">状态筛选：</div>
              <Select value={statusFilter} onValueChange={handleStatusChange}>
                <SelectTrigger className="w-36">
                  <SelectValue placeholder="全部" />
                </SelectTrigger>
                <SelectContent>
                  {STATUS_FILTERS.map((f) => (
                    <SelectItem key={f.value} value={f.value}>
                      {f.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <div className="text-muted-foreground">加载中...</div>
            </div>
          ) : orders.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              暂无工单数据
            </div>
          ) : (
            <>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>工单号</TableHead>
                    <TableHead>故障类型</TableHead>
                    <TableHead>宿舍楼栋/宿舍</TableHead>
                    <TableHead>状态</TableHead>
                    <TableHead>提交时间</TableHead>
                    <TableHead>操作</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {orders.map((order) => {
                    const sv = STATUS_VARIANTS[order.status as OrderStatus];
                    return (
                      <TableRow key={order.id}>
                        <TableCell className="font-medium">
                          {order.orderNo}
                        </TableCell>
                        <TableCell>
                          {FAULT_TYPE_LABELS[order.faultType]}
                        </TableCell>
                        <TableCell>
                          {order.dormBuilding} {order.dormRoom}
                        </TableCell>
                        <TableCell>
                          <Badge variant={sv.variant} className={sv.className}>
                            {ORDER_STATUS_LABELS[order.status as OrderStatus]}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-muted-foreground">
                          {new Date(order.createdAt).toLocaleString('zh-CN')}
                        </TableCell>
                        <TableCell>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => navigate(`/repairer/orders/${order.id}`)}
                          >
                            <Eye className="w-3.5 h-3.5 mr-1" />
                            处理
                          </Button>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>

              <div className="flex items-center justify-between mt-4 pt-4 border-t border-slate-100">
                <div className="text-sm text-muted-foreground">
                  共 {total} 条记录
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handlePrev}
                    disabled={page <= 1}
                  >
                    <ChevronLeft className="w-4 h-4" />
                    上一页
                  </Button>
                  <div className="text-sm text-muted-foreground px-2">
                    第 {page} / {totalPages || 1} 页
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleNext}
                    disabled={page >= totalPages}
                  >
                    下一页
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
