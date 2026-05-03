# 部署指南

## 环境要求

- Node.js >= 18.x
- pnpm >= 8.x
- Docker & Docker Compose (推荐)

## 快速部署

### 使用 Docker Compose

```bash
# 构建并启动
docker-compose up -d --build

# 初始化数据库
docker-compose exec app pnpm db:migrate

# 查看日志
docker-compose logs -f
```

### 手动部署

```bash
# 安装依赖
pnpm install

# 配置环境变量
cp .env.example .env
# 编辑 .env，确保 DATABASE_URL 指向运行中的 PostgreSQL

# 数据库迁移
pnpm db:migrate

# 构建
pnpm build

# 启动
pnpm start
```

## 环境变量

| 变量 | 说明 | 默认值 |
|------|------|--------|
| `DATABASE_URL` | PostgreSQL 连接字符串 | `postgresql://dev:dev_password@localhost:5432/blog_platform` |
| `AUTH_SECRET` | NextAuth 加密密钥 | 必填，生产环境使用高强度随机字符串 |
| `AUTH_URL` | 部署 URL | `http://localhost:3000` |
| `AUTH_GITHUB_ID` | GitHub OAuth ID | 可选 |
| `AUTH_GITHUB_SECRET` | GitHub OAuth Secret | 可选 |
| `AUTH_GOOGLE_ID` | Google OAuth ID | 可选 |
| `AUTH_GOOGLE_SECRET` | Google OAuth Secret | 可选 |

## 安全部署检查清单

- [ ] `AUTH_SECRET` 已更换为 `openssl rand -base64 32` 生成的值
- [ ] 数据库密码已更换
- [ ] HTTPS 已配置
- [ ] Nginx 反向代理安全头已配置
- [ ] 生产环境 `NODE_ENV=production`

## 数据库

```bash
# 迁移
pnpm db:migrate

# 查看数据 (Prisma Studio)
pnpm db:studio

# 生成 Prisma 客户端
pnpm db:generate
```
