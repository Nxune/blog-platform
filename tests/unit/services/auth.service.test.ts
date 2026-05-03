// @vitest-environment node
import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('@/lib/prisma', () => ({
  prisma: {
    user: {
      findUnique: vi.fn(),
      update: vi.fn(),
    },
  },
}));

import { prisma } from '@/lib/prisma';

const { getUserById, updateProfile } = await import('@/services/auth.service');

const mockUser = {
  id: 'user-1',
  name: '测试用户',
  email: 'test@test.com',
  image: null,
  role: 'USER' as const,
  bio: null,
  createdAt: new Date('2026-05-03'),
};

describe('getUserById', () => {
  beforeEach(() => vi.clearAllMocks());

  it('应返回存在的用户', async () => {
    vi.mocked(prisma.user.findUnique).mockResolvedValue(mockUser as any);
    const result = await getUserById('user-1');
    expect(result).toEqual(mockUser);
    expect(prisma.user.findUnique).toHaveBeenCalledWith({
      where: { id: 'user-1' },
      select: expect.objectContaining({ id: true, name: true, email: true }),
    });
  });

  it('应返回 null 给不存在的用户', async () => {
    vi.mocked(prisma.user.findUnique).mockResolvedValue(null);
    const result = await getUserById('non-existent');
    expect(result).toBeNull();
  });

  it('不应返回 password 字段', async () => {
    vi.mocked(prisma.user.findUnique).mockResolvedValue(mockUser as any);
    const result = await getUserById('user-1');
    expect(result).not.toHaveProperty('password');
  });
});

describe('updateProfile', () => {
  beforeEach(() => vi.clearAllMocks());

  it('应成功更新用户资料', async () => {
    const updated = { ...mockUser, name: '新名字', bio: '新简介' };
    vi.mocked(prisma.user.update).mockResolvedValue(updated as any);

    const result = await updateProfile('user-1', { name: '新名字', bio: '新简介' });
    expect(result.name).toBe('新名字');
    expect(result.bio).toBe('新简介');
    expect(prisma.user.update).toHaveBeenCalledWith({
      where: { id: 'user-1' },
      data: { name: '新名字', bio: '新简介' },
      select: expect.any(Object),
    });
  });
});
