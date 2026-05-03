import { test, expect } from '@playwright/test';

test.describe('用户认证流程', () => {
  test('应成功注册新用户', async ({ page }) => {
    await page.goto('/register');
    await page.fill('#register-name', '测试用户');
    const email = 'e2e-test-' + Date.now() + '@example.com';
    await page.fill('#register-email', email);
    await page.fill('#register-password', 'TestPass123!');
    await page.click('button[type="submit"]');
    await expect(page).toHaveURL(/.*dashboard/, { timeout: 10000 });
  });

  test('应使用有效凭据登录', async ({ page }) => {
    await page.goto('/login');
    await page.fill('#login-email', 'e2e-test@example.com');
    await page.fill('#login-password', 'TestPass123!');
    await page.click('button[type="submit"]');
    await expect(page).toHaveURL(/.*dashboard/);
  });

  test('应显示错误密码提示', async ({ page }) => {
    await page.goto('/login');
    await page.fill('#login-email', 'e2e-test@example.com');
    await page.fill('#login-password', 'wrongpassword');
    await page.click('button[type="submit"]');
    await expect(page.locator('text=邮箱或密码错误')).toBeVisible();
  });

  test('应成功登出', async ({ page }) => {
    await page.goto('/login');
    await page.fill('#login-email', 'e2e-test@example.com');
    await page.fill('#login-password', 'TestPass123!');
    await page.click('button[type="submit"]');
    // 通过 NextAuth signout 页面登出
    await page.goto('/api/auth/signout');
    await page.waitForSelector('button[type="submit"]');
    await page.click('button[type="submit"]');
    await expect(page).toHaveURL(/.*login/);
  });

  test('未认证用户应被重定向到登录页', async ({ page }) => {
    await page.goto('/dashboard');
    await expect(page).toHaveURL(/.*login/);
  });
});
