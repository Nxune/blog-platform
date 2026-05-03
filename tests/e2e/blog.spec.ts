import { test, expect } from '@playwright/test';

test.describe('文章生命周期', () => {
  test('应创建、编辑、发布、删除文章', async ({ page }) => {
    // 1. 登录
    await page.goto('/login');
    await page.fill('[name="email"]', 'admin@example.com');
    await page.fill('[name="password"]', 'AdminPass123!');
    await page.click('button[type="submit"]');
    await expect(page).toHaveURL(/.*dashboard/);

    // 2. 进入管理后台 -> 新建文章
    await page.goto('/dashboard/posts/new');
    await page.fill('[name="title"]', 'E2E 测试文章');
    await page.fill('[name="content"]', '# 这是 E2E 测试内容');
    await page.click('text=保存草稿');

    // 3. 验证草稿已保存
    await expect(page.locator('text=E2E 测试文章')).toBeVisible();
    await expect(page.locator('text=草稿')).toBeVisible();

    // 4. 发布文章
    await page.click('text=发布');
    await expect(page.locator('text=已发布')).toBeVisible();

    // 5. 验证前台展示
    await page.goto('/blog');
    await expect(page.locator('text=E2E 测试文章')).toBeVisible();

    // 6. 删除文章
    await page.goto('/dashboard/posts');
    await page.click('text=删除');
    await page.click('text=确认删除');
    await expect(page.locator('text=E2E 测试文章')).not.toBeVisible();
  });
});
