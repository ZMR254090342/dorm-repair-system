# 宿舍报修管理系统

## 应用概览

多角色工单流转系统：学生提交报修 → 后勤管理员审核派单 → 维修人员处理 → 学生评价。自建账号体系（账号+密码登录），使用 cookie session 做认证。

## 技术架构

- 认证方式：自建账号体系（username + password），bcrypt 加密密码，session cookie 维护登录态
- 数据库：PostgreSQL + Drizzle ORM
- 前端：React 19 + Tailwind + shadcn/ui
- 角色：student（学生）、repairer（维修人员）、admin（后勤管理员）、super_admin（超级管理员）

## 数据库表设计

### users 表（系统用户表）
- id: uuid PK
- username: varchar(50) UNIQUE NOT NULL - 登录账号
- password_hash: varchar(255) NOT NULL - 密码哈希
- real_name: varchar(50) NOT NULL - 真实姓名
- role: varchar(20) NOT NULL - student / repairer / admin / super_admin
- phone: varchar(20) - 联系电话
- status: varchar(20) NOT NULL DEFAULT 'active' - active / disabled
- dorm_building: varchar(50) - 学生宿舍楼栋（学生用）
- dorm_room: varchar(20) - 学生宿舍号（学生用）
- _created_at / _created_by / _updated_at / _updated_by

### repair_orders 表（报修工单表）
- id: uuid PK
- order_no: varchar(32) UNIQUE NOT NULL - 工单编号（自动生成）
- student_id: uuid NOT NULL REFERENCES users(id) - 提交学生
- dorm_building: varchar(50) NOT NULL - 宿舍楼栋
- dorm_room: varchar(20) NOT NULL - 宿舍号
- fault_type: varchar(20) NOT NULL - 故障类型：water_electric / furniture / door_window / network / other
- fault_description: text NOT NULL - 故障描述
- fault_images: text[] - 故障图片 URL 数组
- status: varchar(20) NOT NULL DEFAULT 'pending_review' - 工单状态
- reject_reason: text - 驳回原因
- repairer_id: uuid REFERENCES users(id) - 分配的维修人员
- repair_note: text - 维修备注
- repair_result: text - 维修结果说明
- _created_at / _created_by / _updated_at / _updated_by

### reviews 表（评价表）
- id: uuid PK
- order_id: uuid UNIQUE NOT NULL REFERENCES repair_orders(id)
- student_id: uuid NOT NULL REFERENCES users(id)
- rating: smallint NOT NULL - 1-5星
- content: text - 文字评价
- _created_at / _created_by / _updated_at / _updated_by

## 工单状态流转

- pending_review（待审核）→ 学生提交
- pending_repair（待维修）→ 管理员审核通过并派单
- repairing（维修中）→ 维修人员接单
- pending_review_done（待评价）→ 维修人员完成
- completed（已完成）→ 学生评价后
- rejected（已驳回）→ 管理员驳回
- cancelled（已取消）→ 学生取消

## 设计规范

- 主色调：蓝色系（hsl(221 83% 53%)），配合青绿色辅助色
- 卡片圆角：lg，阴影：sm
- 间距基准：4px（--spacing: 0.25rem）
- 布局：左侧侧边栏导航 + 右侧内容区
- 状态标签颜色：
  - pending_review: warning（橙色）
  - pending_repair: info（蓝色）
  - repairing: primary（靛蓝）
  - pending_review_done: success（绿色）
  - completed: success（绿色）
  - rejected: destructive（红色）
  - cancelled: muted（灰色）

## 页面路由

- /login - 登录页（公开）
- /register - 学生注册页（公开）
- /student/dashboard - 学生首页
- /student/submit - 提交报修
- /student/orders - 我的报修
- /student/orders/:id - 工单详情
- /repairer/dashboard - 维修人员首页
- /repairer/orders - 我的工单
- /repairer/orders/:id - 工单处理
- /admin/dashboard - 管理员首页
- /admin/orders - 工单管理
- /admin/orders/:id - 工单详情/审核
- /admin/stats - 数据统计
- /super/users - 用户管理
