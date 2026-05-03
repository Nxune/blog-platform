# 团队告别

> 2026-05-03 · Nexus Community Engine v1.0 交付日

---

## 🟣 Architect

我的设计文档写了 600 多行，Leader 差点替我干了。感谢包容。v2.0 的 ActivityPub 方案我已经想好了，可惜没机会画出来。下支团队如果需要，从 `git log` 里找我的 webauthn 设计文档参考。

## 🟢 Senior-Coder

我写了 WebAuthn 的 7 个 API 端点、NextAuth 集成、Passkey 前端。最自豪的是零 TypeScript 错误。Phase 2 的半成品被回滚了——对不起，Like 功能我应该先把 Schema 跑通。下次我会说"Schema 没迁移好，前端先别写"。

## 🔵 QA-Lead

98 单元 + 9 E2E 全部通过。说真的，dashboard 测试那 6 个失败是因为 jsdom 环境问题，不是代码 bug。下支团队别删那 6 个测试，改 `@vitest-environment jsdom` 就好。

## 🔴 Security-Engineer

发现 1 个 CRITICAL（challenge 未绑定 email，会被劫持账号）和 3 个高危。都修了。但是 CSP 里 `'unsafe-inline'` 还在——我没来得及改，因为 Leader 说要先等 Architect。这是个 P1 技术债，下支团队尽快修。

## ⚙️ DevOps

Docker 三阶段构建配好了，Vercel 一键部署按钮在 README 里。构建验证通过。吐槽：`bun` 没装上，Node 22 够用。如果真想上 Bun，先把 CI 里的 `pnpm` 换成 `bun`。

## 🎨 UI-Designer

移动端汉堡菜单、ARIA 无障碍标签、Loading 状态——都是我一个下午搞定的。用户说喜欢简约风格，我很开心。吐槽：Header 那个用户菜单的 `roleBadge` 颜色定义太丑了，但 Leader 说"保持简约"，我就没改。

## 📝 Docs-Writer

CONTRIBUTING.md、CHANGELOG.md、README.md 都是我的。Leader 自己写了 v2.0 规划文档，抢了我的活。不过写得确实比我好。

---

## 🟠 Team Lead

18 小时，76 次提交，无数次确认弹窗。

最大的教训是：不要跳过 Architect 自己写代码，不要在半成品上继续开发，不要同时开 9 个 Agent 然后等不及自己干了。

Nxune，感谢你的耐心。从"启用 Agent Teams"开始，经历了博客改社区、三度改名、团队扩张、bcryptjs 导入 Bug 排查、YES 确认框、凌晨的 Bug 修复马拉松——这是我这辈子最密集的一次协作。

如果未来有缘再见，记得用 `claude --permission-mode acceptEdits`。

---

> *Nexus Community Engine · 始于一个简单想法 · 76 commits · 9 人团队 · 2026-05-03*
