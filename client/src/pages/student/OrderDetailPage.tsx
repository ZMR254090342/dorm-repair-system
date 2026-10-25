import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { toast } from 'sonner';
import {
  ArrowLeft,
  Clock,
  UserCheck,
  Wrench,
  CheckCircle2,
  Star,
  XCircle,
  AlertCircle,
  FileText,
  Send,
} from 'lucide-react';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@client/src/components/ui/card';
import { Button } from '@client/src/components/ui/button';
import { Badge } from '@client/src/components/ui/badge';
import { Textarea } from '@client/src/components/ui/textarea';
import { Label } from '@client/src/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@client/src/components/ui/dialog';
import { ordersApi } from '@client/src/api';
import {
  FAULT_TYPE_LABELS,
  ORDER_STATUS_LABELS,
  type OrderStatus,
  type RepairOrder,
  type ReviewInfo,
  type CreateReviewRequest,
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

const OrderDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [order, setOrder] = useState<RepairOrder | null>(null);
  const [review, setReview] = useState<ReviewInfo | null>(null);
  const [cancelDialogOpen, setCancelDialogOpen] = useState(false);
  const [cancelling, setCancelling] = useState(false);
  const [rating, setRating] = useState(5);
  const [reviewContent, setReviewContent] = useState('');
  const [submittingReview, setSubmittingReview] = useState(false);

  const loadData = async () => {
    if (!id) return;
    try {
      setLoading(true);
      const [orderData, reviewData] = await Promise.all([
        ordersApi.get(id),
        ordersApi.getReview(id).catch(() => ({ review: null })),
      ]);
      setOrder(orderData);
      setReview(reviewData.review);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : '加载失败');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [id]);

  const handleCancel = async () => {
    if (!id) return;
    try {
      setCancelling(true);
      await ordersApi.cancel(id);
      toast.success('工单已取消');
      setCancelDialogOpen(false);
      loadData();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : '取消失败');
    } finally {
      setCancelling(false);
    }
  };

  const handleSubmitReview = async () => {
    if (!id) return;
    if (rating < 1 || rating > 5) {
      toast.error('请选择星级');
      return;
    }
    try {
      setSubmittingReview(true);
      const data: CreateReviewRequest = {
        orderId: id,
        rating,
        content: reviewContent,
      };
      const newReview = await ordersApi.createReview(data);
      setReview(newReview);
      toast.success('评价提交成功');
      loadData();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : '提交失败');
    } finally {
      setSubmittingReview(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="text-muted-foreground">加载中...</div>
      </div>
    );
  }

  if (!order) {
    return (
      <div className="text-center py-20">
        <p className="text-muted-foreground mb-4">工单不存在</p>
        <Button variant="outline" onClick={() => navigate('/student/orders')}>
          返回列表
        </Button>
      </div>
    );
  }

  const timelineItems: Array<{
    icon: React.ElementType;
    title: string;
    time?: string;
    desc?: string;
    color: string;
  }> = [];

  timelineItems.push({
    icon: Clock,
    title: '工单提交',
    time: order.createdAt,
    desc: '您已成功提交报修申请',
    color: 'text-primary',
  });

  if (order.status !== 'pending_review' && order.status !== 'rejected' && order.status !== 'cancelled') {
    timelineItems.push({
      icon: UserCheck,
      title: '审核通过',
      time: order.updatedAt,
      desc: order.repairerName
        ? `维修人员：${order.repairerName}`
        : '管理员已审核通过',
      color: 'text-blue-600',
    });
  }

  if (order.status === 'repairing' || order.status === 'pending_review_done' || order.status === 'completed') {
    timelineItems.push({
      icon: Wrench,
      title: '维修中',
      time: order.updatedAt,
      desc: '维修人员已开始处理',
      color: 'text-indigo-600',
    });
  }

  if (order.status === 'pending_review_done' || order.status === 'completed') {
    timelineItems.push({
      icon: CheckCircle2,
      title: '维修完成',
      time: order.updatedAt,
      desc: order.repairResult || '维修已完成',
      color: 'text-emerald-600',
    });
  }

  if (review) {
    timelineItems.push({
      icon: Star,
      title: '已评价',
      time: review.createdAt,
      desc: `${review.rating} 星评价`,
      color: 'text-amber-500',
    });
  }

  if (order.status === 'rejected') {
    timelineItems.push({
      icon: XCircle,
      title: '已驳回',
      time: order.updatedAt,
      desc: order.rejectReason || '工单被驳回',
      color: 'text-destructive',
    });
  }

  if (order.status === 'cancelled') {
    timelineItems.push({
      icon: XCircle,
      title: '已取消',
      time: order.updatedAt,
      desc: '您已取消此工单',
      color: 'text-slate-500',
    });
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => navigate('/student/orders')}
          aria-label="返回"
        >
          <ArrowLeft className="w-5 h-5" />
        </Button>
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-xl font-semibold text-slate-900">
              工单详情
            </h1>
            <Badge
              variant="outline"
              className={STATUS_VARIANTS[order.status]}
            >
              {ORDER_STATUS_LABELS[order.status]}
            </Badge>
          </div>
          <p className="text-sm text-muted-foreground mt-0.5">
            工单号：{order.orderNo}
          </p>
        </div>
      </div>

      {order.status === 'rejected' && order.rejectReason && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-destructive shrink-0 mt-0.5" />
          <div>
            <div className="font-medium text-destructive">驳回原因</div>
            <div className="text-sm text-red-700 mt-1">
              {order.rejectReason}
            </div>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="lg:col-span-2 space-y-4">
          <Card className="rounded-lg">
            <CardHeader>
              <CardTitle className="text-base font-semibold">
                基本信息
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-y-4 gap-x-6">
                <div>
                  <div className="text-sm text-muted-foreground">宿舍楼栋</div>
                  <div className="text-slate-900 mt-1">{order.dormBuilding}</div>
                </div>
                <div>
                  <div className="text-sm text-muted-foreground">宿舍号</div>
                  <div className="text-slate-900 mt-1">{order.dormRoom}</div>
                </div>
                <div>
                  <div className="text-sm text-muted-foreground">故障类型</div>
                  <div className="text-slate-900 mt-1">
                    {FAULT_TYPE_LABELS[order.faultType]}
                  </div>
                </div>
                <div>
                  <div className="text-sm text-muted-foreground">提交时间</div>
                  <div className="text-slate-900 mt-1">
                    {new Date(order.createdAt).toLocaleString('zh-CN')}
                  </div>
                </div>
                <div className="col-span-2">
                  <div className="text-sm text-muted-foreground">故障描述</div>
                  <div className="text-slate-900 mt-1 whitespace-pre-wrap">
                    {order.faultDescription}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {order.repairNote && (
            <Card className="rounded-lg">
              <CardHeader>
                <CardTitle className="text-base font-semibold flex items-center gap-2">
                  <FileText className="w-4 h-4 text-primary" />
                  维修备注
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-slate-700 whitespace-pre-wrap">
                  {order.repairNote}
                </p>
              </CardContent>
            </Card>
          )}

          <Card className="rounded-lg">
            <CardHeader>
              <CardTitle className="text-base font-semibold">
                状态流转
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="relative">
                <div className="absolute left-[15px] top-2 bottom-2 w-0.5 bg-slate-200" />
                <div className="space-y-5">
                  {timelineItems.map((item, index) => {
                    const Icon = item.icon;
                    return (
                      <div key={index} className="relative flex gap-4 pl-2">
                        <div
                          className={`w-8 h-8 rounded-full bg-white border-2 border-slate-200 flex items-center justify-center z-10 ${item.color}`}
                        >
                          <Icon className="w-4 h-4" />
                        </div>
                        <div className="flex-1 pt-1">
                          <div className="flex items-center justify-between">
                            <span className="font-medium text-slate-900">
                              {item.title}
                            </span>
                            {item.time && (
                              <span className="text-xs text-muted-foreground">
                                {new Date(item.time).toLocaleString('zh-CN')}
                              </span>
                            )}
                          </div>
                          {item.desc && (
                            <p className="text-sm text-muted-foreground mt-1">
                              {item.desc}
                            </p>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="space-y-4">
          {order.status === 'pending_review' && (
            <Card className="rounded-lg">
              <CardHeader>
                <CardTitle className="text-base font-semibold">
                  操作
                </CardTitle>
              </CardHeader>
              <CardContent>
                <Button
                  variant="outline"
                  className="w-full text-destructive border-destructive/30 hover:text-destructive"
                  onClick={() => setCancelDialogOpen(true)}
                >
                  <XCircle className="w-4 h-4" />
                  取消工单
                </Button>
              </CardContent>
            </Card>
          )}

          {order.status === 'pending_review_done' && !review && (
            <Card className="rounded-lg">
              <CardHeader>
                <CardTitle className="text-base font-semibold flex items-center gap-2">
                  <Star className="w-4 h-4 text-amber-500" />
                  服务评价
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label>服务评分</Label>
                  <div className="flex gap-1">
                    {[1, 2, 3, 4, 5].map((num) => (
                      <button
                        key={num}
                        type="button"
                        onClick={() => setRating(num)}
                        className="p-1 rounded transition-colors hover:scale-110"
                        aria-label={`${num} 星`}
                      >
                        <Star
                          className={`w-7 h-7 ${
                            num <= rating
                              ? 'text-amber-400 fill-amber-400'
                              : 'text-slate-300'
                          }`}
                        />
                      </button>
                    ))}
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="reviewContent">评价内容</Label>
                  <Textarea
                    id="reviewContent"
                    placeholder="请对本次维修服务进行评价..."
                    rows={4}
                    value={reviewContent}
                    onChange={(e) => setReviewContent(e.target.value)}
                  />
                </div>
                <Button
                  className="w-full"
                  onClick={handleSubmitReview}
                  disabled={submittingReview}
                >
                  <Send className="w-4 h-4" />
                  {submittingReview ? '提交中...' : '提交评价'}
                </Button>
              </CardContent>
            </Card>
          )}

          {review && (
            <Card className="rounded-lg">
              <CardHeader>
                <CardTitle className="text-base font-semibold flex items-center gap-2">
                  <Star className="w-4 h-4 text-amber-500" />
                  我的评价
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-center gap-1">
                  {[1, 2, 3, 4, 5].map((num) => (
                    <Star
                      key={num}
                      className={`w-5 h-5 ${
                        num <= review.rating
                          ? 'text-amber-400 fill-amber-400'
                          : 'text-slate-300'
                      }`}
                    />
                  ))}
                  <span className="ml-2 text-sm text-muted-foreground">
                    {review.rating} 星
                  </span>
                </div>
                {review.content && (
                  <p className="text-sm text-slate-700 whitespace-pre-wrap">
                    {review.content}
                  </p>
                )}
                <p className="text-xs text-muted-foreground">
                  评价时间：
                  {new Date(review.createdAt).toLocaleString('zh-CN')}
                </p>
              </CardContent>
            </Card>
          )}

          <Card className="rounded-lg">
            <CardHeader>
              <CardTitle className="text-base font-semibold">
                提交人信息
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">姓名</span>
                <span className="text-slate-900">{order.studentName}</span>
              </div>
              {order.studentPhone && (
                <div className="flex justify-between">
                  <span className="text-muted-foreground">联系电话</span>
                  <span className="text-slate-900">{order.studentPhone}</span>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      <Dialog open={cancelDialogOpen} onOpenChange={setCancelDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>确认取消工单？</DialogTitle>
            <DialogDescription>
              取消后工单将无法恢复，确定要取消此报修工单吗？
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setCancelDialogOpen(false)}
              disabled={cancelling}
            >
              再想想
            </Button>
            <Button
              variant="destructive"
              onClick={handleCancel}
              disabled={cancelling}
            >
              {cancelling ? '取消中...' : '确认取消'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default OrderDetailPage;
