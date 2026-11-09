import React, { useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { Send, Upload, X, ImageIcon, Loader2 } from 'lucide-react';
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
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@client/src/components/ui/dialog';
import { getDataloom } from '@lark-apaas/client-toolkit/dataloom';
import { getDefaultBucketId } from '@lark-apaas/client-toolkit/tools/storage';
import { logger } from '@lark-apaas/client-toolkit/logger';
import { ordersApi } from '@client/src/api';
import {
  FAULT_TYPE_LABELS,
  type FaultType,
  type CreateOrderRequest,
} from '@shared/api.interface';
import { useAuth } from '@client/src/contexts/AuthContext';
import { Image } from '@client/src/components/ui/image';

const ALLOWED_IMAGE_TYPES = ['image/jpeg', 'image/png'];
const MAX_IMAGE_SIZE_MB = 10;
const MAX_IMAGES = 6;

interface UploadedImage {
  url: string;
  name: string;
}

const SubmitPage: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [submitting, setSubmitting] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [form, setForm] = useState<CreateOrderRequest>({
    dormBuilding: user?.dormBuilding || '',
    dormRoom: user?.dormRoom || '',
    faultType: '' as FaultType,
    faultDescription: '',
    faultImages: [],
  });

  const images: UploadedImage[] = (form.faultImages || []).map(
    (url: string, idx: number) => ({ url, name: `图片${idx + 1}` })
  );

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};
    if (!form.dormBuilding.trim()) {
      newErrors.dormBuilding = '请填写宿舍楼栋';
    }
    if (!form.dormRoom.trim()) {
      newErrors.dormRoom = '请填写宿舍号';
    }
    if (!form.faultType) {
      newErrors.faultType = '请选择故障类型';
    }
    if (!form.faultDescription.trim()) {
      newErrors.faultDescription = '请填写故障描述';
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmitClick = (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) {
      toast.error('请检查表单填写是否完整');
      return;
    }
    setConfirmOpen(true);
  };

  const handleConfirmSubmit = async () => {
    try {
      setSubmitting(true);
      const order = await ordersApi.create(form);
      toast.success(`提交成功，工单号：${order.orderNo}`);
      setConfirmOpen(false);
      navigate(`/student/orders/${order.id}`);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : '提交失败');
      setSubmitting(false);
    }
  };

  const handleImageSelect = async (
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    const currentCount = form.faultImages?.length || 0;
    const remaining = MAX_IMAGES - currentCount;
    if (remaining <= 0) {
      toast.error(`最多只能上传 ${MAX_IMAGES} 张图片`);
      if (fileInputRef.current) fileInputRef.current.value = '';
      return;
    }

    const fileList = Array.from(files).slice(0, remaining);

    for (const file of fileList) {
      if (!ALLOWED_IMAGE_TYPES.includes(file.type)) {
        toast.error(`${file.name} 格式不支持，仅支持 JPG/PNG 格式`);
        if (fileInputRef.current) fileInputRef.current.value = '';
        return;
      }
      if (file.size > MAX_IMAGE_SIZE_MB * 1024 * 1024) {
        toast.error(
          `${file.name} 超过 ${MAX_IMAGE_SIZE_MB}MB，请压缩后重新上传`
        );
        if (fileInputRef.current) fileInputRef.current.value = '';
        return;
      }
    }

    setUploading(true);
    try {
      const dataloom = await getDataloom();
      const bucket = dataloom.storage.from(getDefaultBucketId());
      const uploadedUrls: string[] = [];

      for (const file of fileList) {
        const { data, error } = await bucket.uploadFile(file);
        if (error) {
          const wrapped = error as {
            code?: unknown;
            status?: unknown;
            originalError?: unknown;
          };
          const original =
            typeof wrapped.originalError === 'object' &&
            wrapped.originalError !== null
              ? (wrapped.originalError as {
                  code?: unknown;
                  status?: unknown;
                })
              : {};
          const is429 = [
            wrapped.code,
            wrapped.status,
            original.code,
            original.status,
          ].some((v) => v === 429 || v === '429');
          if (is429) logger.error('文件上传请求受限（429）', error);
          throw error;
        }
        if (!data) throw new Error('上传失败：未返回数据');
        uploadedUrls.push(data.download_url);
        await new Promise((resolve) => setTimeout(resolve, 200));
      }

      setForm({
        ...form,
        faultImages: [...(form.faultImages || []), ...uploadedUrls],
      });
      toast.success(`成功上传 ${uploadedUrls.length} 张图片`);
    } catch (error) {
      logger.error('图片上传失败', error);
      toast.error(error instanceof Error ? error.message : '图片上传失败');
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handleRemoveImage = (index: number) => {
    const newImages = [...(form.faultImages || [])];
    newImages.splice(index, 1);
    setForm({ ...form, faultImages: newImages });
  };

  const updateField = <K extends keyof CreateOrderRequest>(
    key: K,
    value: CreateOrderRequest[K]
  ) => {
    setForm({ ...form, [key]: value });
    if (errors[key as string]) {
      const newErrors = { ...errors };
      delete newErrors[key as string];
      setErrors(newErrors);
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
          <form onSubmit={handleSubmitClick} className="space-y-5">
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
                    updateField('dormBuilding', e.target.value)
                  }
                  className={errors.dormBuilding ? 'border-destructive' : ''}
                />
                {errors.dormBuilding && (
                  <p className="text-xs text-destructive">
                    {errors.dormBuilding}
                  </p>
                )}
              </div>
              <div className="space-y-2">
                <Label htmlFor="dormRoom">
                  宿舍号 <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="dormRoom"
                  placeholder="如：101"
                  value={form.dormRoom}
                  onChange={(e) => updateField('dormRoom', e.target.value)}
                  className={errors.dormRoom ? 'border-destructive' : ''}
                />
                {errors.dormRoom && (
                  <p className="text-xs text-destructive">
                    {errors.dormRoom}
                  </p>
                )}
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="faultType">
                故障类型 <span className="text-destructive">*</span>
              </Label>
              <Select
                value={form.faultType}
                onValueChange={(val) =>
                  updateField('faultType', val as FaultType)
                }
              >
                <SelectTrigger
                  id="faultType"
                  className={`w-full ${errors.faultType ? 'border-destructive' : ''}`}
                >
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
              {errors.faultType && (
                <p className="text-xs text-destructive">
                  {errors.faultType}
                </p>
              )}
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
                  updateField('faultDescription', e.target.value)
                }
                className={errors.faultDescription ? 'border-destructive' : ''}
              />
              {errors.faultDescription && (
                <p className="text-xs text-destructive">
                  {errors.faultDescription}
                </p>
              )}
            </div>

            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <Label>故障图片（可选）</Label>
                <span className="text-xs text-muted-foreground">
                  仅支持 JPG/PNG，最多 {MAX_IMAGES} 张
                </span>
              </div>
              <div className="flex flex-wrap gap-3">
                {images.map((img: UploadedImage, idx: number) => (
                  <div
                    key={idx}
                    className="relative w-24 h-24 rounded-lg border border-slate-200 overflow-hidden group"
                  >
                    <Image
                      src={img.url}
                      alt={img.name}
                      className="w-full h-full object-cover"
                    />
                    <button
                      type="button"
                      onClick={() => handleRemoveImage(idx)}
                      className="absolute top-1 right-1 w-5 h-5 rounded-full bg-black/60 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                      aria-label="删除图片"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </div>
                ))}
                {images.length < MAX_IMAGES && (
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    disabled={uploading}
                    className="w-24 h-24 rounded-lg border border-dashed border-slate-300 flex flex-col items-center justify-center text-muted-foreground hover:border-primary hover:text-primary hover:bg-primary/5 transition-colors"
                  >
                    {uploading ? (
                      <Loader2 className="w-5 h-5 animate-spin" />
                    ) : (
                      <>
                        <Upload className="w-5 h-5 mb-1" />
                        <span className="text-xs">上传图片</span>
                      </>
                    )}
                  </button>
                )}
              </div>
              {images.length === 0 && (
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <ImageIcon className="w-3.5 h-3.5" />
                  <span>上传图片能帮助维修人员更快判断故障原因</span>
                </div>
              )}
              <input
                ref={fileInputRef}
                type="file"
                accept="image/jpeg,image/png"
                multiple
                onChange={handleImageSelect}
                className="hidden"
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

      <Dialog open={confirmOpen} onOpenChange={setConfirmOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>确认提交报修？</DialogTitle>
            <DialogDescription>
              请确认报修信息填写准确，提交后将进入审核流程，我们会尽快安排维修人员处理。
            </DialogDescription>
          </DialogHeader>
          <div className="bg-slate-50 rounded-lg p-4 space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-muted-foreground">宿舍楼栋</span>
              <span className="text-slate-900">{form.dormBuilding}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">宿舍号</span>
              <span className="text-slate-900">{form.dormRoom}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">故障类型</span>
              <span className="text-slate-900">
                {FAULT_TYPE_LABELS[form.faultType]}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">图片</span>
              <span className="text-slate-900">
                {images.length} 张
              </span>
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setConfirmOpen(false)}
              disabled={submitting}
            >
              再检查一下
            </Button>
            <Button onClick={handleConfirmSubmit} disabled={submitting}>
              {submitting ? '提交中...' : '确认提交'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default SubmitPage;
