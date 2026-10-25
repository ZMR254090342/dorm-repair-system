import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { toast } from 'sonner';
import { ArrowLeft, Wrench, XCircle, CheckCircle2, Clock, User } from 'lucide-react';
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
import { Label } from '@client/src/components/ui/label';
import { Textarea } from '@client/src/components/ui/textarea';
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from '@client/src/components/ui/select';
import {
  Dialog,
  DialogTrigger,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@client/src/components/ui/dialog';
import { Image } from '@client/src/components/ui/image';

const STATUS_VARIANTS: Record<OrderStatus, string> = {
  pending_review: 'bg-amber-100 text-amber-700 border-amber-200',
  pending_repair: 'bg-blue-100 text-blue-700 border-blue-200',
  repairing: 'bg-indigo-100 text-indigo-700 border-indigo-200',
  pending_review_done: 'bg-emerald-100 text-emerald-700 border-emerald-200',
  completed: 'bg-emerald-100 text-emerald-700 border-emerald-200',
  rejected: 'bg-red-100 text-red-700 border-red-200',
  cancelled: 'bg-slate-100 text-slate-600 border-slate-200',
};

const STATUS_STEPS: { key: OrderStatus | 'cancelled' | 'rejected'; label: string }[] = [
  { key: 'pending_review', label: '提交报修' },
  { key: 'pending_repair', label: '审核通过' },
  { key: 'repairing', label: '维修中' },
  { key: 'pending_review_done', label: '维修完成' },
  { key: 'completed', label: '已评价' },
];

const OrderDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [order, setOrder] = useState<RepairOrder | null>(null);
  const [repairers, setRepairers] = useState<Array<{ id: string; realName: string; phone?: string }>>([]);
  const [selectedRepairer, setSelectedRepairer] = useState('');
  const [rejectReason, setRejectReason] = useState('');
  const [assignDialogOpen, setAssignDialogOpen] = useState(false);
  const [rejectDialogOpen, setRejectDialogOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const fetchOrder = async () => {
    if (!id) return;
    setLoading(true);
    try {
      const data = await ordersApi.get(id);
      setOrder(data);
    } catch (error: any) {
      toast.error(error.message || '获取工单详情失败');
    } finally {
      setLoading(false);
    }
  };

  const fetchRepairers = async () => {
    try {
      const data = await ordersApi.listRepairers();
      setRepairers(data);
    } catch (error: any) {
      toast.error(error.message || '获取维修人员列表失败');
    }
  };

  useEffect(() => {
    fetchOrder();
  }, [id]);

  const handleAssign = async () => {
    if (!id || !selectedRepairer) {
      toast.error('请选择维修人员');
      return;
    }
    setSubmitting(true);
    try {
      await ordersApi.assign(id, { repairerId: selectedRepairer });
      toast.success('派单成功');
      setAssignDialogOpen(false);
      setSelectedRepairer('');
      fetchOrder();
    } catch (error: any) {
      toast.error(error.message || '派单失败');
    } finally {
      setSubmitting(false);
    }
  };

  const handleReject = async () => {
    if (!id || !rejectReason.trim()) {
      toast.error('请填写驳回原因');
      return;
    }
    setSubmitting(true);
    try {
      await ordersApi.reject(id, { rejectReason: rejectReason.trim() });
      toast.success('驳回成功');
      setRejectDialogOpen(false);
      setRejectReason('');
      fetchOrder();
    } catch (error: any) {
      toast.error(error.message || '驳回失败');
    } finally {
      setSubmitting(false);
    }
  };

  const openAssignDialog = () => {
    fetchRepairers();
    setSelectedRepairer('');
    setAssignDialogOpen(true);
  };

  const getStepIndex = (status: OrderStatus): number => {
    if (status === 'rejected' || status === 'cancelled') return -1;
    const idx = STATUS_STEPS.findIndex((s) => s.key === status);
    return idx >= 0 ? idx : 0;
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

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64 text-muted-foreground">
        加载中...
      </div>
    );
  }

  if (!order) {
    return (
      <div className="flex flex-col items-center justify-center h-64 gap-4">
        <div className="text-muted-foreground">工单不存在</div>
        <Button variant="outline" size="sm" onClick={() => navigate('/admin/orders')}>
          返回列表
        </Button>
      </div>
    );
  }

  const currentStep = getStepIndex(order.status);
  const isRejected = order.status === 'rejected';
  const isCancelled = order.status === 'cancelled';

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="sm" onClick={() => navigate(-1)}>
          <ArrowLeft className="w-4 h-4" />
          返回
        </Button>
        <div className="flex-1 flex items-center gap-3">
          <h1 className="text-xl font-bold text-slate-900 font-mono">{order.orderNo}</h1>
          <Badge
            variant="outline"
            className={STATUS_VARIANTS[order.status]}
          >
            {ORDER_STATUS_LABELS[order.status]}
          </Badge>
        </div>
      </div>

      <Card className="rounded-lg">
        <CardHeader>
          <CardTitle className="text-lg">基本信息</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <div className="text-sm text-muted-foreground mb-1">学生宿舍</div>
              <div className="text-base font-medium text-slate-900">
                {order.dormBuilding} {order.dormRoom}
              </div>
            </div>
            <div>
              <div className="text-sm text-muted-foreground mb-1">故障类型</div>
              <div className="text-base font-medium text-slate-900">
                {FAULT_TYPE_LABELS[order.faultType]}
              </div>
            </div>
            <div>
              <div className="text-sm text-muted-foreground mb-1">提交学生</div>
              <div className="text-base font-medium text-slate-900">
                {order.studentName}
                {order.studentPhone && (
                  <span className="text-muted-foreground text-sm ml-2">
                    {order.studentPhone}
                  </span>
                )}
              </div>
            </div>
            <div>
              <div className="text-sm text-muted-foreground mb-1">提交时间</div>
              <div className="text-base font-medium text-slate-900">
                {formatDate(order.createdAt)}
              </div>
            </div>
            <div className="md:col-span-2">
              <div className="text-sm text-muted-foreground mb-1">故障描述</div>
              <div className="text-base text-slate-900 bg-slate-50 rounded-lg p-4">
                {order.faultDescription}
              </div>
            </div>
            {order.faultImages && order.faultImages.length > 0 && (
              <div className="md:col-span-2">
                <div className="text-sm text-muted-foreground mb-2">故障图片</div>
                <div className="flex flex-wrap gap-2">
                  {order.faultImages.map((img: string, idx: number) => (
                    <Image
                      key={idx}
                      src={img}
                      alt={`故障图片${idx + 1}`}
                      className="w-24 h-24 object-cover rounded-lg border border-slate-200"
                    />
                  ))}
                </div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      <Card className="rounded-lg">
        <CardHeader>
          <CardTitle className="text-lg">工单流转</CardTitle>
        </CardHeader>
        <CardContent>
          {isRejected || isCancelled ? (
            <div className="flex items-center justify-center py-8">
              <div className="flex items-center gap-3">
                {isRejected ? (
                  <XCircle className="w-8 h-8 text-red-500" />
                ) : (
                  <Clock className="w-8 h-8 text-slate-400" />
                )}
                <div>
                  <div className="text-base font-medium text-slate-900">
                    {isRejected ? '工单已驳回' : '工单已取消'}
                  </div>
                  <div className="text-sm text-muted-foreground">
                    {isRejected ? '管理员审核驳回' : '学生已取消报修'}
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="flex items-center justify-between relative px-2">
              <div className="absolute top-5 left-10 right-10 h-0.5 bg-slate-200 -z-10" />
              {STATUS_STEPS.map((step, idx) => {
                const isDone = idx <= currentStep;
                const isCurrent = idx === currentStep;
                return (
                  <div key={step.key} className="flex flex-col items-center relative z-10">
                    <div
                      className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-medium border-2 ${
                        isDone
                          ? 'bg-primary text-primary-foreground border-primary'
                          : 'bg-white text-slate-400 border-slate-200'
                      }`}
                    >
                      {isDone ? <CheckCircle2 className="w-5 h-5" /> : idx + 1}
                    </div>
                    <div
                      className={`text-xs mt-2 ${
                        isCurrent
                          ? 'text-primary font-medium'
                          : isDone
                          ? 'text-slate-700'
                          : 'text-slate-400'
                      }`}
                    >
                      {step.label}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      {order.repairerName && (
        <Card className="rounded-lg">
          <CardHeader>
            <CardTitle className="text-lg">分配信息</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                <User className="w-5 h-5 text-primary" />
              </div>
              <div>
                <div className="text-base font-medium text-slate-900">
                  {order.repairerName}
                </div>
                <div className="text-sm text-muted-foreground">维修人员</div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {isRejected && order.rejectReason && (
        <Card className="rounded-lg border-red-200 bg-red-50">
          <CardHeader>
            <CardTitle className="text-lg text-red-700 flex items-center gap-2">
              <XCircle className="w-5 h-5" />
              驳回原因
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-red-700">{order.rejectReason}</div>
          </CardContent>
        </Card>
      )}

      {(order.repairNote || order.repairResult) && (
        <Card className="rounded-lg">
          <CardHeader>
            <CardTitle className="text-lg">维修信息</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {order.repairNote && (
              <div>
                <div className="text-sm text-muted-foreground mb-1">维修备注</div>
                <div className="text-slate-900">{order.repairNote}</div>
              </div>
            )}
            {order.repairResult && (
              <div>
                <div className="text-sm text-muted-foreground mb-1">维修结果</div>
                <div className="text-slate-900">{order.repairResult}</div>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {order.status === 'pending_review' && (
        <Card className="rounded-lg">
          <CardHeader>
            <CardTitle className="text-lg">审核操作</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-3">
              <Dialog open={assignDialogOpen} onOpenChange={setAssignDialogOpen}>
                <DialogTrigger asChild>
                  <Button onClick={openAssignDialog}>
                    <Wrench className="w-4 h-4" />
                    审核通过并派单
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>分配维修人员</DialogTitle>
                  </DialogHeader>
                  <div className="space-y-4 py-4">
                    <div className="space-y-2">
                      <Label>选择维修人员</Label>
                      <Select value={selectedRepairer} onValueChange={setSelectedRepairer}>
                        <SelectTrigger className="w-full">
                          <SelectValue placeholder="请选择维修人员" />
                        </SelectTrigger>
                        <SelectContent>
                          {repairers.length === 0 ? (
                            <div className="px-2 py-4 text-sm text-muted-foreground text-center">
                              暂无维修人员
                            </div>
                          ) : (
                            repairers.map((r) => (
                              <SelectItem key={r.id} value={r.id}>
                                {r.realName}
                                {r.phone && (
                                  <span className="text-muted-foreground ml-2">{r.phone}</span>
                                )}
                              </SelectItem>
                            ))
                          )}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  <DialogFooter>
                    <Button
                      variant="outline"
                      onClick={() => setAssignDialogOpen(false)}
                      disabled={submitting}
                    >
                      取消
                    </Button>
                    <Button onClick={handleAssign} disabled={submitting}>
                      {submitting ? '提交中...' : '确认派单'}
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>

              <Dialog open={rejectDialogOpen} onOpenChange={setRejectDialogOpen}>
                <DialogTrigger asChild>
                  <Button variant="destructive" onClick={() => setRejectDialogOpen(true)}>
                    <XCircle className="w-4 h-4" />
                    驳回
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>驳回工单</DialogTitle>
                  </DialogHeader>
                  <div className="space-y-4 py-4">
                    <div className="space-y-2">
                      <Label htmlFor="rejectReason">驳回原因</Label>
                      <Textarea
                        id="rejectReason"
                        placeholder="请填写驳回原因"
                        value={rejectReason}
                        onChange={(e) => setRejectReason(e.target.value)}
                        rows={4}
                      />
                    </div>
                  </div>
                  <DialogFooter>
                    <Button
                      variant="outline"
                      onClick={() => setRejectDialogOpen(false)}
                      disabled={submitting}
                    >
                      取消
                    </Button>
                    <Button
                      variant="destructive"
                      onClick={handleReject}
                      disabled={submitting}
                    >
                      {submitting ? '提交中...' : '确认驳回'}
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default OrderDetailPage;
