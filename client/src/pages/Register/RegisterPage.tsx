import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '@client/src/contexts/AuthContext';
import { Button } from '@client/src/components/ui/button';
import { Input } from '@client/src/components/ui/input';
import { Label } from '@client/src/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@client/src/components/ui/card';
import { ShieldCheck, Eye, EyeOff } from 'lucide-react';
import { toast } from 'sonner';

const RegisterPage = () => {
  const [form, setForm] = useState({
    username: '',
    password: '',
    confirmPassword: '',
    realName: '',
    phone: '',
    dormBuilding: '',
    dormRoom: '',
  });
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const { register } = useAuth();
  const navigate = useNavigate();

  const handleChange = (field: string, value: string) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.username || !form.password || !form.realName) {
      toast.error('请填写必填项');
      return;
    }
    if (form.password !== form.confirmPassword) {
      toast.error('两次密码输入不一致');
      return;
    }
    if (form.password.length < 6) {
      toast.error('密码长度至少 6 位');
      return;
    }
    setLoading(true);
    try {
      await register({
        username: form.username.trim(),
        password: form.password,
        realName: form.realName.trim(),
        phone: form.phone.trim() || undefined,
        dormBuilding: form.dormBuilding.trim() || undefined,
        dormRoom: form.dormRoom.trim() || undefined,
      });
      toast.success('注册成功');
      navigate('/student/dashboard', { replace: true });
    } catch (error: any) {
      toast.error(error.message || '注册失败');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 via-white to-cyan-50 p-4 py-8">
      <Card className="w-full max-w-md shadow-lg">
        <CardHeader className="text-center space-y-2">
          <div className="flex justify-center mb-2">
            <div className="w-14 h-14 rounded-xl bg-primary/10 flex items-center justify-center">
              <ShieldCheck className="w-8 h-8 text-primary" />
            </div>
          </div>
          <CardTitle className="text-2xl">学生注册</CardTitle>
          <CardDescription>注册账号提交宿舍报修</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label htmlFor="username">账号 <span className="text-destructive">*</span></Label>
                <Input
                  id="username"
                  placeholder="登录账号"
                  value={form.username}
                  onChange={(e) => handleChange('username', e.target.value)}
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="realName">姓名 <span className="text-destructive">*</span></Label>
                <Input
                  id="realName"
                  placeholder="真实姓名"
                  value={form.realName}
                  onChange={(e) => handleChange('realName', e.target.value)}
                />
              </div>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="password">密码 <span className="text-destructive">*</span></Label>
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  placeholder="至少 6 位"
                  value={form.password}
                  onChange={(e) => handleChange('password', e.target.value)}
                  autoComplete="new-password"
                />
                <button
                  type="button"
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                  onClick={() => setShowPassword(!showPassword)}
                  aria-label="切换密码可见性"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="confirmPassword">确认密码 <span className="text-destructive">*</span></Label>
              <Input
                id="confirmPassword"
                type="password"
                placeholder="再次输入密码"
                value={form.confirmPassword}
                onChange={(e) => handleChange('confirmPassword', e.target.value)}
                autoComplete="new-password"
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="phone">联系电话</Label>
              <Input
                id="phone"
                placeholder="选填"
                value={form.phone}
                onChange={(e) => handleChange('phone', e.target.value)}
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label htmlFor="dormBuilding">宿舍楼栋</Label>
                <Input
                  id="dormBuilding"
                  placeholder="如：1号楼"
                  value={form.dormBuilding}
                  onChange={(e) => handleChange('dormBuilding', e.target.value)}
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="dormRoom">宿舍号</Label>
                <Input
                  id="dormRoom"
                  placeholder="如：302"
                  value={form.dormRoom}
                  onChange={(e) => handleChange('dormRoom', e.target.value)}
                />
              </div>
            </div>
            <Button type="submit" className="w-full mt-2" disabled={loading}>
              {loading ? '注册中...' : '注册'}
            </Button>
          </form>
          <div className="mt-4 text-center text-sm text-slate-500">
            已有账号？<Link to="/login" className="text-primary hover:underline">立即登录</Link>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default RegisterPage;
