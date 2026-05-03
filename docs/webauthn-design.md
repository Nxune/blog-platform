# WebAuthn/Passkey 登录方案设计

> 发布日期：2026-05-03  
> 状态：草稿  
> 目标版本：v2.0 Phase 1

## 1. 设计目标

- 在现有密码登录基础上，增加 WebAuthn/Passkey 无密码认证
- 用户可在设置中注册/管理多个 Passkey
- 密码登录保留作为降级方案（用户无 Passkey 时自动降级）
- 最小化对现有代码的侵入，不改动已有 auth API 路由
- 零信任架构：设备绑定 + 签名验证 + 防重放

---

## 2. 技术选型

### WebAuthn 服务端库

| 方案 | 包体积 | WebAuthn L3 | 维护活跃度 | 结论 |
|------|--------|-------------|-----------|------|
| **@simplewebauthn/server** | ~60KB | 完整支持 | 活跃 | **选用** |
| @passwordless-id/webauthn | ~20KB | 部分支持 | 一般 | 放弃 |
| 自行实现（crypto + ASN.1） | 0 | 高风险 | — | 放弃 |

选择 @simplewebauthn/server 理由：
- 支持完整的 WebAuthn Level 3 规范
- 内置 attestation 验证、counter 检查、origin 校验
- 与 @simplewebauthn/browser 配合实现端到端类型安全
- 社区标准选用

### 认证策略 vs NextAuth 集成

当前架构：NextAuth v5 + JWT 策略 + Credentials/OAuth Provider。

| 集成方案 | 改造成本 | 安全 | 维护性 | 结论 |
|---------|---------|------|--------|------|
| **新增 webauthn Credentials Provider** | **低** | 高 | 高 | **选用** |
| 独立 Session（不走 NextAuth） | 中 | 低（双 session） | 低 | 放弃 |
| 替换 SimpleWebAuthn 内置 Provider | 高 | 高 | 中（上游不稳定） | 放弃 |

**方案说明：** 在 NextAuth providers 数组中新增一个 `id: "webauthn"` 的 Credentials provider。其 `authorize` 函数负责验证 WebAuthn assertion，成功后返回 user 对象，NextAuth 后续的 JWT/session callback **无需任何改动**。

---

## 3. 数据库 Schema 变更

```prisma
// 新增：WebAuthn 凭证存储
model Authenticator {
  id              String   @id @default(cuid())
  credentialId    String   @unique          // WebAuthn credential.id (base64url)
  userId          String
  user            User     @relation(fields: [userId], references: [id], onDelete: Cascade)

  // WebAuthn credential 核心字段
  publicKey       Bytes                     // CBOR 编码的公钥
  counter         BigInt   @default(0)      // 签名计数器，防止克隆设备重放
  credentialType  String   @default("public-key")

  // 传输方式（USB/NFC/BLE/Internal）
  transports      String?                   // JSON 字符串数组

  // 设备信息（用户友好名，如 "Chrome on Windows"）
  deviceName      String?

  // Passkey 备份属性
  backupEligible  Boolean  @default(false)
  backupStatus    Boolean  @default(false)

  createdAt       DateTime @default(now())
  lastUsedAt      DateTime @default(now())

  @@index([userId])
}
```

**不变更的模型：** User 表无需新增字段（通过 Authenticator.userId 关联）。  
**迁移策略：** 独立迁移文件，`prisma migrate dev --name add_authenticator`。

---

## 4. Challenge 存储

WebAuthn 认证协议要求服务器端生成并记住 challenge，后续验证时比较。

```typescript
// src/lib/webauthn-challenge-store.ts
interface ChallengeEntry {
  challenge: string;          // base64url challenge
  email: string;              // 用户邮箱
  userId: string;             // 用户 ID
  expiresAt: number;          // 过期时间戳
}

// 内存存储（单实例足够，如需多实例后续改为 Redis）
const challengeStore = new Map<string, ChallengeEntry>();

const CHALLENGE_TTL = 120_000; // 2 分钟过期
const CLEANUP_INTERVAL = 60_000;

setInterval(() => {
  const now = Date.now();
  for (const [key, entry] of challengeStore) {
    if (entry.expiresAt <= now) challengeStore.delete(key);
  }
}, CLEANUP_INTERVAL).unref();

export function setChallenge(userId: string, email: string, challenge: string) {
  challengeStore.set(userId, { challenge, email, userId, expiresAt: Date.now() + CHALLENGE_TTL });
}

export function getAndVerifyChallenge(userId: string, expectedChallenge: string): boolean {
  const entry = challengeStore.get(userId);
  if (!entry || entry.expiresAt <= Date.now()) return false;
  if (entry.challenge !== expectedChallenge) return false;
  challengeStore.delete(userId); // 一次性使用
  return true;
}
```

**为什么不直接用 DB 存储 challenge？**
- Challenge 是短暂值（< 2 min），写 DB 产生不必要的 IO
- 不需要持久化，用户刷新页面丢弃即可
- 内存实现简单，后续多实例再换 Redis 适配

---

## 5. API 路由设计

### 5.1 路由总表

```
| 方法   | 路径                                            | 说明                         | 角色     |
|--------|-------------------------------------------------|------------------------------|----------|
| POST   | /api/auth/webauthn/register/begin               | 开始注册 Passkey             | 已登录   |
| POST   | /api/auth/webauthn/register/complete            | 完成注册（存储凭证）          | 已登录   |
| GET    | /api/auth/webauthn/login/begin?email=xxx        | 开始登录（获取 challenge）    | 公开     |
| POST   | /api/auth/webauthn/login/complete               | 完成登录（验证 + 签发会话）   | 公开     |
| GET    | /api/auth/webauthn/credentials                  | 列出我的 Passkey              | 已登录   |
| PATCH  | /api/auth/webauthn/credentials/[id]             | 重命名 Passkey                | 已登录   |
| DELETE | /api/auth/webauthn/credentials/[id]             | 删除 Passkey                  | 已登录   |
```

### 5.2 注册流程

```
流：设置 → 添加 Passkey

前端                               服务端
 │                                   │
 ├─ POST /register/begin ──────────► │ 生成 challenge + RP 配置
 │  { }                              │ 存储 challenge → userId
 │                                   │
 │◄─────────── PublicKeyCredentialCreationOptions
 │              { challenge, rp, user, pubKeyParams, ... }
 │
 │  navigator.credentials.create()   │
 │        ┌──────────────────┐       │
 │        │ 用户验证（指纹/PIN）│       │
 │        └──────────────────┘       │
 │  ← 得到 credential               │
 │                                   │
 ├─ POST /register/complete ──────► │ 验证 attestation
 │  { credential, deviceName }      │ 存储到 Authenticator 表
 │                                   │ 删除 challenge
 │◄─────────── { success: true }    │
```

**服务端创建注册选项：**

```typescript
const options = generateRegistrationOptions({
  rpName: "Nexus Community",
  rpID: hostname,
  userName: user.email,
  userDisplayName: user.name ?? user.email,
  attestationType: "none",
  excludeCredentials: [],
  authenticatorSelection: {
    residentKey: "preferred",
    userVerification: "preferred",
  },
});
```

### 5.3 登录流程

```
流：登录页 → 使用 Passkey

前端                               服务端
 │                                   │
 ├─ GET /login/begin?email=xxx ────►│ 查询用户是否有 Passkey
 │                                   │ 生成 challenge，关联 userId
 │                                   │
 │◄─────────── PublicKeyCredentialRequestOptions
 │              { challenge, allowCredentials, ... }
 │
 │  navigator.credentials.get()    │
 │        ┌──────────────────┐    │
 │        │ 用户验证（指纹/PIN）│    │
 │        └──────────────────┘    │
 │  ← 得到 assertion             │
 │                                   │
 ├─ POST /login/complete ─────────► │ 预验证 assertion
 │  { email, credentialId,          │ 从 challengeStore 取出 challenge
 │    clientDataJSON,               │ 比较 counter
 │    authenticatorData,            │
 │    signature }                   │
 │                                   │
 │  (登录 complete 将 challenge     │
 │   注入到 NextAuth 请求上下文)     │
 │                                   │
 │  ┌─ signIn("webauthn", ...)  ──► │ NextAuth webauthn provider
 │  │                               │ authorize: 完整验证 assertion
 │  │                               │ JWT 签发
 │  │◄───────── session ────────── │
 │                                   │
 │◄─────────── { success, url }     │
```

### 5.4 NextAuth 集成

在 `src/lib/auth.ts` 的 providers 数组中新增第二个 Credentials provider：

```typescript
import { verifyAuthenticationResponse } from "@simplewebauthn/server";
import { getOrigin, getRPID } from "@/lib/webauthn-config";
import { getChallenge } from "@/lib/webauthn-challenge-store";

// 在 providers 数组中追加
Credentials({
  id: "webauthn",
  name: "WebAuthn",
  credentials: {
    email: { label: "Email" },
    credentialId: { label: "Credential ID" },
    clientDataJSON: { label: "Client Data" },
    authenticatorData: { label: "Authenticator Data" },
    signature: { label: "Signature" },
  },
  async authorize(credentials) {
    if (!credentials?.email || !credentials?.credentialId) return null;

    // 1. 查找凭证
    const stored = await prisma.authenticator.findUnique({
      where: { credentialId: credentials.credentialId as string },
      include: { user: true },
    });
    if (!stored) return null;

    // 2. 取出 challenge
    const challengeEntry = getChallenge(stored.userId);
    if (!challengeEntry) return null;

    // 3. 验证 assertion
    let verification;
    try {
      verification = await verifyAuthenticationResponse({
        response: {
          id: credentials.credentialId as string,
          response: {
            clientDataJSON: credentials.clientDataJSON as string,
            authenticatorData: credentials.authenticatorData as string,
            signature: credentials.signature as string,
          },
        },
        expectedChallenge: challengeEntry.challenge,
        expectedOrigin: getOrigin(),
        expectedRPID: getRPID(),
        credential: {
          id: stored.credentialId,
          publicKey: new Uint8Array(stored.publicKey),
          counter: Number(stored.counter),
        },
      });
    } catch {
      return null;
    }

    if (!verification.verified) return null;

    // 4. 更新 counter
    await prisma.authenticator.update({
      where: { id: stored.id },
      data: {
        counter: verification.authenticationInfo.newCounter,
        lastUsedAt: new Date(),
      },
    });

    return {
      id: stored.user.id,
      email: stored.user.email,
      name: stored.user.name,
      image: stored.user.image,
      role: stored.user.role,
    };
  },
}),
```

RP 配置从环境变量读取，确保生产环境 origin 白名单可配置：

```typescript
// src/lib/webauthn-config.ts
export function getOrigin(): string {
  return process.env.WEBAUTHN_ORIGIN ?? "http://localhost:3000";
}
export function getRPID(): string {
  return process.env.WEBAUTHN_RP_ID ?? "localhost";
}
```

---

## 6. 前端组件设计

### 6.1 组件树

```
src/
  components/auth/
    LoginForm.tsx              ← 重构：增加 Passkey 按钮
    RegisterForm.tsx           ← 不变（注册后引导添加 Passkey）
    PasskeyRegisterButton.tsx  ← "添加 Passkey" 按钮（设置页）
  app/dashboard/settings/
    page.tsx                   ← 重构：增加 "我的 Passkey" 管理区域
  hooks/useWebAuthn.ts        ← WebAuthn 浏览器 API 封装
```

### 6.2 LoginForm 改造

```tsx
// 核心交互逻辑（伪代码）
export function LoginForm() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [hasPasskey, setHasPasskey] = useState<boolean | null>(null);
  const [usePasskey, setUsePasskey] = useState(false);

  // 输入 email 后，检查用户是否注册了 Passkey
  useEffect(() => {
    if (!email || !isValidEmail(email)) {
      setHasPasskey(null);
      return;
    }
    fetch(`/api/auth/webauthn/login/begin?email=${encodeURIComponent(email)}`)
      .then(res => res.json())
      .then(data => setHasPasskey(data.hasCredentials))
      .catch(() => setHasPasskey(false));
  }, [email]);

  const handlePasskeyLogin = async () => {
    // 1. 获取 challenge
    const beginRes = await fetch(
      `/api/auth/webauthn/login/begin?email=${encodeURIComponent(email)}`
    );
    const options = await beginRes.json();

    // 2. 浏览器创建 assertion
    const assertion = await startAuthentication({ optionsJSON: options });

    // 3. 通过 NextAuth signIn 发送到 webauthn provider
    const result = await signIn("webauthn", {
      email,
      credentialId: assertion.id,
      clientDataJSON: assertion.response.clientDataJSON,
      authenticatorData: assertion.response.authenticatorData,
      signature: assertion.response.signature,
      redirect: false,
    });

    if (result?.error) {
      setError("Passkey 验证失败，请重试或使用密码登录");
    } else {
      router.push("/dashboard");
      router.refresh();
    }
  };

  return (
    <form>
      {/* 邮箱输入（共享） */}
      <input value={email} onChange={setEmail} />

      {/* 密码输入（Passkey 模式下隐藏） */}
      {!usePasskey && (
        <input type="password" value={password} onChange={setPassword} />
      )}

      {/* 登录按钮 */}
      {usePasskey ? (
        <button onClick={handlePasskeyLogin}>
          使用 Passkey 登录
        </button>
      ) : (
        <button type="submit">密码登录</button>
      )}

      {/* 切换登录方式 */}
      {hasPasskey && (
        <button onClick={() => setUsePasskey(!usePasskey)}>
          {usePasskey ? "使用密码登录" : "使用 Passkey 登录"}
        </button>
      )}
    </form>
  );
}
```

**交互逻辑总结：**

| 场景 | 默认行为 |
|------|---------|
| 用户有 Passkey | 显示 Passkey 按钮 + "使用密码登录" 切换 |
| 用户无 Passkey | 仅显示密码输入，无切换 |
| 浏览器不支持 WebAuthn | 隐藏所有 Passkey 相关 UI，仅显示密码输入 |

### 6.3 设置页 — Passkey 管理

```
┌────────────────────────────────────────┐
│  🔑 我的 Passkey                        │
│                                         │
│  ├─ Chrome on Windows — 2026-04-28     │
│  │  [重命名]  [删除]                    │
│                                         │
│  ├─ iPhone 15 Pro — 2026-05-01         │
│  │  [重命名]  [删除]                    │
│                                         │
│  [+ 添加 Passkey]                       │
└────────────────────────────────────────┘
```

### 6.4 useWebAuthn Hook

```typescript
// src/hooks/useWebAuthn.ts
import { startRegistration, startAuthentication } from "@simplewebauthn/browser";
import type {
  PublicKeyCredentialCreationOptionsJSON,
  PublicKeyCredentialRequestOptionsJSON,
} from "@simplewebauthn/browser";

export function useWebAuthn() {
  const registerPasskey = async (options: PublicKeyCredentialCreationOptionsJSON) => {
    return startRegistration({ optionsJSON: options });
  };

  const authenticatePasskey = async (options: PublicKeyCredentialRequestOptionsJSON) => {
    return startAuthentication({ optionsJSON: options });
  };

  const isWebAuthnSupported =
    typeof window !== "undefined" &&
    typeof window.PublicKeyCredential !== "undefined";

  return { registerPasskey, authenticatePasskey, isWebAuthnSupported };
}
```

---

## 7. 安全设计

### 7.1 零信任原则

| 原则 | 实现方式 |
|------|---------|
| 每次请求都验证 | challenge 一次性使用 + 2 分钟 TTL |
| 最小权限 | WebAuthn Credentials Provider 只读 user 表基本字段 |
| 凭证绑定 | `credentialId @@unique` 保证不重复 |
| 防重放 | counter 每次认证递增，服务端校验 |
| 来源校验 | `expectedOrigin` + `expectedRPID` 双验证 |
| 设备校验 | attestation 可选（设为 "none" 降低门槛） |

### 7.2 威胁模型

| 攻击场景 | 缓解措施 |
|---------|---------|
| 钓鱼攻击 | WebAuthn 绑定 origin，凭证无法在其他站点使用 |
| 凭证克隆 | counter 递增检测，拒绝 counter <= 上次记录的断言 |
| Challenge 重放 | 一次性使用 + 2 分钟 TTL |
| CSRF | WebAuthn 由浏览器执行，不存在 CSRF token 泄露 |
| 中间人攻击 | TLS 保证传输安全，签名绑定 origin |

### 7.3 环境变量

```bash
# .env 新增
WEBAUTHN_ORIGIN=http://localhost:3000
WEBAUTHN_RP_ID=localhost
```

生产环境：
```bash
WEBAUTHN_ORIGIN=https://nexus-community.dev
WEBAUTHN_RP_ID=nexus-community.dev
```

---

## 8. 现有代码变更清单

### 新增文件（13 个）

```
src/lib/webauthn-config.ts                         ← RP 配置
src/lib/webauthn-challenge-store.ts                ← Challenge 内存存储
src/services/webauthn.service.ts                   ← 注册/验证核心逻辑
src/types/webauthn.ts                              ← 类型定义
src/hooks/useWebAuthn.ts                           ← 浏览器 API 封装
src/components/auth/PasskeyRegisterButton.tsx       ← 添加 Passkey 按钮
src/app/api/auth/webauthn/register/begin/route.ts
src/app/api/auth/webauthn/register/complete/route.ts
src/app/api/auth/webauthn/login/begin/route.ts
src/app/api/auth/webauthn/login/complete/route.ts
src/app/api/auth/webauthn/credentials/route.ts
src/app/api/auth/webauthn/credentials/[id]/route.ts
```

### 修改文件（4 个）

```
prisma/schema.prisma            ← 新增 Authenticator 模型
src/lib/auth.ts                 ← 新增 "webauthn" Credentials Provider
src/components/auth/LoginForm.tsx    ← 增加 Passkey 登录入口
src/app/dashboard/settings/page.tsx  ← 增加 Passkey 管理区域
```

### 包依赖

```json
{
  "dependencies": {
    "@simplewebauthn/server": "^12.0.0",
    "@simplewebauthn/browser": "^12.0.0"
  }
}
```

（注：`package.json` 中已存在 `@simplewebauthn/browser` 和 `@simplewebauthn/server` v13.3.0，无需再次安装。）

---

## 9. 实施路线

| 步骤 | 内容 | 预估 | 可并行 |
|------|------|------|--------|
| 1 | Prisma schema + migration | 0.5d | — |
| 2 | WebAuthn 配置 + challenge store | 0.25d | 是 |
| 3 | WebAuthn Service 层 | 0.5d | 是 |
| 4 | API routes — register begin/complete | 0.5d | 是 |
| 5 | API routes — login begin/complete | 0.5d | 是 |
| 6 | API routes — credentials CRUD | 0.25d | 是 |
| 7 | NextAuth 集成（webauthn provider） | 0.5d | 否（依赖 1,2,3） |
| 8 | LoginForm 改造 + useWebAuthn hook | 0.5d | 是 |
| 9 | 设置页 Passkey 管理 UI | 0.5d | 是 |
| 10 | 集成测试 + E2E | 1d | 否 |

**总计：~5 个工作日**，步骤 2-6 与 8-9 可并行执行。

---

## 10. 风险与缓解

| 风险 | 影响 | 缓解措施 |
|------|------|---------|
| 用户浏览器不支持 WebAuthn | 登录流程阻断 | 自动检测 `window.PublicKeyCredential`，不支持的设备隐藏 Passkey 入口 |
| 用户丢失所有 Passkey | 无法登录 | 保留密码登录 + 邮箱找回密码作为兜底 |
| 多实例部署时 challenge 丢失 | WebAuthn 登录失败 | 迁移 challenge 到 DB 或 Redis；当前内存实现在多实例场景概率极低 |
| @simplewebauthn major 升级 | API 变更 | 在 webauthn.service.ts 中封装，升级只改一个文件 |
| Apple/Google Passkey UI 差异 | 用户体验不一致 | 使用浏览器原生对话框，不做自定义 UI 覆盖 |

---

## 11. 完整登录流程图

```
用户输入 email
      │
      ├─ 浏览器不支持 WebAuthn ──► 密码登录（不变）
      │
      └─ 浏览器支持 WebAuthn
              │
              ├─ email 关联了 Passkey
              │     │
              │     ├─ 用户选择 Passkey 登录
              │     │    └─ GET /login/begin
              │     │    └─ navigator.credentials.get()
              │     │    └─ signIn("webauthn", ...)
              │     │    └─ JWT ✓
              │     │
              │     └─ 用户选择密码登录
              │          └─ signIn("credentials", ...)
              │          └─ JWT ✓
              │
              └─ email 无 Passkey ──► 密码登录（不变）
```

> **设计原则：** Passkey 是补充，不是替代。密码登录保持 100% 可用。  
> **用户感知：** 注册 Passkey 的用户获得一键登录体验，否则一切照旧。

---

> Assisted-by: Claude Code CLI:deepseek-v4-pro[1m]
> Signed-off-by: Nxune <nxune@users.noreply.github.com>
