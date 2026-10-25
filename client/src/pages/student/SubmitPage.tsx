import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { Send } from 'lucide-react';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from '@client/src/components/ui/card';
import { Button } from '@client/src/components/ui/button';
import { Input } from '@client/src/components/ui/input';
import { Textarea } from '@client/src/components/ui/textarea';
import { Label } from '@client/src/components/ui/label';
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from '@client/src/components/ui/select';
import { ordersApi } from '@client/src/api';
import {
  FAULT_TYPE_LABELS,
  type FaultType,
  type CreateOrderRequest,
} from '@shared/api.interface';
import { useAuth } from '@client/src/contexts/AuthContext';

const SubmitPage: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [submitting, setSubmitting] = useState(false);
  const [form, setForm] = useState<CreateOrderRequest>({
    dormBuilding: user?.dormBuilding || '',
    dormRoom: user?.dormRoom || '',
    faultType: '' as FaultType,
    faultDescription: '',
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!form.dormBuilding.trim()) {
      toast.error('请填写宿舍楼栋');
      return;
    }
    if (!form.dormRoom.trim()) {
      toast.error('请填写宿舍号');
      return;
    }
    if (!form.faultType) {
      toast.error('请选择故障类型');
      return;
    }
    if (!form.faultDescription.trim()) {
      toast.error('请填写故障描述');
      return;
    }

    try {
      setSubmitting(true);
      const order = await ordersApi.create(form);
      toast.success(`提交成功，工单号：${order.orderNo}`);
      navigate(`/student/orders/${order.id}`);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : '提交失败');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto">
      <Card className="rounded-lg">
        <CardHeader>
          <CardTitle className="text-xl font-semibold">提交报修</CardTitle>
          <CardDescription>
            填写故障信息，我们会尽快安排维修人员上门处理
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="dormBuilding">
                  宿舍楼栋 <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="dormBuilding"
                  placeholder="如：1号楼"
                  value={form.dormBuilding}
                  onChange={(e) =>
                    setForm({ ...form, dormBuilding: e.target.value })
                  }
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="dormRoom">
                  宿舍号 <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="dormRoom"
                  placeholder="如：101"
                  value={form.dormRoom}
                  onChange={(e) =>
                    setForm({ ...form, dormRoom: e.target.value })
                  }
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="faultType">
                故障类型 <span className="text-destructive">*</span>
              </Label>
              <Select
                value={form.faultType}
                onValueChange={(val) =>
                  setForm({ ...form, faultType: val as FaultType })
                }
              >
                <SelectTrigger id="faultType" className="w-full">
                  <SelectValue placeholder="请选择故障类型" />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(FAULT_TYPE_LABELS).map(([key, label]) => (
                    <SelectItem key={key} value={key}>
                      {label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="faultDescription">
                故障描述 <span className="text-destructive">*</span>
              </Label>
              <Textarea
                id="faultDescription"
                placeholder="请详细描述故障情况，如故障位置、发生时间、具体现象等"
                rows={5}
                value={form.faultDescription}
                onChange={(e) =>
                  setForm({ ...form, faultDescription: e.target.value })
                }
              />
            </div>

            <div className="pt-2">
              <Button type="submit" className="w-full" disabled={submitting}>
                <Send className="w-4 h-4" />
                {submitting ? '提交中...' : '提交报修'}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
};

export default SubmitPage;
