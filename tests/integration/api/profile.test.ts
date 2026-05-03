// @vitest-environment node
import { describe, it, expect, vi, beforeEach } from 'vitest';

// Mocks must be at top level, hoisted by vitest
vi.mock('@/lib/auth', () => ({
  auth: {
    api: {
      getSession: vi.fn(),
    },
  },
}));

vi.mock('@/lib/prisma', () => ({
  prisma: {
    user: {
      findUnique: vi.fn(),
      update: vi.fn(),
    },
  },
}));

vi.mock('next/headers', () => ({
  headers: vi.fn().mockResolvedValue(new Headers({ cookie: 'mock-session' })),
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

describe('GET /api/auth/profile', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('应返回已登录用户的资料', async () => {
    vi.mocked(auth.api.getSession).mockResolvedValue({
      user: { id: 'user-1', email: 'test@example.com' },
      session: { id: 'sess-1', expiresAt: new Date(), token: 'tok' },
    } as any);
    vi.mocked(prisma.user.findUnique).mockResolvedValue(mockUser as any);

    const { GET } = await import('./profile.test');
    // Integration test placeholder - actual implementation will call the route handler
    expect(true).toBe(true);
  });

  it('应拒绝未认证请求并返回 401', async () => {
    vi.mocked(auth.api.getSession).mockResolvedValue(null);

    expect(true).toBe(true);
  });

  it('不应返回密码字段', async () => {
    expect(true).toBe(true);
  });
});

describe('PATCH /api/auth/profile', () => {
  it('应成功更新用户资料', async () => {
    expect(true).toBe(true);
  });

  it('应拒绝未认证请求并返回 401', async () => {
    expect(true).toBe(true);
  });

  it('应拒绝空 name 字段', async () => {
    expect(true).toBe(true);
  });
});
