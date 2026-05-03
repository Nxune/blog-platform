import { test, expect } from '@playwright/test';

test.describe('搜索与浏览', () => {
  test('应通过关键词搜索文章', async ({ page }) => {
    await page.goto('/search');
    await page.fill('[name="q"]', 'React');
    await page.press('[name="q"]', 'Enter');
    await expect(page.locator('.search-results')).toBeVisible();
  });

  test('空搜索应显示提示', async ({ page }) => {
    await page.goto('/search');
    await page.fill('[name="q"]', '');
    await page.press('[name="q"]', 'Enter');
    await expect(page.locator('text=请输入搜索关键词')).toBeVisible();
  });

  test('无结果应显示空状态', async ({ page }) => {
    await page.goto('/search?q=xyznonexistent12345');
    await expect(page.locator('text=未找到相关文章')).toBeVisible();
  });

  test('应按标签筛选文章', async ({ page }) => {
    await page.goto('/tags/javascript');
    await expect(page.locator('.tag-posts')).toBeVisible();
  });

  test('应正确分页', async ({ page }) => {
    await page.goto('/blog?page=1');
    await expect(page.locator('.pagination')).toBeVisible();
    await page.click('text=2');
    await expect(page).toHaveURL(/.*page=2/);
  });
});
