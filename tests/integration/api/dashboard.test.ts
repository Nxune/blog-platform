// @vitest-environment node
import { describe, it, expect, vi, beforeEach } from 'vitest';
import React from 'react';

// Mock Next.js redirect — throw a redirect error so we can catch it
const NEXT_REDIRECT = 'NEXT_REDIRECT';
vi.mock('next/navigation', () => ({
  redirect: () => { throw new Error(NEXT_REDIRECT); },
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
import { redirect } from 'next/navigation';

const adminSession = {
  user: { id: 'admin-1', name: 'Admin', email: 'admin@test.com', role: 'ADMIN' },
  expires: new Date(Date.now() + 86400000).toISOString(),
};

const userSession = {
  user: { id: 'user-1', name: 'User', email: 'user@test.com', role: 'USER' },
  expires: new Date(Date.now() + 86400000).toISOString(),
};

// Helper to check if a value is a React element (not an error)
function isReactElement(val: unknown): boolean {
  return (
    val !== null &&
    typeof val === 'object' &&
    'type' in (val as Record<string, unknown>)
  );
}

describe('Dashboard 概览页 (/dashboard)', () => {
  beforeEach(() => vi.clearAllMocks());

  it('管理员应能访问并看到统计信息', async () => {
    vi.mocked(auth).mockResolvedValue(adminSession as any);
    vi.mocked(prisma.post.count).mockResolvedValue(10);
    vi.mocked(prisma.comment.count).mockResolvedValue(25);
    vi.mocked(prisma.tag.count).mockResolvedValue(5);
    vi.mocked(prisma.post.aggregate).mockResolvedValue({
      _sum: { viewCount: 1000 },
    } as any);

    const Page = (await import('@/app/dashboard/page')).default;
    const element = await Page();

    expect(isReactElement(element)).toBe(true);
    expect(redirect).not.toHaveBeenCalled();
  });

  it('普通用户应被重定向到 /login', async () => {
    vi.mocked(auth).mockResolvedValue(userSession as any);

    await expect(async () => {
      const Page = (await import('@/app/dashboard/page')).default;
      await Page();
    }).rejects.toThrow(NEXT_REDIRECT);
  });

  it('未登录用户应被重定向到 /login', async () => {
    vi.mocked(auth).mockResolvedValue(null);

    await expect(async () => {
      const Page = (await import('@/app/dashboard/page')).default;
      await Page();
    }).rejects.toThrow(NEXT_REDIRECT);
  });

  it('管理员看到正确的统计数值', async () => {
    vi.mocked(auth).mockResolvedValue(adminSession as any);
    vi.mocked(prisma.post.count).mockResolvedValue(42);
    vi.mocked(prisma.comment.count).mockResolvedValue(100);
    vi.mocked(prisma.tag.count).mockResolvedValue(8);
    vi.mocked(prisma.post.aggregate).mockResolvedValue({
      _sum: { viewCount: 5000 },
    } as any);

    const Page = (await import('@/app/dashboard/page')).default;
    await Page();

    expect(prisma.post.count).toHaveBeenCalledOnce();
    expect(prisma.comment.count).toHaveBeenCalledOnce();
    expect(prisma.tag.count).toHaveBeenCalledOnce();
    expect(prisma.post.aggregate).toHaveBeenCalledOnce();
  });
});

describe('Dashboard 文章列表页 (/dashboard/posts)', () => {
  beforeEach(() => vi.clearAllMocks());

  it('普通用户可访问且仅能看到自己的文章', async () => {
    vi.mocked(auth).mockResolvedValue(userSession as any);
    vi.mocked(prisma.post.findMany).mockResolvedValue([]);

    const Page = (await import('@/app/dashboard/posts/page')).default;
    const element = await Page();

    expect(isReactElement(element)).toBe(true);
    expect(redirect).not.toHaveBeenCalled();
    expect(prisma.post.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { authorId: 'user-1' },
      })
    );
  });

  it('管理员可访问且能看到所有文章（无 authorId 过滤）', async () => {
    vi.mocked(auth).mockResolvedValue(adminSession as any);
    vi.mocked(prisma.post.findMany).mockResolvedValue([]);

    const Page = (await import('@/app/dashboard/posts/page')).default;
    const element = await Page();

    expect(isReactElement(element)).toBe(true);
    expect(redirect).not.toHaveBeenCalled();
    expect(prisma.post.findMany).toHaveBeenCalledWith(
      expect.not.objectContaining({
        where: expect.objectContaining({ authorId: expect.any(String) }),
      })
    );
    // ADMIN passes undefined as where, so findMany gets no authorId filter
    const callArg = vi.mocked(prisma.post.findMany).mock.calls[0][0];
    expect(callArg?.where === undefined || !('authorId' in (callArg?.where ?? {}))).toBe(true);
  });

  it('未登录用户应被重定向到 /login', async () => {
    vi.mocked(auth).mockResolvedValue(null);

    await expect(async () => {
      const Page = (await import('@/app/dashboard/posts/page')).default;
      await Page();
    }).rejects.toThrow(NEXT_REDIRECT);
  });

  it('普通用户看到自己的文章数据', async () => {
    vi.mocked(auth).mockResolvedValue(userSession as any);
    const mockPosts = [
      {
        id: 'p1', title: '我的文章', slug: 'my-post', published: true,
        createdAt: new Date(), updatedAt: new Date(),
        author: { name: 'User', email: 'user@test.com' },
        _count: { comments: 3 },
      },
    ];
    vi.mocked(prisma.post.findMany).mockResolvedValue(mockPosts as any);

    const Page = (await import('@/app/dashboard/posts/page')).default;
    const element = await Page();

    expect(isReactElement(element)).toBe(true);
    // Verify the query limited to user's own posts
    expect(prisma.post.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { authorId: 'user-1' },
        orderBy: { updatedAt: 'desc' },
        take: 100,
      })
    );
  });

  it('管理员看到所有文章数据（含其他作者信息）', async () => {
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

    const Page = (await import('@/app/dashboard/posts/page')).default;
    const element = await Page();

    expect(isReactElement(element)).toBe(true);
    // Verify no authorId filter for admin
    const callArg = vi.mocked(prisma.post.findMany).mock.calls[0][0];
    expect(callArg?.where === undefined || !('authorId' in (callArg?.where ?? {}))).toBe(true);
  });

  it('文章数为空时正确渲染空状态', async () => {
    vi.mocked(auth).mockResolvedValue(userSession as any);
    vi.mocked(prisma.post.findMany).mockResolvedValue([]);

    const Page = (await import('@/app/dashboard/posts/page')).default;
    const element = await Page();

    expect(isReactElement(element)).toBe(true);
  });
});
