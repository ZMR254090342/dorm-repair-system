export type UserRole = 'student' | 'repairer' | 'admin' | 'super_admin';

export type UserStatus = 'active' | 'disabled';

export interface UserInfo {
  id: string;
  username: string;
  realName: string;
  role: UserRole;
  phone?: string;
  status: UserStatus;
  dormBuilding?: string;
  dormRoom?: string;
  createdAt: string;
}

export type FaultType =
  | 'water_electric'
  | 'furniture'
  | 'door_window'
  | 'network'
  | 'other';

export type OrderStatus =
  | 'pending_review'
  | 'pending_repair'
  | 'repairing'
  | 'pending_review_done'
  | 'completed'
  | 'rejected'
  | 'cancelled';

export interface RepairOrder {
  id: string;
  orderNo: string;
  studentId: string;
  studentName: string;
  studentPhone?: string;
  dormBuilding: string;
  dormRoom: string;
  faultType: FaultType;
  faultDescription: string;
  faultImages: string[];
  status: OrderStatus;
  rejectReason?: string;
  repairerId?: string;
  repairerName?: string;
  repairNote?: string;
  repairResult?: string;
  createdAt: string;
  updatedAt: string;
}

export interface ReviewInfo {
  id: string;
  orderId: string;
  studentId: string;
  rating: number;
  content?: string;
  createdAt: string;
}

export interface LoginRequest {
  username: string;
  password: string;
}

export interface LoginResponse {
  user: UserInfo;
}

export interface RegisterRequest {
  username: string;
  password: string;
  realName: string;
  phone?: string;
  dormBuilding?: string;
  dormRoom?: string;
}

export interface CreateOrderRequest {
  dormBuilding: string;
  dormRoom: string;
  faultType: FaultType;
  faultDescription: string;
  faultImages?: string[];
}

export interface OrderListResponse {
  items: RepairOrder[];
  total: number;
  page: number;
  pageSize: number;
}

export interface AssignOrderRequest {
  repairerId: string;
}

export interface RejectOrderRequest {
  rejectReason: string;
}

export interface UpdateOrderStatusRequest {
  status: 'repairing' | 'pending_review_done';
  repairNote?: string;
  repairResult?: string;
}

export interface CreateReviewRequest {
  orderId: string;
  rating: number;
  content?: string;
}

export interface OrderStatsResponse {
  total: number;
  completed: number;
  pending: number;
  repairing: number;
  byFaultType: { type: FaultType; count: number }[];
  byRepairer: { repairerId: string; repairerName: string; count: number }[];
}

export interface UserListResponse {
  items: UserInfo[];
  total: number;
  page: number;
  pageSize: number;
}

export interface CreateUserRequest {
  username: string;
  password: string;
  realName: string;
  role: UserRole;
  phone?: string;
  dormBuilding?: string;
  dormRoom?: string;
}

export interface UpdateUserRequest {
  realName?: string;
  role?: UserRole;
  phone?: string;
  status?: UserStatus;
  dormBuilding?: string;
  dormRoom?: string;
}

export interface ResetPasswordRequest {
  newPassword: string;
}

export const FAULT_TYPE_LABELS: Record<FaultType, string> = {
  water_electric: '水电故障',
  furniture: '家具损坏',
  door_window: '门窗损坏',
  network: '网络故障',
  other: '其他',
};

export const ORDER_STATUS_LABELS: Record<OrderStatus, string> = {
  pending_review: '待审核',
  pending_repair: '待维修',
  repairing: '维修中',
  pending_review_done: '待评价',
  completed: '已完成',
  rejected: '已驳回',
  cancelled: '已取消',
};

export const ROLE_LABELS: Record<UserRole, string> = {
  student: '学生',
  repairer: '维修人员',
  admin: '后勤管理员',
  super_admin: '超级管理员',
};
