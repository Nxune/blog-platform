// @vitest-environment node
import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('@/lib/prisma', () => ({
  prisma: {
    post: { count: vi.fn() },
    comment: { count: vi.fn() },
    user: { count: vi.fn() },
    tag: { count: vi.fn() },
  },
}));

vi.mock('@/lib/auth-helpers', () => ({
  requireAdmin: vi.fn(),
}));

import { prisma } from '@/lib/prisma';
import { requireAdmin } from '@/lib/auth-helpers';

async function statsHandler() {
  const { GET } = await import('@/app/api/admin/stats/route');
  return GET;
}

describe('GET /api/admin/stats', () => {
  beforeEach(() => vi.clearAllMocks());

  it('应返回管理面板综合统计数据', async () => {
    vi.mocked(requireAdmin).mockResolvedValue({ user: { id: 'admin-1', role: 'ADMIN' } } as any);
    vi.mocked(prisma.post.count).mockResolvedValue(10);
    vi.mocked(prisma.comment.count).mockResolvedValue(25);
    vi.mocked(prisma.user.count).mockResolvedValue(5);
    vi.mocked(prisma.tag.count).mockResolvedValue(8);

    const handler = await statsHandler();
    const res = await handler();
    const data = await res.json();

    expect(res.status).toBe(200);
    expect(data).toEqual({
      posts: { total: 10, published: 10, draft: 10 },
      comments: { total: 25, pending: 25 },
      users: { total: 5 },
      tags: { total: 8 },
    });
  });

  it('应分别统计已发布和草稿文章', async () => {
    vi.mocked(requireAdmin).mockResolvedValue({ user: { id: 'admin-1', role: 'ADMIN' } } as any);
    vi.mocked(prisma.post.count)
      .mockResolvedValueOnce(20)  // total
      .mockResolvedValueOnce(15)  // published
      .mockResolvedValueOnce(5);  // draft

    const handler = await statsHandler();
    const data = await (await handler()).json();

    expect(data.posts.published).toBe(15);
    expect(data.posts.draft).toBe(5);
    expect(data.posts.total).toBe(20);
  });

  it('应统计待审核评论', async () => {
    vi.mocked(requireAdmin).mockResolvedValue({ user: { id: 'admin-1', role: 'ADMIN' } } as any);
    vi.mocked(prisma.post.count).mockResolvedValue(0);
    vi.mocked(prisma.comment.count)
      .mockResolvedValueOnce(30)  // total
      .mockResolvedValueOnce(3);  // pending
    vi.mocked(prisma.user.count).mockResolvedValue(0);
    vi.mocked(prisma.tag.count).mockResolvedValue(0);

    const handler = await statsHandler();
    const data = await (await handler()).json();

    expect(data.comments.total).toBe(30);
    expect(data.comments.pending).toBe(3);
  });

  it('应拒绝非管理员并返回 403', async () => {
    vi.mocked(requireAdmin).mockRejectedValue(new Error('FORBIDDEN'));

    const handler = await statsHandler();
    const res = await handler();
    expect(res.status).toBe(403);
    const data = await res.json();
    expect(data.error).toBe('无权限');
  });

  it('空数据库应返回全零统计', async () => {
    vi.mocked(requireAdmin).mockResolvedValue({ user: { id: 'admin-1', role: 'ADMIN' } } as any);
    vi.mocked(prisma.post.count).mockResolvedValue(0);
    vi.mocked(prisma.comment.count).mockResolvedValue(0);
    vi.mocked(prisma.user.count).mockResolvedValue(0);
    vi.mocked(prisma.tag.count).mockResolvedValue(0);

    const handler = await statsHandler();
    const data = await (await handler()).json();

    expect(data).toEqual({
      posts: { total: 0, published: 0, draft: 0 },
      comments: { total: 0, pending: 0 },
      users: { total: 0 },
      tags: { total: 0 },
    });
  });

  it('应使用 Promise.all 并发查询', async () => {
    vi.mocked(requireAdmin).mockResolvedValue({ user: { id: 'admin-1', role: 'ADMIN' } } as any);
    const count = vi.mocked(prisma.post.count);
    count.mockResolvedValue(0);

    const handler = await statsHandler();
    await handler();

    // All 7 count queries should be called
    expect(prisma.post.count).toHaveBeenCalledTimes(3);
    expect(prisma.comment.count).toHaveBeenCalledTimes(2);
    expect(prisma.user.count).toHaveBeenCalledTimes(1);
    expect(prisma.tag.count).toHaveBeenCalledTimes(1);
  });

  it('应正确查询已发布和草稿文章计数', async () => {
    vi.mocked(requireAdmin).mockResolvedValue({ user: { id: 'admin-1', role: 'ADMIN' } } as any);
    vi.mocked(prisma.post.count)
      .mockResolvedValueOnce(10)
      .mockResolvedValueOnce(7)
      .mockResolvedValueOnce(3);
    vi.mocked(prisma.comment.count).mockResolvedValue(0);
    vi.mocked(prisma.user.count).mockResolvedValue(0);
    vi.mocked(prisma.tag.count).mockResolvedValue(0);

    const handler = await statsHandler();
    const data = await (await handler()).json();

    expect(prisma.post.count).toHaveBeenNthCalledWith(2, { where: { published: true } });
    expect(prisma.post.count).toHaveBeenNthCalledWith(3, { where: { published: false } });
    expect(data.posts.published).toBe(7);
    expect(data.posts.draft).toBe(3);
  });

  it('应正确统计待审核评论', async () => {
    vi.mocked(requireAdmin).mockResolvedValue({ user: { id: 'admin-1', role: 'ADMIN' } } as any);
    vi.mocked(prisma.post.count).mockResolvedValue(0);
    vi.mocked(prisma.comment.count)
      .mockResolvedValueOnce(50)
      .mockResolvedValueOnce(12);
    vi.mocked(prisma.user.count).mockResolvedValue(0);
    vi.mocked(prisma.tag.count).mockResolvedValue(0);

    const handler = await statsHandler();
    const data = await (await handler()).json();

    expect(prisma.comment.count).toHaveBeenCalledWith({ where: { status: 'PENDING' } });
    expect(data.comments.pending).toBe(12);
  });
});
