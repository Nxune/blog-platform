// @vitest-environment node
import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('@/lib/auth', () => ({
  auth: {
    api: {
      getSession: vi.fn(),
    },
  },
}));

vi.mock('next/headers', () => ({
  headers: vi.fn().mockResolvedValue(new Headers({ cookie: 'mock' })),
}));

import { auth } from '@/lib/auth';

const { requireAuth, requireAdmin } = await import('@/lib/auth-helpers');

const mockSession = {
  user: { id: 'user-1', name: 'Test', email: 'test@test.com', role: 'USER' },
  session: { id: 'sess-1', expiresAt: new Date(), token: 'tok' },
};

const mockAdminSession = {
  ...mockSession,
  user: { ...mockSession.user, role: 'ADMIN' },
};

describe('requireAuth', () => {
  beforeEach(() => vi.clearAllMocks());

  it('应在已认证时返回 session', async () => {
    vi.mocked(auth.api.getSession).mockResolvedValue(mockSession as any);
    const result = await requireAuth();
    expect(result.user.id).toBe('user-1');
  });

  it('应在未认证时抛出 UNAUTHORIZED 错误', async () => {
    vi.mocked(auth.api.getSession).mockResolvedValue(null);
    await expect(requireAuth()).rejects.toThrow('UNAUTHORIZED');
  });
});

describe('requireAdmin', () => {
  beforeEach(() => vi.clearAllMocks());

  it('应在管理员时返回 session', async () => {
    vi.mocked(auth.api.getSession).mockResolvedValue(mockAdminSession as any);
    const result = await requireAdmin();
    expect(result.user.role).toBe('ADMIN');
  });

  it('应在普通用户时抛出 FORBIDDEN 错误', async () => {
    vi.mocked(auth.api.getSession).mockResolvedValue(mockSession as any);
    await expect(requireAdmin()).rejects.toThrow('FORBIDDEN');
  });

  it('应在未认证时抛出 UNAUTHORIZED', async () => {
    vi.mocked(auth.api.getSession).mockResolvedValue(null);
    await expect(requireAdmin()).rejects.toThrow('UNAUTHORIZED');
  });
});
