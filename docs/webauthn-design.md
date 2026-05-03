# WebAuthn/Passkey 登录 — 架构设计

## 原则
- 最小化改动现有代码
- Passkey 优先，密码作为降级
- 零信任：凭证签名链，设备绑定
- 与 NextAuth.js v5 共存

## Schema 变更

```prisma
model Credential {
  id         String   @id
  userId     String
  publicKey  String
  counter    Int      @default(0)
  backedUp   Boolean  @default(false)
  transports String?
  createdAt  DateTime @default(now())
  lastUsed   DateTime @default(now())

  user       User     @relation(fields: [userId], references: [id], onDelete: Cascade)
}

model Challenge {
  id        String   @id @default(cuid())
  userId    String?
  challenge String
  expires   DateTime
  createdAt DateTime @default(now())
}
```

## API 设计

| Method | Path | 说明 |
|--------|------|------|
| POST | /api/auth/webauthn/register-options | 生成注册挑战 |
| POST | /api/auth/webauthn/register-verify | 验证注册凭证 |
| POST | /api/auth/webauthn/login-options | 生成登录挑战 |
| POST | /api/auth/webauthn/login-verify | 验证登录凭证 |

## 前端改造

- LoginForm: 添加 "使用 Passkey 登录" 按钮
- RegisterForm: 添加 "使用 Passkey 注册" 按钮
- 使用 SimpleWebAuthn 浏览器 API

## 安全
- 挑战 5 分钟过期，一次性使用
- 计数器防重放
- 公钥不可导出
- 保留密码登录（不删除）
