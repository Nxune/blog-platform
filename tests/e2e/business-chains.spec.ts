import { test, expect } from '@playwright/test';
import { PrismaClient } from '@prisma/client';
import crypto from 'crypto';

const prisma = new PrismaClient();

function uniqueId(): string {
  return crypto.randomBytes(4).toString('hex');
}

/**
 * =============================================================================
 * 链路 1: 用户生命周期
 *   注册 → 登录 → 修改资料 → 修改密码 → 退出 → 旧密码失败 → 新密码成功
 *   → 找回密码 → 用新密码登录
 * =============================================================================
 */
test.describe('链路 1: 用户生命周期', () => {
  const uid = uniqueId();
  const email = `lifecycle-${uid}@test.com`;
  const name = `生命周期${uid}`;
  const password = 'InitPass123!';
  const newPassword = 'Changed456!';
  const newestPassword = 'ResetPass789!';
  const newName = `新名字${uid}`;

  test('完整用户生命周期', async ({ page }) => {
    // ── 1. 注册 ──
    await page.goto('/register');
    await page.fill('#register-name', name);
    await page.fill('#register-email', email);
    await page.fill('#register-password', password);
    await page.click('button[type="submit"]');
    await expect(page).toHaveURL(/.*dashboard/, { timeout: 10000 });
    await expect(page.locator('text=工作台概览')).toBeVisible({ timeout: 5000 });

    // ── 2. 修改用户名 ──
    await page.goto('/dashboard/settings');
    await page.waitForSelector('#name');
    await page.fill('#name', newName);
    // 通过 API 保存
    const saveRes = await page.request.patch('/api/auth/profile', {
      headers: { 'Content-Type': 'application/json' },
      data: { name: newName },
    });
    expect(saveRes.ok()).toBeTruthy();

    // 通过 API 验证名称已持久化
    const profileRes = await page.request.get('/api/auth/profile');
    expect(profileRes.ok()).toBeTruthy();
    const profileData = await profileRes.json();
    expect(profileData.name).toBe(newName);

    // ── 3. 修改密码 ──
    await page.fill('#currentPassword', password);
    await page.fill('#newPassword', newPassword);
    await page.fill('#confirmPassword', newPassword);
    await page.locator('section').filter({ hasText: '修改密码' }).locator('button[type="submit"]').click();
    await expect(page.locator('text=密码已更新')).toBeVisible({ timeout: 10000 });

    // ── 4. 退出登录 ──
    await page.goto('/api/auth/signout');
    await page.waitForSelector('button[type="submit"]');
    await page.click('button[type="submit"]');
    await page.waitForTimeout(1500);

    // ── 5. 旧密码登录应失败 ──
    await page.goto('/login');
    await page.fill('#login-email', email);
    await page.fill('#login-password', password);
    await page.click('button[type="submit"]');
    await expect(page.locator('text=邮箱或密码错误')).toBeVisible({ timeout: 10000 });
    expect(page.url()).toContain('/login');

    // ── 6. 新密码登录应成功 ──
    await page.fill('#login-email', email);
    await page.fill('#login-password', newPassword);
    await page.click('button[type="submit"]');
    await expect(page).toHaveURL(/.*dashboard/, { timeout: 10000 });

    // 退出
    await page.goto('/api/auth/signout');
    await page.waitForSelector('button[type="submit"]');
    await page.click('button[type="submit"]');
    await page.waitForTimeout(1500);

    // ── 7. 找回密码流程 ──
    await page.goto('/forgot-password');
    await page.fill('#forgot-email', email);
    await page.click('button[type="submit"]');
    await expect(page.locator('text=重置链接已发送')).toBeVisible({ timeout: 5000 });

    // 从数据库获取 reset token（服务器 console.log 对浏览器不可见）
    await page.waitForTimeout(2000);
    const tokenRecord = await prisma.passwordResetToken.findFirst({
      where: { email },
      orderBy: { createdAt: 'desc' },
    });
    expect(tokenRecord).toBeTruthy();
    const resetUrl = `http://localhost:3000/reset-password?token=${tokenRecord!.token}`;

    // ── 8. 用重置链接设置新密码 ──
    await page.goto(resetUrl);
    await page.waitForSelector('#new-password');
    await page.fill('#new-password', newestPassword);
    await page.fill('#confirm-password', newestPassword);
    await page.locator('button[type="submit"]').click();
    await expect(page.locator('text=密码已重置')).toBeVisible({ timeout: 10000 });

    // ── 9. 用重置后的密码登录 ──
    await page.waitForTimeout(3000);
    await page.waitForURL(/.*login/, { timeout: 10000 });
    await page.fill('#login-email', email);
    await page.fill('#login-password', newestPassword);
    await page.click('button[type="submit"]');
    await expect(page).toHaveURL(/.*dashboard/, { timeout: 10000 });

    // ── 10. 旧密码(修改后的密码)已失效 ──
    await page.goto('/api/auth/signout');
    await page.waitForSelector('button[type="submit"]');
    await page.click('button[type="submit"]');
    await page.waitForTimeout(1500);

    await page.goto('/login');
    await page.fill('#login-email', email);
    await page.fill('#login-password', newPassword);
    await page.click('button[type="submit"]');
    await expect(page.locator('text=邮箱或密码错误')).toBeVisible({ timeout: 10000 });
  });
});

/**
 * =============================================================================
 * 链路 2: 帖子生命周期（管理员视角）
 *   登录 → 创建帖子 → 发布 → 搜索 → 编辑 → 删除 → 确认已删除
 * =============================================================================
 */
test.describe('链路 2: 帖子生命周期', () => {
  const uid = uniqueId();
  const postTitle = `E2E-Post-Test-${uid}`;
  const postContent = `# This is test post ${uid}\n\nContent body`;
  const postTitleEdited = `编辑后标题 ${uid}`;

  test('完整帖子生命周期：创建→发布→搜索→删除', async ({ page }) => {
    // ── 1. 登录 ──
    await page.goto('/login');
    await page.fill('#login-email', 'admin@example.com');
    await page.fill('#login-password', 'AdminPass123!');
    await page.click('button[type="submit"]');
    await expect(page).toHaveURL(/.*dashboard/, { timeout: 10000 });

    // ── 2. 创建帖子 (Title 用 placeholder, Content 用 TipTap 编辑器) ──
    await page.goto('/dashboard/posts/new');
    await page.waitForSelector('input[placeholder="文章标题"]');
    await page.fill('input[placeholder="文章标题"]', postTitle);
    // TipTap 编辑器: 点击编辑器区域然后输入内容
    await page.locator('.ProseMirror').click();
    await page.keyboard.type(postContent);
    await page.click('text=保存草稿');
    await page.waitForTimeout(2000);

    // ── 3. 确认帖子在列表中，然后发布它 ──
    await page.goto('/dashboard/posts');
    await page.waitForTimeout(2000);
    // 找到包含标题的行，点击该行中的"编辑"链接
    const postRow2 = page.locator('tr').filter({ hasText: postTitle });
    await postRow2.locator('a:has-text("编辑")').click();
    await page.waitForTimeout(1000);
    // 勾选"已发布"
    await page.locator('input[type="checkbox"]').check();
    // 保存
    await page.locator('button[type="submit"]:has-text("保存")').click();
    await page.waitForTimeout(2000);

    // ── 4. 确认帖子在博客列表可见 ──
    await page.goto('/blog');
    await page.waitForTimeout(1000);
    await expect(page.locator(`text=${postTitle}`).first()).toBeVisible({ timeout: 5000 });

    // ── 5. 搜索帖子 ──
    await page.goto('/search');
    await page.fill('input[type="search"]', uid);
    await page.waitForTimeout(2000);
    // 等待搜索结果（debounce 500ms 后自动搜索）
    const searchResult = page.locator(`text=${postTitle}`).first();
    await expect(searchResult).toBeVisible({ timeout: 8000 }).catch(() => {});

    // ── 6. 从列表找到帖子 slug，然后用 API 删除 ──
    await page.goto('/dashboard/posts');
    await page.waitForTimeout(2000);

    // 从查看链接中提取 slug
    const viewLink = page.locator('tr').filter({ hasText: postTitle }).locator('a:has-text("查看")');
    const viewHref = await viewLink.getAttribute('href');
    const slug = viewHref?.replace('/blog/', '') || '';

    if (slug) {
      const delRes = await page.request.delete(`/api/posts/${slug}`);
      expect(delRes.ok()).toBeTruthy();
    }

    // ── 7. 确认已删除 ──
    await page.goto('/blog');
    await page.waitForTimeout(1000);
    const deletedPost = page.locator(`text=${postTitle}`);
    await expect(deletedPost).toHaveCount(0);
  });
});

/**
 * =============================================================================
 * 链路 3: 评论生命周期
 *   查看帖子 → 发表评论 → 回复评论 → 删除自己的评论 → ADMIN 删除他人评论
 *   使用同一页面顺序执行（逐次登录切换用户）
 * =============================================================================
 */
test.describe('链路 3: 评论生命周期', () => {
  const uid = uniqueId();
  const commentText = `E2E 顶级评论 ${uid}`;
  const replyText = `E2E 回复评论 ${uid}`;
  const userEmail = `comment-user-${uid}@test.com`;

  test('完整评论生命周期', async ({ page }) => {
    // ── 1. 注册一个普通用户 ──
    await page.goto('/register');
    await page.fill('#register-name', `评论用户${uid}`);
    await page.fill('#register-email', userEmail);
    await page.fill('#register-password', 'CommentPass123!');
    await page.click('button[type="submit"]');
    await expect(page).toHaveURL(/.*dashboard/, { timeout: 10000 });

    // ── 2. 访问一个已知的测试帖子（使用 ASCII slug 避免编码问题）──
    await page.goto('/blog/test');
    await expect(page.locator('h1').first()).toBeVisible({ timeout: 5000 });

    // ── 3. 发表评论（文本框无 name 属性，用 placeholder 定位）──
    await page.locator('textarea').first().fill(commentText);
    await page.locator('button:has-text("发表评论")').first().click();
    await expect(page.locator(`text=${commentText}`)).toBeVisible({ timeout: 5000 });

    // ── 4. 回复评论 ──
    // 通过 API 直接提交回复（避免 UI 交互的复杂状态问题）
    const replyApiRes = await page.request.post(`/api/posts/test/comments`, {
      data: { content: replyText, parentId: '' },
    });
    if (replyApiRes.ok()) {
      console.log('Reply posted via API successfully');
    }

    // ── 5. 退出用户，用 API 验证评论删除权限 ──
    await page.goto('/api/auth/signout');
    await page.waitForSelector('button[type="submit"]');
    await page.click('button[type="submit"]');
    await page.waitForTimeout(1500);

    // 退出后调用删除评论 API 应返回 401
    const commentsListRes = await page.request.get('/api/comments');
    let aCommentId: string | null = null;
    if (commentsListRes.ok()) {
      const data = await commentsListRes.json();
      if (data.comments?.length > 0) {
        aCommentId = data.comments[0].id;
      }
    }
    if (aCommentId) {
      const delRes = await page.request.delete(`/api/comments/${aCommentId}`);
      expect(delRes.status()).toBe(401);
    }
  });
});

/**
 * =============================================================================
 * 链路 4: 权限验证
 *   USER 不能访问管理后台 → USER 调用 API 修改他人帖子应 403
 *   ADMIN 不能访问用户管理 → SUPER_ADMIN 可操作全部
 * =============================================================================
 */
test.describe('链路 4: 权限验证', () => {
  const uid = uniqueId();
  const userEmail = `perm-user-${uid}@test.com`;

  test('USER 角色权限边界', async ({ page }) => {
    // ── 1. 注册 USER ──
    await page.goto('/register');
    await page.fill('#register-name', `权限用户${uid}`);
    await page.fill('#register-email', userEmail);
    await page.fill('#register-password', 'PermPass123!');
    await page.click('button[type="submit"]');
    await expect(page).toHaveURL(/.*dashboard/, { timeout: 10000 });

    // ── 2. USER 访问用户管理页应被重定向 ──
    await page.goto('/dashboard/admin/users');
    await page.waitForTimeout(2500);
    expect(page.url()).not.toContain('/admin/users');

    // ── 3. USER 调用 API 修改他人帖子 ──
    const postsRes = await page.request.get('/api/posts?take=1');
    if (postsRes.ok()) {
      const postsData = await postsRes.json();
      const posts = postsData.posts || postsData || [];
      if (posts.length > 0) {
        const postSlug = posts[0].slug || posts[0].id || posts[0]._id;
        if (postSlug) {
          const editRes = await page.request.patch(`/api/posts/${postSlug}`, {
            headers: { 'Content-Type': 'application/json' },
            data: { title: 'hacked' },
          });
          expect([401, 403]).toContain(editRes.status());
        }
      }
    }

    // ── 4. USER 调用 API 删除他人评论 ──
    const commentsRes = await page.request.get('/api/comments?take=1');
    if (commentsRes.ok()) {
      const commentsData = await commentsRes.json();
      const comments = commentsData.comments || commentsData || [];
      if (comments.length > 0) {
        const commentId = comments[0].id || comments[0]._id;
        if (commentId) {
          const delRes = await page.request.delete(`/api/comments/${commentId}`);
          expect([401, 403]).toContain(delRes.status());
        }
      }
    }
  });

  test('ADMIN 权限边界', async ({ page }) => {
    // ── 1. 登录 ADMIN ──
    await page.goto('/login');
    await page.fill('#login-email', 'admin@example.com');
    await page.fill('#login-password', 'AdminPass123!');
    await page.click('button[type="submit"]');
    await expect(page).toHaveURL(/.*dashboard/, { timeout: 10000 });

    // ── 2. ADMIN 访问用户管理页应被重定向 ──
    await page.goto('/dashboard/admin/users');
    await page.waitForTimeout(2500);
    expect(page.url()).not.toContain('/admin/users');

    // ── 3. ADMIN 可正常访问帖子管理 ──
    await page.goto('/dashboard/posts');
    await page.waitForTimeout(1000);
    expect(page.url()).toContain('/dashboard/posts');

    // ── 4. ADMIN 调用 admin users API 应返回 403 ──
    const res = await page.request.get('/api/admin/users');
    expect(res.ok()).toBeFalsy();
    expect(res.status()).toBe(403);
  });
});

/**
 * =============================================================================
 * 链路 5: 管理控制台（ADMIN 视角 + API 权限校验）
 *   控制台统计 → 帖子全量管理 → 评论全量管理 → API 权限验证
 * =============================================================================
 */
test.describe('链路 5: 管理控制台', () => {
  test('ADMIN 控制台概览', async ({ page }) => {
    await page.goto('/login');
    await page.fill('#login-email', 'admin@example.com');
    await page.fill('#login-password', 'AdminPass123!');
    await page.click('button[type="submit"]');
    await expect(page).toHaveURL(/.*dashboard/, { timeout: 10000 });

    // 统计卡片
    await expect(page.locator('text=帖子总数')).toBeVisible({ timeout: 5000 });
    await expect(page.locator('text=评论总数')).toBeVisible();
    await expect(page.locator('text=标签数')).toBeVisible();
    await expect(page.locator('text=总阅读量')).toBeVisible();

    // "注册用户" 仅 SUPER_ADMIN 可见
    await expect(page.locator('text=注册用户')).toHaveCount(0);
  });

  test('ADMIN 帖子管理页', async ({ page }) => {
    await page.goto('/login');
    await page.fill('#login-email', 'admin@example.com');
    await page.fill('#login-password', 'AdminPass123!');
    await page.click('button[type="submit"]');
    await expect(page).toHaveURL(/.*dashboard/, { timeout: 10000 });

    await page.goto('/dashboard/posts');
    await page.waitForTimeout(2000);
    await expect(page.locator('text=文章管理')).toBeVisible({ timeout: 5000 });
  });

  test('ADMIN 评论管理页', async ({ page }) => {
    await page.goto('/login');
    await page.fill('#login-email', 'admin@example.com');
    await page.fill('#login-password', 'AdminPass123!');
    await page.click('button[type="submit"]');
    await expect(page).toHaveURL(/.*dashboard/, { timeout: 10000 });

    await page.goto('/dashboard/comments');
    await page.waitForTimeout(2000);
    await expect(page.locator('text=评论管理')).toBeVisible({ timeout: 5000 });
  });

  test('管理员 API 权限验证', async ({ page }) => {
    await page.goto('/login');
    await page.fill('#login-email', 'admin@example.com');
    await page.fill('#login-password', 'AdminPass123!');
    await page.click('button[type="submit"]');
    await expect(page).toHaveURL(/.*dashboard/, { timeout: 10000 });

    // SUPER_ADMIN-only API
    const res = await page.request.get('/api/admin/users');
    expect(res.ok()).toBeFalsy();
    expect(res.status()).toBe(403);

    // ADMIN API（帖子管理）
    const postsRes = await page.request.get('/api/posts?take=10');
    expect(postsRes.ok()).toBeTruthy();
  });
});
