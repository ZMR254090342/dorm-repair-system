import { logger } from '@lark-apaas/client-toolkit/logger';
import { axiosForBackend } from '@lark-apaas/client-toolkit/utils/getAxiosForBackend';
import type {
  LoginRequest,
  LoginResponse,
  RegisterRequest,
  UserInfo,
  RepairOrder,
  CreateOrderRequest,
  OrderListResponse,
  AssignOrderRequest,
  RejectOrderRequest,
  UpdateOrderStatusRequest,
  CreateReviewRequest,
  ReviewInfo,
  OrderStatsResponse,
  UserListResponse,
  CreateUserRequest,
  UpdateUserRequest,
  ResetPasswordRequest,
} from '@shared/api.interface';

const getErrorMessage = (error: any): string => {
  return error?.response?.data?.error?.message || '操作失败，请稍后重试';
};

export const authApi = {
  async login(data: LoginRequest): Promise<LoginResponse> {
    try {
      const res = await axiosForBackend.post('/api/auth/login', data);
      return res.data;
    } catch (error) {
      logger.error('登录失败', error);
      throw new Error(getErrorMessage(error));
    }
  },

  async register(data: RegisterRequest): Promise<LoginResponse> {
    try {
      const res = await axiosForBackend.post('/api/auth/register', data);
      return res.data;
    } catch (error) {
      logger.error('注册失败', error);
      throw new Error(getErrorMessage(error));
    }
  },

  async logout(): Promise<{ success: true }> {
    try {
      const res = await axiosForBackend.post('/api/auth/logout');
      return res.data;
    } catch (error) {
      logger.error('登出失败', error);
      throw new Error(getErrorMessage(error));
    }
  },

  async me(): Promise<{ user: UserInfo | null }> {
    try {
      const res = await axiosForBackend.get('/api/auth/me');
      return res.data;
    } catch (error) {
      logger.error('获取当前用户失败', error);
      return { user: null };
    }
  },
};

export const ordersApi = {
  async create(data: CreateOrderRequest): Promise<RepairOrder> {
    try {
      const res = await axiosForBackend.post('/api/orders', data);
      return res.data;
    } catch (error) {
      logger.error('创建工单失败', error);
      throw new Error(getErrorMessage(error));
    }
  },

  async list(params: {
    status?: string;
    faultType?: string;
    page?: number;
    pageSize?: number;
  }): Promise<OrderListResponse> {
    try {
      const res = await axiosForBackend.get('/api/orders', { params });
      return res.data;
    } catch (error) {
      logger.error('获取工单列表失败', error);
      throw new Error(getErrorMessage(error));
    }
  },

  async get(id: string): Promise<RepairOrder> {
    try {
      const res = await axiosForBackend.get(`/api/orders/${id}`);
      return res.data;
    } catch (error) {
      logger.error('获取工单详情失败', error);
      throw new Error(getErrorMessage(error));
    }
  },

  async listRepairers(): Promise<Array<{ id: string; realName: string; phone?: string }>> {
    try {
      const res = await axiosForBackend.get('/api/orders/repairers');
      return res.data;
    } catch (error) {
      logger.error('获取维修人员列表失败', error);
      throw new Error(getErrorMessage(error));
    }
  },

  async assign(id: string, data: AssignOrderRequest): Promise<RepairOrder> {
    try {
      const res = await axiosForBackend.patch(`/api/orders/${id}/assign`, data);
      return res.data;
    } catch (error) {
      logger.error('派单失败', error);
      throw new Error(getErrorMessage(error));
    }
  },

  async reject(id: string, data: RejectOrderRequest): Promise<RepairOrder> {
    try {
      const res = await axiosForBackend.patch(`/api/orders/${id}/reject`, data);
      return res.data;
    } catch (error) {
      logger.error('驳回失败', error);
      throw new Error(getErrorMessage(error));
    }
  },

  async updateStatus(id: string, data: UpdateOrderStatusRequest): Promise<RepairOrder> {
    try {
      const res = await axiosForBackend.patch(`/api/orders/${id}/status`, data);
      return res.data;
    } catch (error) {
      logger.error('更新工单状态失败', error);
      throw new Error(getErrorMessage(error));
    }
  },

  async cancel(id: string): Promise<RepairOrder> {
    try {
      const res = await axiosForBackend.patch(`/api/orders/${id}/cancel`);
      return res.data;
    } catch (error) {
      logger.error('取消工单失败', error);
      throw new Error(getErrorMessage(error));
    }
  },

  async createReview(data: CreateReviewRequest): Promise<ReviewInfo> {
    try {
      const res = await axiosForBackend.post('/api/orders/review', data);
      return res.data;
    } catch (error) {
      logger.error('提交评价失败', error);
      throw new Error(getErrorMessage(error));
    }
  },

  async getReview(orderId: string): Promise<{ review: ReviewInfo | null }> {
    try {
      const res = await axiosForBackend.get(`/api/orders/${orderId}/review`);
      return res.data;
    } catch (error) {
      logger.error('获取评价失败', error);
      throw new Error(getErrorMessage(error));
    }
  },
};

export const statsApi = {
  async getOrderStats(): Promise<OrderStatsResponse> {
    try {
      const res = await axiosForBackend.get('/api/stats/orders');
      return res.data;
    } catch (error) {
      logger.error('获取统计数据失败', error);
      throw new Error(getErrorMessage(error));
    }
  },
};

export const usersApi = {
  async list(params: {
    role?: string;
    keyword?: string;
    page?: number;
    pageSize?: number;
  }): Promise<UserListResponse> {
    try {
      const res = await axiosForBackend.get('/api/admin/users', { params });
      return res.data;
    } catch (error) {
      logger.error('获取用户列表失败', error);
      throw new Error(getErrorMessage(error));
    }
  },

  async create(data: CreateUserRequest): Promise<UserInfo> {
    try {
      const res = await axiosForBackend.post('/api/admin/users', data);
      return res.data;
    } catch (error) {
      logger.error('创建用户失败', error);
      throw new Error(getErrorMessage(error));
    }
  },

  async update(id: string, data: UpdateUserRequest): Promise<UserInfo> {
    try {
      const res = await axiosForBackend.patch(`/api/admin/users/${id}`, data);
      return res.data;
    } catch (error) {
      logger.error('更新用户失败', error);
      throw new Error(getErrorMessage(error));
    }
  },

  async resetPassword(id: string, data: ResetPasswordRequest): Promise<{ success: true }> {
    try {
      const res = await axiosForBackend.patch(`/api/admin/users/${id}/reset-password`, data);
      return res.data;
    } catch (error) {
      logger.error('重置密码失败', error);
      throw new Error(getErrorMessage(error));
    }
  },

  async remove(id: string): Promise<{ success: true }> {
    try {
      const res = await axiosForBackend.delete(`/api/admin/users/${id}`);
      return res.data;
    } catch (error) {
      logger.error('删除用户失败', error);
      throw new Error(getErrorMessage(error));
    }
  },
};
