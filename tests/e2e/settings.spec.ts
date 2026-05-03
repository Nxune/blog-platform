import { test, expect } from '@playwright/test';
import crypto from 'crypto';

/**
 * 生成唯一标识用于测试用户，避免并发冲突
 */
function uniqueId(): string {
  return crypto.randomBytes(4).toString('hex');
}

/**
 * 注册新用户并通过设置页修改密码
 */
test.describe('密码修改流程', () => {
  const uid = uniqueId();
  const email = `pwchange-${uid}@test.com`;
  const name = `用户${uid}`;
  const oldPassword = 'OldPass123!';
  const newPassword = 'NewPass456!';

  test('应成功注册、修改密码、新密码登录、旧密码拒绝', async ({ page }) => {
    // ── 1. 注册 ──
    await page.goto('/register');
    await page.fill('#register-name', name);
    await page.fill('#register-email', email);
    await page.fill('#register-password', oldPassword);
    await page.click('button[type="submit"]');
    // 注册成功后应重定向到 dashboard
    await expect(page).toHaveURL(/.*dashboard/, { timeout: 10000 });

    // ── 2. 进入设置页修改密码 ──
    await page.goto('/dashboard/settings');
    await page.waitForSelector('#currentPassword');

    await page.fill('#currentPassword', oldPassword);
    await page.fill('#newPassword', newPassword);
    await page.fill('#confirmPassword', newPassword);

    // 找到密码修改区域的提交按钮
    await page.locator('form').filter({ hasText: '修改密码' }).locator('button[type="submit"]').click();

    // 验证成功消息
    await expect(page.locator('text=密码已更新')).toBeVisible({ timeout: 10000 });

    // ── 3. 退出登录 ──
    // NextAuth signout: POST to /api/auth/signout
    await page.goto('/api/auth/signout');
    await page.waitForSelector('button[type="submit"]');
    await page.click('button[type="submit"]');
    // 登出后应跳转到首页或登录页
    await page.waitForTimeout(1000);

    // ── 4. 用新密码登录 ──
    await page.goto('/login');
    await page.fill('#login-email', email);
    await page.fill('#login-password', newPassword);
    await page.click('button[type="submit"]');
    // 新密码应登录成功
    await expect(page).toHaveURL(/.*dashboard/, { timeout: 10000 });

    // ── 5. 再次退出 ──
    await page.goto('/api/auth/signout');
    await page.waitForSelector('button[type="submit"]');
    await page.click('button[type="submit"]');
    await page.waitForTimeout(1000);

    // ── 6. 用旧密码登录 ──
    await page.goto('/login');
    await page.fill('#login-email', email);
    await page.fill('#login-password', oldPassword);
    await page.click('button[type="submit"]');
    // 旧密码应登录失败，显示错误提示
    await expect(page.locator('text=邮箱或密码错误')).toBeVisible({ timeout: 10000 });
    // 确认仍在登录页
    expect(page.url()).toContain('/login');
  });
});

/**
 * 修改用户名和邮箱后验证 UI 即时刷新
 */
test.describe('会话刷新验证', () => {
  const uid = uniqueId();
  const email = `session-${uid}@test.com`;
  const name = `初始名${uid}`;
  const password = 'TestPass123!';
  const newName = `新名字${uid}`;
  const newEmail = `session-new-${uid}@test.com`;

  test('修改用户名后 Header 即时更新', async ({ page }) => {
    // ── 注册 ──
    await page.goto('/register');
    await page.fill('#register-name', name);
    await page.fill('#register-email', email);
    await page.fill('#register-password', password);
    await page.click('button[type="submit"]');
    await expect(page).toHaveURL(/.*dashboard/, { timeout: 10000 });

    // ── 到首页检查 Header 显示当前用户名 ──
    await page.goto('/');
    await expect(page.locator(`text=${name}`)).toBeVisible({ timeout: 5000 });

    // ── 进入设置页修改用户名 ──
    await page.goto('/dashboard/settings');
    await page.waitForSelector('#name');
    await page.fill('#name', newName);
    // 点击用户名区域的保存按钮
    await page.locator('section').filter({ hasText: '用户名' }).locator('button:has-text("保存")').click();

    // 等待成功消息
    await expect(page.locator('text=用户名已更新')).toBeVisible({ timeout: 10000 });

    // ── 到首页检查 Header 已显示新用户名 ──
    await page.goto('/');
    await expect(page.locator(`text=${newName}`)).toBeVisible({ timeout: 5000 });
    // 确认旧用户名不再出现
    await expect(page.locator(`text=${name}`)).toHaveCount(0);
  });

  test('修改邮箱后设置页显示新邮箱', async ({ page }) => {
    // ── 注册 ──
    await page.goto('/register');
    await page.fill('#register-name', name);
    await page.fill('#register-email', email);
    await page.fill('#register-password', password);
    await page.click('button[type="submit"]');
    await expect(page).toHaveURL(/.*dashboard/, { timeout: 10000 });

    // ── 进入设置页，确认当前邮箱显示 ──
    await page.goto('/dashboard/settings');
    await expect(page.locator(`text=当前邮箱：${email}`)).toBeVisible({ timeout: 5000 });

    // ── 修改邮箱 ──
    await page.fill('#newEmail', newEmail);
    await page.fill('#emailPassword', password);
    // 点击邮箱修改区域的提交按钮
    await page.locator('form').filter({ hasText: '修改邮箱' }).locator('button[type="submit"]').click();

    // 等待成功消息
    await expect(page.locator('text=邮箱已更新')).toBeVisible({ timeout: 10000 });

    // ── 刷新设置页，确认新邮箱显示 ──
    await page.goto('/dashboard/settings');
    await expect(page.locator(`text=当前邮箱：${newEmail}`)).toBeVisible({ timeout: 5000 });
    // 确认旧邮箱不再出现
    await expect(page.locator(`text=当前邮箱：${email}`)).toHaveCount(0);
  });
});

/**
 * 找回密码流程（需要 Coder-2 完成后端支持）
 */
test.describe('找回密码流程', () => {
  const uid = uniqueId();
  const email = `reset-${uid}@test.com`;
  const name = `重置用户${uid}`;
  const password = 'OldPassword1!';
  const newPassword = 'NewPassword2!';

  test('应完成忘记密码 -> 重置密码 -> 新密码登录全流程', async ({ page }) => {
    // ── 1. 先注册一个用户 ──
    await page.goto('/register');
    await page.fill('#register-name', name);
    await page.fill('#register-email', email);
    await page.fill('#register-password', password);
    await page.click('button[type="submit"]');
    await expect(page).toHaveURL(/.*dashboard/, { timeout: 10000 });

    // 退出
    await page.goto('/api/auth/signout');
    await page.waitForSelector('button[type="submit"]');
    await page.click('button[type="submit"]');
    await page.waitForTimeout(1000);

    // ── 2. 忘记密码页面 —— 捕获控制台中的重置链接 ──
    let resetUrl = '';

    page.on('console', async (msg) => {
      const text = msg.text();
      // API 路由通过 console.log 输出重置 URL
      if (text.includes('/reset-password?token=')) {
        const match = text.match(/(http[^\s]+reset-password\?token=[^\s]+)/);
        if (match) resetUrl = match[1];
      }
    });

    await page.goto('/forgot-password');
    await page.fill('#forgot-email', email);
    await page.click('button[type="submit"]');

    // 验证发送成功提示
    await expect(page.locator('text=重置链接已发送')).toBeVisible({ timeout: 5000 });

    // ── 3. 从控制台获取 token 后访问重置密码页面 ──
    // 等待 console 日志被捕获
    await page.waitForTimeout(2000);
    expect(resetUrl).toBeTruthy();

    await page.goto(resetUrl);
    await page.waitForSelector('#new-password');

    // ── 4. 设置新密码 ──
    await page.fill('#new-password', newPassword);
    await page.fill('#confirm-password', newPassword);
    await page.locator('button[type="submit"]').click();

    // 等待成功消息和跳转
    await expect(page.locator('text=密码已重置')).toBeVisible({ timeout: 10000 });

    // ── 5. 用新密码登录 ──
    await page.waitForTimeout(3000); // 页面会延迟 3 秒后跳转
    await page.waitForURL(/.*login/, { timeout: 10000 });

    await page.fill('#login-email', email);
    await page.fill('#login-password', newPassword);
    await page.click('button[type="submit"]');
    await expect(page).toHaveURL(/.*dashboard/, { timeout: 10000 });

    // ── 6. 确认旧密码已失效 ──
    await page.goto('/api/auth/signout');
    await page.waitForSelector('button[type="submit"]');
    await page.click('button[type="submit"]');
    await page.waitForTimeout(1000);

    await page.goto('/login');
    await page.fill('#login-email', email);
    await page.fill('#login-password', password);
    await page.click('button[type="submit"]');
    await expect(page.locator('text=邮箱或密码错误')).toBeVisible({ timeout: 10000 });
  });

  test('无效令牌应显示错误提示', async ({ page }) => {
    await page.goto('/reset-password?token=invalid-token-123');
    await page.waitForSelector('#new-password');

    await page.fill('#new-password', 'NewPass123!');
    await page.fill('#confirm-password', 'NewPass123!');
    await page.locator('button[type="submit"]').click();

    await expect(page.locator('text=重置令牌无效')).toBeVisible({ timeout: 10000 });
  });

  test('重置令牌缺失应显示提示', async ({ page }) => {
    await page.goto('/reset-password');
    await expect(page.locator('text=无效链接')).toBeVisible({ timeout: 5000 });
  });

  test('不存在的邮箱请求重置应返回成功提示（防止枚举）', async ({ page }) => {
    await page.goto('/forgot-password');
    await page.fill('#forgot-email', 'nonexistent-' + uid + '@test.com');
    await page.click('button[type="submit"]');
    // 无论邮箱是否存在，都返回成功提示
    await expect(page.locator('text=重置链接已发送')).toBeVisible({ timeout: 5000 });
  });
});
