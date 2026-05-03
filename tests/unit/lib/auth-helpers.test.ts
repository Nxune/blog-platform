// @vitest-environment node
import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('@/lib/auth', () => ({
  auth: vi.fn(),
}));

import { auth } from '@/lib/auth';

const { requireAuth, requireAdmin, requireOwner } = await import('@/lib/auth-helpers');

const mockSession = {
  user: { id: 'user-1', name: 'Test', email: 'test@test.com', role: 'USER' },
  expires: new Date().toISOString(),
};

const mockAdminSession = {
  user: { id: 'admin-1', name: 'Admin', email: 'admin@test.com', role: 'ADMIN' },
  expires: new Date().toISOString(),
};

describe('requireAuth', () => {
  beforeEach(() => vi.clearAllMocks());

  it('应在已认证时返回 session', async () => {
    vi.mocked(auth).mockResolvedValue(mockSession as any);
    const result = await requireAuth();
    expect(result.user.id).toBe('user-1');
  });

  it('应在未认证时抛出 UNAUTHORIZED 错误', async () => {
    vi.mocked(auth).mockResolvedValue(null);
    await expect(requireAuth()).rejects.toThrow('UNAUTHORIZED');
  });

  it('应在 session 无 user 时抛出 UNAUTHORIZED', async () => {
    vi.mocked(auth).mockResolvedValue({} as any);
    await expect(requireAuth()).rejects.toThrow('UNAUTHORIZED');
  });
});

describe('requireAdmin', () => {
  beforeEach(() => vi.clearAllMocks());

  it('应在管理员时返回 session', async () => {
    vi.mocked(auth).mockResolvedValue(mockAdminSession as any);
    const result = await requireAdmin();
    expect(result.user.role).toBe('ADMIN');
  });

  it('应在普通用户时抛出 FORBIDDEN 错误', async () => {
    vi.mocked(auth).mockResolvedValue(mockSession as any);
    await expect(requireAdmin()).rejects.toThrow('FORBIDDEN');
  });

  it('应在未认证时抛出 UNAUTHORIZED', async () => {
    vi.mocked(auth).mockResolvedValue(null);
    await expect(requireAdmin()).rejects.toThrow('UNAUTHORIZED');
  });

  it('应在 READER 角色时抛出 FORBIDDEN', async () => {
    const readerSession = {
      ...mockSession,
      user: { ...mockSession.user, role: 'READER' },
    };
    vi.mocked(auth).mockResolvedValue(readerSession as any);
    await expect(requireAdmin()).rejects.toThrow('FORBIDDEN');
  });

  it('应拒绝 role 为 undefined 的管理员检查', async () => {
    vi.mocked(auth).mockResolvedValue({
      user: { id: 'user-1', name: 'Test' },
    } as any);
    await expect(requireAdmin()).rejects.toThrow('FORBIDDEN');
  });

  it('requireAdmin 应先认证再鉴权', async () => {
    vi.mocked(auth).mockResolvedValue(mockAdminSession as any);
    const result = await requireAdmin();
    expect(result.user.id).toBe('admin-1');
    expect(result.user.role).toBe('ADMIN');
  });
});

describe('requireOwner', () => {
  beforeEach(() => vi.clearAllMocks());

  it('应允许资源所有者访问', async () => {
    vi.mocked(auth).mockResolvedValue(mockSession as any);
    const result = await requireOwner('user-1', '文章');
    expect(result.user.id).toBe('user-1');
  });

  it('应允许管理员访问任何资源', async () => {
    vi.mocked(auth).mockResolvedValue(mockAdminSession as any);
    const result = await requireOwner('user-2', '文章');
    expect(result.user.role).toBe('ADMIN');
  });

  it('应拒绝非所有者访问并返回有意义的错误消息', async () => {
    vi.mocked(auth).mockResolvedValue(mockSession as any);
    await expect(requireOwner('user-2', '文章')).rejects.toThrow('您没有权限操作此文章');
  });

  it('应拒绝非所有者访问并默认使用"资源"作为资源名', async () => {
    vi.mocked(auth).mockResolvedValue(mockSession as any);
    await expect(requireOwner('user-2')).rejects.toThrow('您没有权限操作此资源');
  });

  it('应在未认证时抛出 UNAUTHORIZED', async () => {
    vi.mocked(auth).mockResolvedValue(null);
    await expect(requireOwner('user-1')).rejects.toThrow('UNAUTHORIZED');
  });

  it('应在 session 无 user 时抛出 UNAUTHORIZED', async () => {
    vi.mocked(auth).mockResolvedValue({} as any);
    await expect(requireOwner('user-1')).rejects.toThrow('UNAUTHORIZED');
  });
});
