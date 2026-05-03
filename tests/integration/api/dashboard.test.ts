// @vitest-environment node
import { describe, it, expect, vi, beforeEach } from 'vitest';

// Mock Next.js redirect
const NEXT_REDIRECT = 'NEXT_REDIRECT';
const mockRedirect = vi.fn(() => {
  throw new Error(NEXT_REDIRECT);
});

vi.mock('next/navigation', () => ({
  redirect: mockRedirect,
}));

vi.mock('@/lib/auth', () => ({
  auth: vi.fn(),
}));

vi.mock('@/lib/prisma', () => ({
  prisma: {
    post: {
      count: vi.fn(),
      findMany: vi.fn(),
      aggregate: vi.fn(),
    },
    comment: { count: vi.fn() },
    tag: { count: vi.fn() },
  },
}));

import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

async function renderDashboard() {
  const mod = await import('@/app/dashboard/page');
  return mod.default();
}

async function renderDashboardPosts() {
  const mod = await import('@/app/dashboard/posts/page');
  return mod.default();
}

const adminSession = {
  user: { id: 'admin-1', name: 'Admin', email: 'admin@test.com', role: 'ADMIN' },
  expires: new Date(Date.now() + 86400000).toISOString(),
};

const userSession = {
  user: { id: 'user-1', name: 'User', email: 'user@test.com', role: 'USER' },
  expires: new Date(Date.now() + 86400000).toISOString(),
};

// ──────────────────────────────────────────
// Dashboard 概览页 (/dashboard)
// ──────────────────────────────────────────
describe('Dashboard 概览页 (/dashboard)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockRedirect.mockImplementation(() => { throw new Error(NEXT_REDIRECT); });
  });

  it('管理员应能访问并渲染概览页', async () => {
    vi.mocked(auth).mockResolvedValue(adminSession as any);
    vi.mocked(prisma.post.count).mockResolvedValue(10);
    vi.mocked(prisma.comment.count).mockResolvedValue(25);
    vi.mocked(prisma.tag.count).mockResolvedValue(5);
    vi.mocked(prisma.post.aggregate).mockResolvedValue({
      _sum: { viewCount: 1000 },
    } as any);

    const element = await renderDashboard();
    expect(element).toBeTruthy();
  });

  it('普通用户应能访问并看到自己的统计', async () => {
    vi.mocked(auth).mockResolvedValue(userSession as any);
    vi.mocked(prisma.post.count).mockResolvedValue(3);
    vi.mocked(prisma.comment.count).mockResolvedValue(7);
    vi.mocked(prisma.tag.count).mockResolvedValue(5);
    vi.mocked(prisma.post.aggregate).mockResolvedValue({
      _sum: { viewCount: 150 },
    } as any);

    const element = await renderDashboard();
    expect(element).toBeTruthy();
    expect(mockRedirect).not.toHaveBeenCalled();
  });

  it('普通用户统计查询按 authorId 过滤', async () => {
    vi.mocked(auth).mockResolvedValue(userSession as any);
    vi.mocked(prisma.post.count).mockResolvedValue(3);
    vi.mocked(prisma.comment.count).mockResolvedValue(7);
    vi.mocked(prisma.tag.count).mockResolvedValue(5);
    vi.mocked(prisma.post.aggregate).mockResolvedValue({
      _sum: { viewCount: 150 },
    } as any);

    await renderDashboard();

    expect(prisma.post.count).toHaveBeenCalledWith(
      { where: { authorId: 'user-1' } }
    );
    expect(prisma.post.aggregate).toHaveBeenCalledWith(
      expect.objectContaining({ where: { authorId: 'user-1' } })
    );
  });

  it('管理员统计查询不按 authorId 过滤', async () => {
    vi.mocked(auth).mockResolvedValue(adminSession as any);
    vi.mocked(prisma.post.count).mockResolvedValue(10);
    vi.mocked(prisma.comment.count).mockResolvedValue(25);
    vi.mocked(prisma.tag.count).mockResolvedValue(5);
    vi.mocked(prisma.post.aggregate).mockResolvedValue({
      _sum: { viewCount: 1000 },
    } as any);

    await renderDashboard();

    expect(prisma.post.count).toHaveBeenCalledWith();  // no filter
    expect(prisma.post.aggregate).toHaveBeenCalledWith(
      { _sum: { viewCount: true } }
    );
  });

  it('未登录用户应被重定向到 /login', async () => {
    vi.mocked(auth).mockResolvedValue(null);

    await expect(renderDashboard()).rejects.toThrow(NEXT_REDIRECT);
    expect(mockRedirect).toHaveBeenCalledWith('/login');
  });
});

// ─────────────────────────────────────────────
// Dashboard 文章列表页 (/dashboard/posts)
// ─────────────────────────────────────────────
describe('Dashboard 文章列表页 (/dashboard/posts)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockRedirect.mockImplementation(() => { throw new Error(NEXT_REDIRECT); });
  });

  it('普通用户可访问且仅能看到自己的文章', async () => {
    vi.mocked(auth).mockResolvedValue(userSession as any);
    vi.mocked(prisma.post.findMany).mockResolvedValue([]);

    const element = await renderDashboardPosts();
    expect(element).toBeTruthy();

    expect(prisma.post.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { authorId: 'user-1' },
      })
    );
  });

  it('管理员可访问且能看到所有文章（无 authorId 过滤）', async () => {
    vi.mocked(auth).mockResolvedValue(adminSession as any);
    vi.mocked(prisma.post.findMany).mockResolvedValue([]);

    await renderDashboardPosts();

    const callArg = vi.mocked(prisma.post.findMany).mock.calls[0][0];
    expect(callArg?.where === undefined || !('authorId' in (callArg?.where ?? {}))).toBe(true);
  });

  it('未登录用户应被重定向到 /login', async () => {
    vi.mocked(auth).mockResolvedValue(null);

    await expect(renderDashboardPosts()).rejects.toThrow(NEXT_REDIRECT);
    expect(mockRedirect).toHaveBeenCalledWith('/login');
  });

  it('普通用户看到自己的文章数据', async () => {
    vi.mocked(auth).mockResolvedValue(userSession as any);
    const mockPosts = [{
      id: 'p1', title: '我的文章', slug: 'my-post', published: true,
      createdAt: new Date(), updatedAt: new Date(),
      author: { name: 'User', email: 'user@test.com' },
      _count: { comments: 3 },
    }];
    vi.mocked(prisma.post.findMany).mockResolvedValue(mockPosts as any);

    const element = await renderDashboardPosts();
    expect(element).toBeTruthy();

    expect(prisma.post.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { authorId: 'user-1' },
        orderBy: { updatedAt: 'desc' },
        take: 100,
      })
    );
  });

  it('管理员看到所有文章数据', async () => {
    vi.mocked(auth).mockResolvedValue(adminSession as any);
    const mockPosts = [
      {
        id: 'p1', title: '文章A', slug: 'post-a', published: true,
        createdAt: new Date(), updatedAt: new Date(),
        author: { name: 'User1', email: 'u1@test.com' },
        _count: { comments: 1 },
      },
      {
        id: 'p2', title: '文章B', slug: 'post-b', published: false,
        createdAt: new Date(), updatedAt: new Date(),
        author: { name: 'User2', email: 'u2@test.com' },
        _count: { comments: 0 },
      },
    ];
    vi.mocked(prisma.post.findMany).mockResolvedValue(mockPosts as any);

    await renderDashboardPosts();

    const callArg = vi.mocked(prisma.post.findMany).mock.calls[0][0];
    expect(callArg?.where === undefined || !('authorId' in (callArg?.where ?? {}))).toBe(true);
  });

  it('文章数为空时正确渲染空状态', async () => {
    vi.mocked(auth).mockResolvedValue(userSession as any);
    vi.mocked(prisma.post.findMany).mockResolvedValue([]);

    const element = await renderDashboardPosts();
    expect(element).toBeTruthy();
  });
});
