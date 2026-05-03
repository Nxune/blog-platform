// @vitest-environment node
import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('@/lib/auth', () => ({
  auth: vi.fn(),
}));

vi.mock('@/lib/prisma', () => ({
  prisma: {
    user: {
      findUnique: vi.fn(),
      update: vi.fn(),
    },
  },
}));

import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

const mockUser = {
  id: 'user-1',
  name: '测试用户',
  email: 'test@example.com',
  image: null,
  role: 'USER',
  bio: '博主简介',
  createdAt: new Date('2026-05-03'),
};

async function getHandler() {
  const { GET } = await import('@/app/api/auth/profile/route');
  return GET;
}

async function patchHandler() {
  const { PATCH } = await import('@/app/api/auth/profile/route');
  return PATCH;
}

describe('GET /api/auth/profile', () => {
  beforeEach(() => vi.clearAllMocks());

  it('应返回已登录用户的资料（200）', async () => {
    vi.mocked(auth).mockResolvedValue({
      user: { id: 'user-1', email: 'test@example.com' },
      expires: new Date().toISOString(),
    } as any);
    vi.mocked(prisma.user.findUnique).mockResolvedValue(mockUser as any);

    const handler = await getHandler();
    const response = await handler();
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.name).toBe('测试用户');
    expect(data.email).toBe('test@example.com');
  });

  it('应拒绝未认证请求并返回 401', async () => {
    vi.mocked(auth).mockResolvedValue(null);

    const handler = await getHandler();
    const response = await handler();
    const data = await response.json();

    expect(response.status).toBe(401);
    expect(data.error).toBe('未登录');
  });

  it('应返回 404 给不存在的用户', async () => {
    vi.mocked(auth).mockResolvedValue({
      user: { id: 'nonexistent' },
      expires: new Date().toISOString(),
    } as any);
    vi.mocked(prisma.user.findUnique).mockResolvedValue(null);

    const handler = await getHandler();
    const response = await handler();

    expect(response.status).toBe(404);
  });
});

describe('PATCH /api/auth/profile', () => {
  beforeEach(() => vi.clearAllMocks());

  it('应成功更新用户资料并返回 200', async () => {
    vi.mocked(auth).mockResolvedValue({
      user: { id: 'user-1', email: 'test@example.com' },
      expires: new Date().toISOString(),
    } as any);
    const updatedUser = { ...mockUser, name: '新名字', bio: '新简介' };
    vi.mocked(prisma.user.update).mockResolvedValue(updatedUser as any);

    const handler = await patchHandler();
    const request = new Request('http://localhost:3000/api/auth/profile', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: '新名字', bio: '新简介' }),
    });
    const response = await handler(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.name).toBe('新名字');
    expect(data.bio).toBe('新简介');
  });

  it('应拒绝未认证请求并返回 401', async () => {
    vi.mocked(auth).mockResolvedValue(null);

    const handler = await patchHandler();
    const request = new Request('http://localhost:3000/api/auth/profile', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: '新名字' }),
    });
    const response = await handler(request);
    const data = await response.json();

    expect(response.status).toBe(401);
    expect(data.error).toBe('未登录');
  });

  it('应更新单一字段（bio）', async () => {
    vi.mocked(auth).mockResolvedValue({
      user: { id: 'user-1', email: 'test@example.com' },
      expires: new Date().toISOString(),
    } as any);
    const updatedUser = { ...mockUser, bio: '新个人简介' };
    vi.mocked(prisma.user.update).mockResolvedValue(updatedUser as any);

    const handler = await patchHandler();
    const request = new Request('http://localhost:3000/api/auth/profile', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ bio: '新个人简介' }),
    });
    const response = await handler(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.bio).toBe('新个人简介');
  });

  it('PATCH 返回 500 当数据库错误', async () => {
    vi.mocked(auth).mockResolvedValue({
      user: { id: 'user-1', email: 'test@example.com' },
      expires: new Date().toISOString(),
    } as any);
    vi.mocked(prisma.user.update).mockRejectedValue(new Error('DB error'));

    const handler = await patchHandler();
    const request = new Request('http://localhost:3000/api/auth/profile', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: '新名字' }),
    });
    const response = await handler(request);
    expect(response.status).toBe(500);
  });

  it('PATCH 无效 JSON 应返回 500', async () => {
    vi.mocked(auth).mockResolvedValue({
      user: { id: 'user-1', email: 'test@example.com' },
      expires: new Date().toISOString(),
    } as any);

    const handler = await patchHandler();
    const request = new Request('http://localhost:3000/api/auth/profile', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: 'not-json',
    });
    const response = await handler(request);
    expect(response.status).toBe(500);
  });
});
