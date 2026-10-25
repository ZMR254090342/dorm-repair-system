import React, { useState, useEffect, useCallback } from 'react';
import { toast } from 'sonner';
import { logger } from '@lark-apaas/client-toolkit/logger';
import { usersApi } from '@client/src/api';
import type {
  UserInfo,
  UserRole,
  UserStatus,
  CreateUserRequest,
  UpdateUserRequest,
  ResetPasswordRequest,
} from '@shared/api.interface';
import { ROLE_LABELS } from '@shared/api.interface';
import { Card, CardContent, CardHeader, CardTitle } from '@client/src/components/ui/card';
import { Button } from '@client/src/components/ui/button';
import { Input } from '@client/src/components/ui/input';
import { Label } from '@client/src/components/ui/label';
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from '@client/src/components/ui/select';
import { Badge } from '@client/src/components/ui/badge';
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableCell,
  TableHead,
} from '@client/src/components/ui/table';
import {
  Dialog,
  DialogTrigger,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from '@client/src/components/ui/dialog';
import {
  Plus,
  Search,
  ChevronLeft,
  ChevronRight,
  Pencil,
  KeyRound,
  Trash2,
  Ban,
  CheckCircle,
} from 'lucide-react';

const STATUS_LABELS: Record<UserStatus, string> = {
  active: '启用',
  disabled: '禁用',
};

const PAGE_SIZE = 10;

interface CreateFormState
  extends Omit<CreateUserRequest, 'role'> {
  role: UserRole;
}

interface UpdateFormState
  extends Omit<UpdateUserRequest, 'role' | 'status'> {
  role: UserRole;
  status: UserStatus;
}

const UsersPage: React.FC = () => {
  const [users, setUsers] = useState<UserInfo[]>([]);
  const [loading, setLoading] = useState(false);
  const [keyword, setKeyword] = useState('');
  const [roleFilter, setRoleFilter] = useState<string>('all');
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));

  const [createOpen, setCreateOpen] = useState(false);
  const [createForm, setCreateForm] = useState<CreateFormState>({
    username: '',
    password: '',
    realName: '',
    role: 'student',
    phone: '',
    dormBuilding: '',
    dormRoom: '',
  });
  const [createSubmitting, setCreateSubmitting] = useState(false);

  const [editOpen, setEditOpen] = useState(false);
  const [editUser, setEditUser] = useState<UserInfo | null>(null);
  const [editForm, setEditForm] = useState<UpdateFormState>({
    realName: '',
    role: 'student',
    phone: '',
    status: 'active',
    dormBuilding: '',
    dormRoom: '',
  });
  const [editSubmitting, setEditSubmitting] = useState(false);

  const [resetOpen, setResetOpen] = useState(false);
  const [resetUser, setResetUser] = useState<UserInfo | null>(null);
  const [resetPassword, setResetPassword] = useState('');
  const [resetSubmitting, setResetSubmitting] = useState(false);

  const [deleteOpen, setDeleteOpen] = useState(false);
  const [deleteUser, setDeleteUser] = useState<UserInfo | null>(null);
  const [deleteSubmitting, setDeleteSubmitting] = useState(false);

  const [toggleConfirmOpen, setToggleConfirmOpen] = useState(false);
  const [toggleUser, setToggleUser] = useState<UserInfo | null>(null);
  const [toggleSubmitting, setToggleSubmitting] = useState(false);

  const fetchUsers = useCallback(async () => {
    setLoading(true);
    try {
      const res = await usersApi.list({
        keyword: keyword.trim() || undefined,
        role: roleFilter === 'all' ? undefined : roleFilter,
        page,
        pageSize: PAGE_SIZE,
      });
      setUsers(res.items);
      setTotal(res.total);
    } catch (error) {
      logger.error('获取用户列表失败', error);
      toast.error(error instanceof Error ? error.message : '获取用户列表失败');
    } finally {
      setLoading(false);
    }
  }, [keyword, roleFilter, page]);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  const handleSearch = () => {
    setPage(1);
  };

  const handleRoleChange = (value: string) => {
    setRoleFilter(value);
    setPage(1);
  };

  const openCreateDialog = () => {
    setCreateForm({
      username: '',
      password: '',
      realName: '',
      role: 'student',
      phone: '',
      dormBuilding: '',
      dormRoom: '',
    });
    setCreateOpen(true);
  };

  const handleCreate = async () => {
    if (!createForm.username.trim()) {
      toast.error('请输入账号');
      return;
    }
    if (!createForm.password || createForm.password.length < 6) {
      toast.error('密码至少 6 位');
      return;
    }
    if (!createForm.realName.trim()) {
      toast.error('请输入姓名');
      return;
    }
    setCreateSubmitting(true);
    try {
      await usersApi.create({
        username: createForm.username.trim(),
        password: createForm.password,
        realName: createForm.realName.trim(),
        role: createForm.role,
        phone: createForm.phone || undefined,
        dormBuilding: createForm.dormBuilding || undefined,
        dormRoom: createForm.dormRoom || undefined,
      });
      toast.success('创建用户成功');
      setCreateOpen(false);
      fetchUsers();
    } catch (error) {
      logger.error('创建用户失败', error);
      toast.error(error instanceof Error ? error.message : '创建用户失败');
    } finally {
      setCreateSubmitting(false);
    }
  };

  const openEditDialog = (user: UserInfo) => {
    setEditUser(user);
    setEditForm({
      realName: user.realName,
      role: user.role,
      phone: user.phone || '',
      status: user.status,
      dormBuilding: user.dormBuilding || '',
      dormRoom: user.dormRoom || '',
    });
    setEditOpen(true);
  };

  const handleEdit = async () => {
    if (!editUser) return;
    if (!editForm.realName.trim()) {
      toast.error('请输入姓名');
      return;
    }
    setEditSubmitting(true);
    try {
      const data: UpdateUserRequest = {
        realName: editForm.realName.trim(),
        role: editForm.role,
        phone: editForm.phone || undefined,
        status: editForm.status,
        dormBuilding: editForm.dormBuilding || undefined,
        dormRoom: editForm.dormRoom || undefined,
      };
      await usersApi.update(editUser.id, data);
      toast.success('更新用户成功');
      setEditOpen(false);
      fetchUsers();
    } catch (error) {
      logger.error('更新用户失败', error);
      toast.error(error instanceof Error ? error.message : '更新用户失败');
    } finally {
      setEditSubmitting(false);
    }
  };

  const openResetDialog = (user: UserInfo) => {
    setResetUser(user);
    setResetPassword('');
    setResetOpen(true);
  };

  const handleResetPassword = async () => {
    if (!resetUser) return;
    if (!resetPassword || resetPassword.length < 6) {
      toast.error('新密码至少 6 位');
      return;
    }
    setResetSubmitting(true);
    try {
      const data: ResetPasswordRequest = { newPassword: resetPassword };
      await usersApi.resetPassword(resetUser.id, data);
      toast.success('重置密码成功');
      setResetOpen(false);
    } catch (error) {
      logger.error('重置密码失败', error);
      toast.error(error instanceof Error ? error.message : '重置密码失败');
    } finally {
      setResetSubmitting(false);
    }
  };

  const openDeleteDialog = (user: UserInfo) => {
    setDeleteUser(user);
    setDeleteOpen(true);
  };

  const handleDelete = async () => {
    if (!deleteUser) return;
    setDeleteSubmitting(true);
    try {
      await usersApi.remove(deleteUser.id);
      toast.success('删除用户成功');
      setDeleteOpen(false);
      if (users.length === 1 && page > 1) {
        setPage(page - 1);
      } else {
        fetchUsers();
      }
    } catch (error) {
      logger.error('删除用户失败', error);
      toast.error(error instanceof Error ? error.message : '删除用户失败');
    } finally {
      setDeleteSubmitting(false);
    }
  };

  const openToggleDialog = (user: UserInfo) => {
    setToggleUser(user);
    setToggleConfirmOpen(true);
  };

  const handleToggleStatus = async () => {
    if (!toggleUser) return;
    const nextStatus: UserStatus = toggleUser.status === 'active' ? 'disabled' : 'active';
    setToggleSubmitting(true);
    try {
      await usersApi.update(toggleUser.id, { status: nextStatus });
      toast.success(nextStatus === 'active' ? '已启用用户' : '已禁用用户');
      setToggleConfirmOpen(false);
      fetchUsers();
    } catch (error) {
      logger.error('更新用户状态失败', error);
      toast.error(error instanceof Error ? error.message : '更新用户状态失败');
    } finally {
      setToggleSubmitting(false);
    }
  };

  const handlePrevPage = () => {
    if (page > 1) setPage(page - 1);
  };

  const handleNextPage = () => {
    if (page < totalPages) setPage(page + 1);
  };

  const formatDate = (dateStr: string): string => {
    try {
      const d = new Date(dateStr);
      const y = d.getFullYear();
      const m = String(d.getMonth() + 1).padStart(2, '0');
      const day = String(d.getDate()).padStart(2, '0');
      const hh = String(d.getHours()).padStart(2, '0');
      const mm = String(d.getMinutes()).padStart(2, '0');
      return `${y}-${m}-${day} ${hh}:${mm}`;
    } catch {
      return dateStr;
    }
  };

  const renderRoleBadge = (role: UserRole) => {
    const variantMap: Record<UserRole, 'default' | 'secondary' | 'outline' | 'destructive'> = {
      student: 'secondary',
      repairer: 'outline',
      admin: 'default',
      super_admin: 'destructive',
    };
    return <Badge variant={variantMap[role]}>{ROLE_LABELS[role]}</Badge>;
  };

  const renderStatusBadge = (status: UserStatus) => {
    if (status === 'active') {
      return (
        <Badge variant="default" className="bg-emerald-500 border-emerald-500">
          {STATUS_LABELS[status]}
        </Badge>
      );
    }
    return (
      <Badge variant="secondary" className="text-slate-500">
        {STATUS_LABELS[status]}
      </Badge>
    );
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold text-slate-900">用户管理</h1>
      </div>

      <Card className="rounded-lg shadow-sm">
        <CardHeader className="pb-4">
          <div className="flex flex-wrap items-center gap-3">
            <div className="relative flex-1 min-w-[200px] max-w-md">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <Input
                placeholder="搜索账号 / 姓名"
                value={keyword}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setKeyword(e.target.value)}
                onKeyDown={(e: React.KeyboardEvent<HTMLInputElement>) => {
                  if (e.key === 'Enter') handleSearch();
                }}
                className="pl-9"
              />
            </div>
            <div className="w-40">
              <Select value={roleFilter} onValueChange={handleRoleChange}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="角色筛选" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">全部</SelectItem>
                  <SelectItem value="student">学生</SelectItem>
                  <SelectItem value="repairer">维修人员</SelectItem>
                  <SelectItem value="admin">后勤管理员</SelectItem>
                  <SelectItem value="super_admin">超级管理员</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <Button onClick={handleSearch} variant="outline" className="shrink-0">
              搜索
            </Button>
            <div className="flex-1" />
            <Button onClick={openCreateDialog} className="shrink-0">
              <Plus className="w-4 h-4" />
              新增用户
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>账号</TableHead>
                  <TableHead>姓名</TableHead>
                  <TableHead>角色</TableHead>
                  <TableHead>状态</TableHead>
                  <TableHead>联系电话</TableHead>
                  <TableHead>宿舍信息</TableHead>
                  <TableHead>创建时间</TableHead>
                  <TableHead className="text-right">操作</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  <TableRow>
                    <TableCell colSpan={8} className="text-center py-8 text-slate-500">
                      加载中...
                    </TableCell>
                  </TableRow>
                ) : users.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={8} className="text-center py-8 text-slate-500">
                      暂无数据
                    </TableCell>
                  </TableRow>
                ) : (
                  users.map((user: UserInfo) => (
                    <TableRow key={user.id}>
                      <TableCell className="font-medium">{user.username}</TableCell>
                      <TableCell>{user.realName}</TableCell>
                      <TableCell>{renderRoleBadge(user.role)}</TableCell>
                      <TableCell>{renderStatusBadge(user.status)}</TableCell>
                      <TableCell>{user.phone || '-'}</TableCell>
                      <TableCell>
                        {user.dormBuilding || user.dormRoom
                          ? `${user.dormBuilding || ''} ${user.dormRoom || ''}`.trim()
                          : '-'}
                      </TableCell>
                      <TableCell>{formatDate(user.createdAt)}</TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-1">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => openEditDialog(user)}
                          >
                            <Pencil className="w-3.5 h-3.5 mr-1" />
                            编辑
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => openResetDialog(user)}
                          >
                            <KeyRound className="w-3.5 h-3.5 mr-1" />
                            重置密码
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => openToggleDialog(user)}
                            className={user.status === 'active' ? 'text-amber-600' : 'text-emerald-600'}
                          >
                            {user.status === 'active' ? (
                              <>
                                <Ban className="w-3.5 h-3.5 mr-1" />
                                禁用
                              </>
                            ) : (
                              <>
                                <CheckCircle className="w-3.5 h-3.5 mr-1" />
                                启用
                              </>
                            )}
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => openDeleteDialog(user)}
                            className="text-destructive"
                          >
                            <Trash2 className="w-3.5 h-3.5 mr-1" />
                            删除
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>

          <div className="flex items-center justify-between mt-4">
            <div className="text-sm text-slate-500">
              共 {total} 条
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={handlePrevPage}
                disabled={page <= 1}
              >
                <ChevronLeft className="w-4 h-4" />
                上一页
              </Button>
              <span className="text-sm text-slate-600 px-2">
                {page} / {totalPages}
              </span>
              <Button
                variant="outline"
                size="sm"
                onClick={handleNextPage}
                disabled={page >= totalPages}
              >
                下一页
                <ChevronRight className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      <Dialog open={createOpen} onOpenChange={setCreateOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>新增用户</DialogTitle>
            <DialogDescription>填写用户信息，带 * 为必填项</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-1.5">
              <Label>
                账号 <span className="text-destructive">*</span>
              </Label>
              <Input
                placeholder="请输入登录账号"
                value={createForm.username}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                  setCreateForm({ ...createForm, username: e.target.value })
                }
              />
            </div>
            <div className="space-y-1.5">
              <Label>
                密码 <span className="text-destructive">*</span>
              </Label>
              <Input
                type="password"
                placeholder="至少 6 位"
                value={createForm.password}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                  setCreateForm({ ...createForm, password: e.target.value })
                }
              />
            </div>
            <div className="space-y-1.5">
              <Label>
                姓名 <span className="text-destructive">*</span>
              </Label>
              <Input
                placeholder="请输入真实姓名"
                value={createForm.realName}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                  setCreateForm({ ...createForm, realName: e.target.value })
                }
              />
            </div>
            <div className="space-y-1.5">
              <Label>
                角色 <span className="text-destructive">*</span>
              </Label>
              <Select
                value={createForm.role}
                onValueChange={(val: string) =>
                  setCreateForm({ ...createForm, role: val as UserRole })
                }
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="请选择角色" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="student">学生</SelectItem>
                  <SelectItem value="repairer">维修人员</SelectItem>
                  <SelectItem value="admin">后勤管理员</SelectItem>
                  <SelectItem value="super_admin">超级管理员</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>联系电话</Label>
              <Input
                placeholder="选填"
                value={createForm.phone}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                  setCreateForm({ ...createForm, phone: e.target.value })
                }
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label>宿舍楼栋</Label>
                <Input
                  placeholder="选填"
                  value={createForm.dormBuilding}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                    setCreateForm({ ...createForm, dormBuilding: e.target.value })
                  }
                />
              </div>
              <div className="space-y-1.5">
                <Label>宿舍号</Label>
                <Input
                  placeholder="选填"
                  value={createForm.dormRoom}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                    setCreateForm({ ...createForm, dormRoom: e.target.value })
                  }
                />
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setCreateOpen(false)} disabled={createSubmitting}>
              取消
            </Button>
            <Button onClick={handleCreate} disabled={createSubmitting}>
              {createSubmitting ? '提交中...' : '确认创建'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={editOpen} onOpenChange={setEditOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>编辑用户</DialogTitle>
            <DialogDescription>修改用户信息</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-1.5">
              <Label>账号</Label>
              <Input value={editUser?.username || ''} disabled />
            </div>
            <div className="space-y-1.5">
              <Label>
                姓名 <span className="text-destructive">*</span>
              </Label>
              <Input
                placeholder="请输入真实姓名"
                value={editForm.realName}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                  setEditForm({ ...editForm, realName: e.target.value })
                }
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label>角色</Label>
                <Select
                  value={editForm.role}
                  onValueChange={(val: string) =>
                    setEditForm({ ...editForm, role: val as UserRole })
                  }
                >
                  <SelectTrigger className="w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="student">学生</SelectItem>
                    <SelectItem value="repairer">维修人员</SelectItem>
                    <SelectItem value="admin">后勤管理员</SelectItem>
                    <SelectItem value="super_admin">超级管理员</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label>状态</Label>
                <Select
                  value={editForm.status}
                  onValueChange={(val: string) =>
                    setEditForm({ ...editForm, status: val as UserStatus })
                  }
                >
                  <SelectTrigger className="w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="active">启用</SelectItem>
                    <SelectItem value="disabled">禁用</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="space-y-1.5">
              <Label>联系电话</Label>
              <Input
                placeholder="选填"
                value={editForm.phone}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                  setEditForm({ ...editForm, phone: e.target.value })
                }
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label>宿舍楼栋</Label>
                <Input
                  placeholder="选填"
                  value={editForm.dormBuilding}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                    setEditForm({ ...editForm, dormBuilding: e.target.value })
                  }
                />
              </div>
              <div className="space-y-1.5">
                <Label>宿舍号</Label>
                <Input
                  placeholder="选填"
                  value={editForm.dormRoom}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                    setEditForm({ ...editForm, dormRoom: e.target.value })
                  }
                />
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditOpen(false)} disabled={editSubmitting}>
              取消
            </Button>
            <Button onClick={handleEdit} disabled={editSubmitting}>
              {editSubmitting ? '保存中...' : '保存修改'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={resetOpen} onOpenChange={setResetOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>重置密码</DialogTitle>
            <DialogDescription>
              为用户 <span className="font-medium text-slate-800">{resetUser?.username}</span> 重置密码
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-1.5 py-2">
            <Label>
              新密码 <span className="text-destructive">*</span>
            </Label>
            <Input
              type="password"
              placeholder="至少 6 位"
              value={resetPassword}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => setResetPassword(e.target.value)}
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setResetOpen(false)} disabled={resetSubmitting}>
              取消
            </Button>
            <Button onClick={handleResetPassword} disabled={resetSubmitting}>
              {resetSubmitting ? '提交中...' : '确认重置'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={toggleConfirmOpen} onOpenChange={setToggleConfirmOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>
              {toggleUser?.status === 'active' ? '禁用用户' : '启用用户'}
            </DialogTitle>
            <DialogDescription>
              确定要{toggleUser?.status === 'active' ? '禁用' : '启用'}用户{' '}
              <span className="font-medium text-slate-800">{toggleUser?.username}</span>{' '}
              吗？
              {toggleUser?.status === 'active' && (
                <span className="block mt-1 text-amber-600">
                  禁用后该用户将无法登录系统。
                </span>
              )}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setToggleConfirmOpen(false)}
              disabled={toggleSubmitting}
            >
              取消
            </Button>
            <Button
              variant={toggleUser?.status === 'active' ? 'destructive' : 'default'}
              onClick={handleToggleStatus}
              disabled={toggleSubmitting}
            >
              {toggleSubmitting
                ? '提交中...'
                : toggleUser?.status === 'active'
                ? '确认禁用'
                : '确认启用'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={deleteOpen} onOpenChange={setDeleteOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>删除用户</DialogTitle>
            <DialogDescription>
              确定要删除用户{' '}
              <span className="font-medium text-slate-800">{deleteUser?.username}</span>{' '}
              吗？此操作不可恢复。
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setDeleteOpen(false)}
              disabled={deleteSubmitting}
            >
              取消
            </Button>
            <Button
              variant="destructive"
              onClick={handleDelete}
              disabled={deleteSubmitting}
            >
              {deleteSubmitting ? '删除中...' : '确认删除'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default UsersPage;
