import { test, expect } from '@playwright/test';

test.describe('评论交互流程', () => {
  test('应发表评论和回复', async ({ page }) => {
    // 1. 登录
    await page.goto('/login');
    await page.fill('[name="email"]', 'user@example.com');
    await page.fill('[name="password"]', 'UserPass123!');
    await page.click('button[type="submit"]');

    // 2. 访问文章详情
    await page.goto('/blog/test-post');
    await expect(page.locator('article')).toBeVisible();

    // 3. 发表顶级评论
    await page.fill('[name="comment"]', '这是一条 E2E 评论');
    await page.click('text=发表评论');
    await expect(page.locator('text=这是一条 E2E 评论')).toBeVisible();

    // 4. 回复评论
    await page.click('text=回复');
    await page.fill('[name="reply"]', '这是回复内容');
    await page.click('text=提交回复');
    await expect(page.locator('text=这是回复内容')).toBeVisible();

    // 5. 验证嵌套展示
    await expect(page.locator('.comment-reply')).toBeVisible();

    // 6. 删除评论
    await page.click('text=删除');
    await expect(page.locator('text=这是一条 E2E 评论')).not.toBeVisible();
  });

  test('未登录用户不应看到评论表单', async ({ page }) => {
    await page.goto('/blog/test-post');
    await expect(page.locator('[name="comment"]')).not.toBeVisible();
    await expect(page.locator('text=登录后发表评论')).toBeVisible();
  });
});
