import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import {
  ArrowLeft,
  Wrench,
  CheckCircle,
  Clock,
  MapPin,
  User,
  FileText,
  Star,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@client/src/components/ui/card';
import { Button } from '@client/src/components/ui/button';
import { Badge } from '@client/src/components/ui/badge';
import { Label } from '@client/src/components/ui/label';
import { Textarea } from '@client/src/components/ui/textarea';
import { ordersApi } from '@client/src/api';
import {
  FAULT_TYPE_LABELS,
  ORDER_STATUS_LABELS,
  type RepairOrder,
  type ReviewInfo,
  type OrderStatus,
} from '@shared/api.interface';
import { STATUS_VARIANTS } from './status-utils';

const TIMELINE_STEPS: OrderStatus[] = [
  'pending_review',
  'pending_repair',
  'repairing',
  'pending_review_done',
];

const TIMELINE_LABELS: Record<OrderStatus, string> = {
  pending_review: '提交工单',
  pending_repair: '派单成功',
  repairing: '维修中',
  pending_review_done: '维修完成',
  completed: '已完成',
  rejected: '已驳回',
  cancelled: '已取消',
};

const OrderDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [order, setOrder] = useState<RepairOrder | null>(null);
  const [review, setReview] = useState<ReviewInfo | null>(null);
  const [repairNote, setRepairNote] = useState('');
  const [repairResult, setRepairResult] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const loadData = async () => {
    if (!id) return;
    setLoading(true);
    try {
      const [orderRes, reviewRes] = await Promise.all([
        ordersApi.get(id),
        ordersApi.getReview(id).catch(() => ({ review: null })),
      ]);
      setOrder(orderRes);
      setReview(reviewRes.review);
      setRepairNote(orderRes.repairNote || '');
      setRepairResult(orderRes.repairResult || '');
    } catch (error) {
      const msg = error instanceof Error ? error.message : '加载失败';
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [id]);

  const getCurrentStepIndex = (status: OrderStatus): number => {
    const idx = TIMELINE_STEPS.indexOf(status);
    if (idx !== -1) return idx;
    if (status === 'completed') return TIMELINE_STEPS.length - 1;
    return -1;
  };

  const handleStartRepair = async () => {
    if (!id) return;
    setSubmitting(true);
    try {
      await ordersApi.updateStatus(id, { status: 'repairing' });
      toast.success('已开始维修');
      loadData();
    } catch (error) {
      const msg = error instanceof Error ? error.message : '操作失败';
      toast.error(msg);
    } finally {
      setSubmitting(false);
    }
  };

  const handleCompleteRepair = async () => {
    if (!id) return;
    if (!repairResult.trim()) {
      toast.error('请填写维修结果');
      return;
    }
    setSubmitting(true);
    try {
      await ordersApi.updateStatus(id, {
        status: 'pending_review_done',
        repairNote: repairNote.trim() || undefined,
        repairResult: repairResult.trim(),
      });
      toast.success('维修完成，已提交待评价');
      loadData();
    } catch (error) {
      const msg = error instanceof Error ? error.message : '操作失败';
      toast.error(msg);
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-muted-foreground">加载中...</div>
      </div>
    );
  }

  if (!order) {
    return (
      <div className="text-center py-12 text-muted-foreground">
        工单不存在
      </div>
    );
  }

  const sv = STATUS_VARIANTS[order.status];
  const currentStepIdx = getCurrentStepIndex(order.status);
  const showAction =
    order.status === 'pending_repair' || order.status === 'repairing';
  const showRepairInfo =
    order.status !== 'pending_review' && order.status !== 'pending_repair';

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3">
        <Button
          variant="outline"
          size="icon"
          onClick={() => navigate('/repairer/orders')}
          aria-label="返回"
        >
          <ArrowLeft className="w-4 h-4" />
        </Button>
        <div className="flex-1">
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold text-slate-900">
              {order.orderNo}
            </h1>
            <Badge variant={sv.variant} className={sv.className}>
              {ORDER_STATUS_LABELS[order.status]}
            </Badge>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="lg:col-span-2 space-y-4">
          <Card className="rounded-lg shadow-sm">
            <CardHeader>
              <CardTitle className="text-lg">基本信息</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <div className="text-sm text-muted-foreground mb-1 flex items-center gap-1.5">
                    <MapPin className="w-4 h-4" />
                    宿舍楼栋
                  </div>
                  <div className="font-medium">{order.dormBuilding}</div>
                </div>
                <div>
                  <div className="text-sm text-muted-foreground mb-1 flex items-center gap-1.5">
                    <MapPin className="w-4 h-4" />
                    宿舍号
                  </div>
                  <div className="font-medium">{order.dormRoom}</div>
                </div>
                <div>
                  <div className="text-sm text-muted-foreground mb-1 flex items-center gap-1.5">
                    <Wrench className="w-4 h-4" />
                    故障类型
                  </div>
                  <div className="font-medium">
                    {FAULT_TYPE_LABELS[order.faultType]}
                  </div>
                </div>
                <div>
                  <div className="text-sm text-muted-foreground mb-1 flex items-center gap-1.5">
                    <User className="w-4 h-4" />
                    提交学生
                  </div>
                  <div className="font-medium">{order.studentName}</div>
                </div>
              </div>
              <div>
                <div className="text-sm text-muted-foreground mb-1 flex items-center gap-1.5">
                  <FileText className="w-4 h-4" />
                  故障描述
                </div>
                <div className="p-3 bg-slate-50 rounded-md text-sm">
                  {order.faultDescription}
                </div>
              </div>
              <div>
                <div className="text-sm text-muted-foreground mb-1 flex items-center gap-1.5">
                  <Clock className="w-4 h-4" />
                  提交时间
                </div>
                <div className="font-medium">
                  {new Date(order.createdAt).toLocaleString('zh-CN')}
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="rounded-lg shadow-sm">
            <CardHeader>
              <CardTitle className="text-lg">工单进度</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {TIMELINE_STEPS.map((step, idx) => {
                  const isDone = currentStepIdx >= idx;
                  const isCurrent = currentStepIdx === idx;
                  return (
                    <div key={step} className="flex items-start gap-3">
                      <div className="flex flex-col items-center">
                        <div
                          className={`w-8 h-8 rounded-full flex items-center justify-center ${
                            isDone
                              ? 'bg-primary text-white'
                              : 'bg-slate-200 text-slate-500'
                          }`}
                        >
                          {isDone ? (
                            <CheckCircle className="w-4 h-4" />
                          ) : (
                            <span className="text-xs font-medium">
                              {idx + 1}
                            </span>
                          )}
                        </div>
                        {idx < TIMELINE_STEPS.length - 1 && (
                          <div
                            className={`w-0.5 flex-1 mt-1 ${
                              isDone && currentStepIdx > idx
                                ? 'bg-primary'
                                : 'bg-slate-200'
                            }`}
                            style={{ height: '24px' }}
                          />
                        )}
                      </div>
                      <div className="pt-1">
                        <div
                          className={`font-medium ${
                            isCurrent ? 'text-primary' : 'text-slate-900'
                          }`}
                        >
                          {TIMELINE_LABELS[step]}
                        </div>
                        <div className="text-xs text-muted-foreground mt-0.5">
                          {isDone ? '已完成' : '待进行'}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>

          {showRepairInfo && (
            <Card className="rounded-lg shadow-sm">
              <CardHeader>
                <CardTitle className="text-lg">维修结果</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <div className="text-sm text-muted-foreground mb-1">
                    维修备注
                  </div>
                  <div className="p-3 bg-slate-50 rounded-md text-sm whitespace-pre-wrap">
                    {order.repairNote || '暂无备注'}
                  </div>
                </div>
                <div>
                  <div className="text-sm text-muted-foreground mb-1">
                    维修结果说明
                  </div>
                  <div className="p-3 bg-slate-50 rounded-md text-sm whitespace-pre-wrap">
                    {order.repairResult || '暂无结果说明'}
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {showAction && (
            <Card className="rounded-lg shadow-sm border-primary/30">
              <CardHeader>
                <CardTitle className="text-lg">操作区</CardTitle>
              </CardHeader>
              <CardContent>
                {order.status === 'pending_repair' && (
                  <div className="text-center py-4">
                    <p className="text-muted-foreground mb-4">
                      请确认工单信息无误后，点击开始维修
                    </p>
                    <Button onClick={handleStartRepair} disabled={submitting}>
                      {submitting ? '处理中...' : '开始维修'}
                    </Button>
                  </div>
                )}

                {order.status === 'repairing' && (
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="repairNote">维修备注（可选）</Label>
                      <Textarea
                        id="repairNote"
                        value={repairNote}
                        onChange={(e) => setRepairNote(e.target.value)}
                        placeholder="请输入维修备注信息"
                        rows={3}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="repairResult">
                        维修结果说明 <span className="text-destructive">*</span>
                      </Label>
                      <Textarea
                        id="repairResult"
                        value={repairResult}
                        onChange={(e) => setRepairResult(e.target.value)}
                        placeholder="请详细描述维修结果"
                        rows={4}
                      />
                    </div>
                    <div className="flex justify-end">
                      <Button
                        onClick={handleCompleteRepair}
                        disabled={submitting}
                      >
                        {submitting ? '提交中...' : '完成维修'}
                      </Button>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          )}
        </div>

        <div className="space-y-4">
          {review && (
            <Card className="rounded-lg shadow-sm">
              <CardHeader>
                <CardTitle className="text-lg">学生评价</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-center gap-1">
                  {[1, 2, 3, 4, 5].map((i) => (
                    <Star
                      key={i}
                      className={`w-5 h-5 ${
                        i <= review.rating
                          ? 'text-yellow-400 fill-yellow-400'
                          : 'text-slate-300'
                      }`}
                    />
                  ))}
                  <span className="ml-2 text-sm font-medium">
                    {review.rating} 星
                  </span>
                </div>
                {review.content ? (
                  <div className="p-3 bg-slate-50 rounded-md text-sm whitespace-pre-wrap">
                    {review.content}
                  </div>
                ) : (
                  <div className="text-sm text-muted-foreground">
                    暂无文字评价
                  </div>
                )}
                <div className="text-xs text-muted-foreground">
                  评价时间：{new Date(review.createdAt).toLocaleString('zh-CN')}
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
};

export default OrderDetailPage;
