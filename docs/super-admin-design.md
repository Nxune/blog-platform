# 超级管理员系统设计方案

## 权限层级
SUPER_ADMIN > ADMIN > USER

## Schema 变更
Role 枚举增加 SUPER_ADMIN

## API
- GET /api/admin/users — 用户列表（SUPER_ADMIN）
- PATCH /api/admin/users/[id]/role — 修改角色
- DELETE /api/admin/users/[id] — 删除用户

## 安全规则
1. 不能修改/删除自己
2. 不能操作其他 SUPER_ADMIN
3. requireSuperAdmin() 强制校验
4. 操作日志记录
