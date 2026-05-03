# Blog Platform 测试策略文档

> 状态: 待执行 | 测试工程师: Tester | 更新日期: 2026-05-03

---

## 1. 测试目标

- **功能正确性**: 所有 API 端点按规范返回正确响应
- **边界鲁棒性**: 处理空值、超长输入、特殊字符、并发等边界条件
- **安全防护**: 认证绕过、权限越权、XSS、SQL 注入等安全场景
- **性能基线**: 关键接口在合理负载下的响应时间
- **用户体验**: 关键用户流程在 E2E 层面正常工作

## 2. 技术栈

| 层面 | 选型 |
|------|------|
| 全栈框架 | Next.js 16.2 (App Router) |
| 语言 | TypeScript (strict) |
| 数据库 | SQLite + Prisma 7 |
| 认证 | Better Auth |
| 样式 | Tailwind CSS v4 |
| Markdown | react-markdown + remark/rehype |
| 单元/集成测试 | Vitest |
| E2E 测试 | Playwright |
| 包管理 | pnpm |

## 3. 测试层级

| 层级 | 工具 | 覆盖率目标 | 执行频率 |
|------|------|-----------|---------|
| 单元测试 | Vitest | > 85% | 每次提交 |
| 集成测试 | Vitest + API Routes | > 80% | 每次提交 |
| E2E 测试 | Playwright | 关键流程全覆盖 | PR 合并前 |
| 安全测试 | 手动 + 自动化 | OWASP Top 10 | 发布前 |

## 4. 测试目录结构

```
tests/
├── unit/                    # 单元测试
│   ├── lib/                 # 工具函数测试
│   │   ├── utils.test.ts
│   │   └── validations.test.ts
│   ├── components/          # 组件测试
│   │   ├── PostCard.test.tsx
│   │   ├── CommentTree.test.tsx
│   │   ├── LoginForm.test.tsx
│   │   └── Editor.test.tsx
│   └── hooks/               # 自定义 Hook 测试
│       └── useAuth.test.ts
├── integration/             # 集成测试
│   ├── api/                 # API 端点测试
│   │   ├── auth.test.ts
│   │   ├── posts.test.ts
│   │   ├── comments.test.ts
│   │   ├── tags.test.ts
│   │   ├── users.test.ts
│   │   ├── admin.test.ts
│   │   └── health.test.ts
│   └── db/                  # 数据库操作测试
│       └── prisma.test.ts
├── e2e/                     # E2E 测试
│   ├── auth.spec.ts
│   ├── blog.spec.ts
│   ├── comments.spec.ts
│   └── search.spec.ts
├── fixtures/                # 测试夹具
│   ├── users.ts
│   ├── posts.ts
│   └── comments.ts
├── helpers/                 # 测试辅助工具
│   ├── setup.ts
│   └── auth-helper.ts
├── vitest.config.ts         # Vitest 配置
├── playwright.config.ts     # Playwright 配置
└── setup.ts                 # 全局 setup
```

## 5. 单元测试用例大纲

### 5.1 工具函数 (`src/lib/`)

| 文件 | 测试场景 | 预期 |
|------|---------|------|
| `utils.ts` | 分页参数计算 | 正确计算 offset/limit/totalPages |
| `utils.ts` | slug 生成 | 中文转拼音/特殊字符处理/重复后缀 |
| `utils.ts` | 日期格式化 | 相对时间/绝对时间/时区处理 |
| `validations.ts` | 邮箱格式校验 | 合法/非法邮箱边界 |
| `validations.ts` | 密码强度校验 | 长度/字符组合边界 |
| `validations.ts` | URL 格式校验 | 合法 URL/IPv6/特殊协议 |

### 5.2 UI 组件 (`src/components/`)

| 组件 | 测试场景 |
|------|---------|
| `PostCard` | 渲染不同状态文章/空标题/超长标题/无封面图 |
| `CommentTree` | 嵌套渲染/空评论/深层嵌套/加载状态 |
| `LoginForm` | 表单校验/提交状态/错误提示/禁用状态 |
| `Editor` | 空内容渲染/Markdown 预览/快捷键/图片上传/草稿保存 |

## 6. 集成测试用例大纲

### 6.1 认证 API
- 注册成功 (201) / 重复邮箱 (409) / 弱密码 (422) / XSS (422)
- 登录成功 (200+JWT) / 错误密码 (401) / 不存在用户 (401)
- Token 刷新 (200) / 过期 Token (401) / 伪造 Token (401)
- 登出 (200) / 登出后 Token 无效

### 6.2 文章 API
- 列表分页/搜索/筛选/排序/空结果
- 草稿权限（作者可见/他人 404）
- CRUD 权限（作者可改/非作者 403）
- 输入校验（空标题 422/超长标题 422/注入转义）

### 6.3 评论 API
- 发表（认证 201/未认证 401/空内容 422/超长 422）
- 嵌套回复（有效 parentId/无效 parentId 404）
- 删除（作者 204/非作者 403/管理员可删）

### 6.4 管理 API
- 普通用户访问 403 / 管理员正常操作
- 用户管理/文章管理/评论审核

## 7. E2E 测试场景

1. **注册→登录→登出**：完整认证流程
2. **创建→编辑→发布→删除文章**：文章全生命周期
3. **评论→回复→删除**：评论交互流程
4. **搜索→筛选→分页**：内容发现流程

## 8. 边界条件

| 类别 | 场景 |
|------|------|
| 空值 | 空请求体/空字段/null/undefined |
| 超长输入 | 标题 200+/内容 100000+/用户名 50+ |
| 特殊字符 | SQL 注入/XSS/Unicode/emoji/控制字符 |
| 并发 | 同时注册相同邮箱/同时创建文章 |
| 权限 | Token 过期/伪造/越权/未授权访问 |

## 9. 覆盖率目标

| 模块 | 行覆盖率 | 分支覆盖率 | 函数覆盖率 |
|------|---------|-----------|-----------|
| 工具函数 | > 90% | > 85% | 100% |
| 认证服务 | > 90% | > 85% | 100% |
| 文章服务 | > 85% | > 80% | 100% |
| 评论服务 | > 85% | > 80% | 100% |
| UI 组件 | > 80% | > 75% | > 90% |
| 全局 | > 80% | > 75% | > 90% |
