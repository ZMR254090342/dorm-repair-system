import React from 'react';
import { Outlet, Navigate, useLocation, Link } from 'react-router-dom';
import { useAuth } from '@client/src/contexts/AuthContext';
import { ROLE_LABELS } from '@shared/api.interface';
import {
  ClipboardList,
  PlusCircle,
  LayoutDashboard,
  BarChart3,
  Users,
  LogOut,
  Wrench,
  ShieldCheck,
} from 'lucide-react';
import { Button } from '@client/src/components/ui/button';
import { useNavigate } from 'react-router-dom';

const getNavItems = (role: string) => {
  switch (role) {
    case 'student':
      return [
        { to: '/student/dashboard', label: '首页', icon: LayoutDashboard },
        { to: '/student/submit', label: '提交报修', icon: PlusCircle },
        { to: '/student/orders', label: '我的报修', icon: ClipboardList },
      ];
    case 'repairer':
      return [
        { to: '/repairer/dashboard', label: '首页', icon: LayoutDashboard },
        { to: '/repairer/orders', label: '我的工单', icon: Wrench },
      ];
    case 'admin':
      return [
        { to: '/admin/dashboard', label: '首页', icon: LayoutDashboard },
        { to: '/admin/orders', label: '工单管理', icon: ClipboardList },
        { to: '/admin/stats', label: '数据统计', icon: BarChart3 },
      ];
    case 'super_admin':
      return [
        { to: '/admin/dashboard', label: '首页', icon: LayoutDashboard },
        { to: '/admin/orders', label: '工单管理', icon: ClipboardList },
        { to: '/admin/stats', label: '数据统计', icon: BarChart3 },
        { to: '/super/users', label: '用户管理', icon: Users },
      ];
    default:
      return [];
  }
};

const getRoleHome = (role: string): string => {
  switch (role) {
    case 'student': return '/student/dashboard';
    case 'repairer': return '/repairer/dashboard';
    case 'admin':
    case 'super_admin': return '/admin/dashboard';
    default: return '/login';
  }
};

const Layout = () => {
  const navigate = useNavigate();
  const { user, isLoading, logout } = useAuth();
  const location = useLocation();

  if (isLoading) {
    return (
      <div className="w-screen h-screen flex items-center justify-center bg-slate-50">
        <div className="text-muted-foreground">加载中...</div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" state={{ from: location.pathname }} replace />;
  }

  const navItems = getNavItems(user.role);

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  return (
    <div className="flex h-screen bg-slate-50">
      <aside className="w-60 bg-white border-r border-slate-200 flex flex-col">
        <div className="h-16 flex items-center px-5 border-b border-slate-100">
          <ShieldCheck className="w-7 h-7 text-primary mr-2" />
          <span className="font-semibold text-lg">宿舍报修系统</span>
        </div>

        <nav className="flex-1 p-3 space-y-1">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = location.pathname === item.to || location.pathname.startsWith(item.to + '/');
            return (
              <Link
                key={item.to}
                to={item.to}
                className={`flex items-center px-3 py-2.5 rounded-lg text-sm transition-colors ${
                  isActive
                    ? 'bg-primary/10 text-primary font-medium'
                    : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                }`}
              >
                <Icon className="w-4 h-4 mr-2.5" />
                {item.label}
              </Link>
            );
          })}
        </nav>

        <div className="p-3 border-t border-slate-100">
          <div className="px-3 py-2 mb-2">
            <div className="text-sm font-medium text-slate-800">{user.realName}</div>
            <div className="text-xs text-slate-500">{ROLE_LABELS[user.role]}</div>
          </div>
          <Button
            variant="ghost"
            size="sm"
            className="w-full justify-start text-slate-600 hover:text-destructive"
            onClick={handleLogout}
          >
            <LogOut className="w-4 h-4 mr-2" />
            退出登录
          </Button>
        </div>
      </aside>

      <main className="flex-1 overflow-auto">
        <div className="p-6">
          <Outlet />
        </div>
      </main>
    </div>
  );
};

export default Layout;
export { getRoleHome };
