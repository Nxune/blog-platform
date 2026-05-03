# 用户主页 + 点赞收藏 — 架构设计

## 1. 用户公开主页

### Schema
```prisma
// User 模型新增字段
model User {
  bio       String?   // 个人简介
  website   String?   // 个人网站
  location  String?   // 所在地
}
```

### 路由
| 路径 | 说明 |
|------|------|
| `/u/[username]` | 用户公开主页（帖子列表 + 简介） |

### API
| 方法 | 路径 | 说明 |
|------|------|------|
| GET | /api/users/[id]/profile | 公开资料 |
| PATCH | /api/auth/profile | 编辑资料（已有，扩展字段） |

## 2. 点赞/收藏

### Schema
```prisma
model Like {
  id     String   @id @default(cuid())
  userId String
  postId String
  createdAt DateTime @default(now())
  user   User @relation(fields: [userId], references: [id], onDelete: Cascade)
  post   Post @relation(fields: [postId], references: [id], onDelete: Cascade)
  @@unique([userId, postId])
}
```

### API
| 方法 | 路径 | 说明 |
|------|------|------|
| POST | /api/posts/[slug]/like | 点赞/取消点赞 |
| GET | /api/posts/[slug]/likes | 点赞数 |
| GET | /api/users/[id]/likes | 用户点赞的帖子 |

## 3. 前端
- PostCard: 显示点赞数 + 点赞按钮（心形图标）
- `/u/[username]`: 用户主页组件
- Header: 用户头像链接到个人主页
