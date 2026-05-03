# API 文档

## 通用约定

### 认证
使用 NextAuth.js v5 Session。受保护的 API 通过 `Authorization: Bearer <token>` 或 Session Cookie 认证。前端使用 `useSession()` 获取状态。

### 分页
| 参数 | 默认值 | 说明 |
|------|--------|------|
| `page` | 1 | 页码 |
| `pageSize` | 10 | 每页条数 |

响应格式：
```json
{
  "posts": [...],
  "total": 100,
  "page": 1,
  "pageSize": 10,
  "totalPages": 10
}
```

## 端点列表

### 认证 — `/api/auth/*`

| 方法 | 路径 | 说明 | 角色 |
|------|------|------|------|
| POST | `/api/auth/register` | 注册 | 公开 |
| POST | `/api/auth/login` | 登录 | 公开 |
| GET | `/api/auth/session` | 会话状态 | 公开 |
| POST | `/api/auth/logout` | 登出 | 已登录 |
| GET | `/api/auth/profile` | 获取资料 | 已登录 |
| PATCH | `/api/auth/profile` | 修改资料 | 已登录 |

### 文章 — `/api/posts/*`

| 方法 | 路径 | 说明 | 角色 |
|------|------|------|------|
| GET | `/api/posts` | 文章列表 | 公开 |
| GET | `/api/posts/[slug]` | 文章详情 | 公开 |
| POST | `/api/posts` | 创建文章 | ADMIN/AUTHOR |
| PATCH | `/api/posts/[slug]` | 更新文章 | ADMIN/AUTHOR(自有) |
| DELETE | `/api/posts/[slug]` | 删除文章 | ADMIN/AUTHOR(自有) |

**查询参数 (GET /api/posts):** `page`, `pageSize`, `published`, `tag`, `search`

### 评论 — `/api/posts/[slug]/comments`, `/api/comments/*`

| 方法 | 路径 | 说明 | 角色 |
|------|------|------|------|
| GET | `/api/posts/[slug]/comments` | 获取评论 | 公开 |
| POST | `/api/posts/[slug]/comments` | 发表评论 | 已登录 |
| DELETE | `/api/comments/[id]` | 删除评论 | ADMIN/作者 |
| PATCH | `/api/comments/[id]/status` | 审核评论 | ADMIN |

### 标签 — `/api/tags`

| 方法 | 路径 | 说明 | 角色 |
|------|------|------|------|
| GET | `/api/tags` | 标签列表 | 公开 |
| POST | `/api/tags` | 创建标签 | ADMIN |
| DELETE | `/api/tags?id=` | 删除标签 | ADMIN |

### 搜索 — `/api/search`

| 方法 | 路径 | 说明 | 角色 |
|------|------|------|------|
| GET | `/api/search?q=` | 全文搜索 | 公开 |

## 错误码

| 状态码 | 说明 |
|--------|------|
| 200 | 成功 |
| 201 | 创建成功 |
| 400 | 参数错误 |
| 401 | 未登录 |
| 403 | 无权限 |
| 404 | 资源不存在 |
| 409 | 资源冲突 |
| 500 | 服务器错误 |
