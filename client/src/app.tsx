import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { AppContainer } from '@lark-apaas/client-toolkit';
import { Toaster } from 'sonner';

import { AuthProvider, useAuth } from '@client/src/contexts/AuthContext';
import Layout from '@client/src/components/Layout';
import LoginPage from '@client/src/pages/Login/LoginPage';
import RegisterPage from '@client/src/pages/Register/RegisterPage';
import StudentDashboardPage from '@client/src/pages/student/DashboardPage';
import StudentSubmitPage from '@client/src/pages/student/SubmitPage';
import StudentOrdersPage from '@client/src/pages/student/OrdersPage';
import StudentOrderDetailPage from '@client/src/pages/student/OrderDetailPage';
import RepairerDashboardPage from '@client/src/pages/repairer/DashboardPage';
import RepairerOrdersPage from '@client/src/pages/repairer/OrdersPage';
import RepairerOrderDetailPage from '@client/src/pages/repairer/OrderDetailPage';
import AdminDashboardPage from '@client/src/pages/admin/DashboardPage';
import AdminOrdersPage from '@client/src/pages/admin/OrdersPage';
import AdminOrderDetailPage from '@client/src/pages/admin/OrderDetailPage';
import AdminStatsPage from '@client/src/pages/admin/StatsPage';
import SuperUsersPage from '@client/src/pages/super/UsersPage';

const RoleRedirect = () => {
  const { user, isLoading } = useAuth();
  if (isLoading) return <div className="p-8">加载中...</div>;
  if (!user) return <Navigate to="/login" replace />;
  switch (user.role) {
    case 'student': return <Navigate to="/student/dashboard" replace />;
    case 'repairer': return <Navigate to="/repairer/dashboard" replace />;
    case 'admin':
    case 'super_admin': return <Navigate to="/admin/dashboard" replace />;
    default: return <Navigate to="/login" replace />;
  }
};

const App = () => {
  return (
    <AppContainer>
      <AuthProvider>
        <Routes>
            <Route path="/login" element={<LoginPage />} />
            <Route path="/register" element={<RegisterPage />} />

            <Route element={<Layout />}>
              <Route index element={<RoleRedirect />} />

              <Route path="student/dashboard" element={<StudentDashboardPage />} />
              <Route path="student/submit" element={<StudentSubmitPage />} />
              <Route path="student/orders" element={<StudentOrdersPage />} />
              <Route path="student/orders/:id" element={<StudentOrderDetailPage />} />

              <Route path="repairer/dashboard" element={<RepairerDashboardPage />} />
              <Route path="repairer/orders" element={<RepairerOrdersPage />} />
              <Route path="repairer/orders/:id" element={<RepairerOrderDetailPage />} />

              <Route path="admin/dashboard" element={<AdminDashboardPage />} />
              <Route path="admin/orders" element={<AdminOrdersPage />} />
              <Route path="admin/orders/:id" element={<AdminOrderDetailPage />} />
              <Route path="admin/stats" element={<AdminStatsPage />} />

              <Route path="super/users" element={<SuperUsersPage />} />
            </Route>

            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        <Toaster position="top-right" richColors />
      </AuthProvider>
    </AppContainer>
  );
};

export default App;
