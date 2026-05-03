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

vi.mock('bcryptjs', () => ({
  compare: vi.fn(),
  hash: vi.fn(),
}));

import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { compare, hash } from 'bcryptjs';

async function patchHandler() {
  const { PATCH } = await import('@/app/api/auth/profile/route');
  return PATCH;
}

const baseRequest = (body: unknown) =>
  new Request('http://localhost:3000/api/auth/profile', {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });

describe('PATCH /api/auth/profile — 邮箱修改', () => {
  beforeEach(() => vi.clearAllMocks());

  it('应使用正确密码成功修改邮箱', async () => {
    vi.mocked(auth).mockResolvedValue({
      user: { id: 'user-1', email: 'old@test.com' },
    } as any);
    vi.mocked(prisma.user.findUnique).mockResolvedValueOnce({
      password: '$2a$12$hashed',
    } as any);
    vi.mocked(compare).mockResolvedValue(true as never);
    vi.mocked(prisma.user.findUnique).mockResolvedValueOnce(null); // no duplicate
    vi.mocked(prisma.user.update).mockResolvedValue({} as any);

    const handler = await patchHandler();
    const res = await handler(
      baseRequest({
        type: 'email',
        email: 'new@test.com',
        password: 'correct-password',
      })
    );

    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data.message).toBe('邮箱已更新');
    expect(prisma.user.update).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: 'user-1' },
        data: { email: 'new@test.com' },
      })
    );
  });

  it('邮箱修改使用错误密码应返回 400', async () => {
    vi.mocked(auth).mockResolvedValue({
      user: { id: 'user-1', email: 'old@test.com' },
    } as any);
    vi.mocked(prisma.user.findUnique).mockResolvedValueOnce({
      password: '$2a$12$hashed',
    } as any);
    vi.mocked(compare).mockResolvedValue(false as never);

    const handler = await patchHandler();
    const res = await handler(
      baseRequest({
        type: 'email',
        email: 'new@test.com',
        password: 'wrong-password',
      })
    );

    expect(res.status).toBe(400);
    const data = await res.json();
    expect(data.error).toBe('密码不正确');
    expect(prisma.user.update).not.toHaveBeenCalled();
  });

  it('邮箱修改发现邮箱已被占用应返回 409', async () => {
    vi.mocked(auth).mockResolvedValue({
      user: { id: 'user-1', email: 'old@test.com' },
    } as any);
    vi.mocked(prisma.user.findUnique).mockResolvedValueOnce({
      password: '$2a$12$hashed',
    } as any);
    vi.mocked(compare).mockResolvedValue(true as never);
    vi.mocked(prisma.user.findUnique).mockResolvedValueOnce({
      id: 'user-2',
      email: 'taken@test.com',
    } as any);

    const handler = await patchHandler();
    const res = await handler(
      baseRequest({
        type: 'email',
        email: 'taken@test.com',
        password: 'correct-password',
      })
    );

    expect(res.status).toBe(409);
    const data = await res.json();
    expect(data.error).toBe('该邮箱已被其他账号使用');
  });

  it('邮箱修改缺少 email 或 password 应返回 400', async () => {
    vi.mocked(auth).mockResolvedValue({
      user: { id: 'user-1' },
    } as any);

    const handler = await patchHandler();

    let res = await handler(baseRequest({ type: 'email', email: '', password: 'pwd' }));
    expect(res.status).toBe(400);

    res = await handler(baseRequest({ type: 'email', email: 'new@test.com', password: '' }));
    expect(res.status).toBe(400);

    res = await handler(baseRequest({ type: 'email' }));
    expect(res.status).toBe(400);
  });

  it('OAuth 用户（无密码）修改邮箱应返回 400', async () => {
    vi.mocked(auth).mockResolvedValue({
      user: { id: 'user-1' },
    } as any);
    vi.mocked(prisma.user.findUnique).mockResolvedValueOnce({
      password: null,
    } as any);

    const handler = await patchHandler();
    const res = await handler(
      baseRequest({ type: 'email', email: 'new@test.com', password: 'any' })
    );

    expect(res.status).toBe(400);
    const data = await res.json();
    expect(data.error).toBe('该账号未设置密码');
  });
});

describe('PATCH /api/auth/profile — 密码修改', () => {
  beforeEach(() => vi.clearAllMocks());

  it('应使用正确当前密码成功修改密码', async () => {
    vi.mocked(auth).mockResolvedValue({
      user: { id: 'user-1' },
    } as any);
    vi.mocked(prisma.user.findUnique).mockResolvedValueOnce({
      password: '$2a$12$oldHashed',
    } as any);
    vi.mocked(compare).mockResolvedValue(true as never);
    vi.mocked(hash).mockResolvedValue('$2a$12$newHashed' as never);
    vi.mocked(prisma.user.update).mockResolvedValue({} as any);

    const handler = await patchHandler();
    const res = await handler(
      baseRequest({
        type: 'password',
        currentPassword: 'old-password',
        newPassword: 'new-password-8chars',
      })
    );

    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data.message).toBe('密码已更新');
    expect(compare).toHaveBeenCalledWith('old-password', '$2a$12$oldHashed');
    expect(hash).toHaveBeenCalledWith('new-password-8chars', 12);
  });

  it('密码修改使用错误当前密码应返回 400', async () => {
    vi.mocked(auth).mockResolvedValue({
      user: { id: 'user-1' },
    } as any);
    vi.mocked(prisma.user.findUnique).mockResolvedValueOnce({
      password: '$2a$12$oldHashed',
    } as any);
    vi.mocked(compare).mockResolvedValue(false as never);

    const handler = await patchHandler();
    const res = await handler(
      baseRequest({
        type: 'password',
        currentPassword: 'wrong-password',
        newPassword: 'new-password-8chars',
      })
    );

    expect(res.status).toBe(400);
    const data = await res.json();
    expect(data.error).toBe('当前密码不正确');
    expect(prisma.user.update).not.toHaveBeenCalled();
  });

  it('新密码少于 8 个字符应返回 400', async () => {
    vi.mocked(auth).mockResolvedValue({
      user: { id: 'user-1' },
    } as any);

    const handler = await patchHandler();
    const res = await handler(
      baseRequest({
        type: 'password',
        currentPassword: 'old-password',
        newPassword: 'short',
      })
    );

    expect(res.status).toBe(400);
    const data = await res.json();
    expect(data.error).toBe('新密码至少需要 8 个字符');
  });

  it('密码修改缺少 currentPassword 或 newPassword 应返回 400', async () => {
    vi.mocked(auth).mockResolvedValue({
      user: { id: 'user-1' },
    } as any);

    const handler = await patchHandler();

    let res = await handler(baseRequest({ type: 'password', currentPassword: '', newPassword: '12345678' }));
    expect(res.status).toBe(400);

    res = await handler(baseRequest({ type: 'password', currentPassword: 'old', newPassword: '' }));
    expect(res.status).toBe(400);
  });

  it('OAuth 用户（无密码）修改密码应返回 400', async () => {
    vi.mocked(auth).mockResolvedValue({
      user: { id: 'user-1' },
    } as any);
    vi.mocked(prisma.user.findUnique).mockResolvedValueOnce({
      password: null,
    } as any);

    const handler = await patchHandler();
    const res = await handler(
      baseRequest({
        type: 'password',
        currentPassword: 'any',
        newPassword: 'new-password-8chars',
      })
    );

    expect(res.status).toBe(400);
    const data = await res.json();
    expect(data.error).toBe('该账号未设置密码');
  });
});

describe('PATCH /api/auth/profile — 通用安全检查', () => {
  beforeEach(() => vi.clearAllMocks());

  it('未认证用户应被拒绝所有操作（401）', async () => {
    vi.mocked(auth).mockResolvedValue(null);

    const handler = await patchHandler();

    const operations = [
      { name: 'email change', body: { type: 'email', email: 'new@test.com', password: 'pwd' } },
      { name: 'password change', body: { type: 'password', currentPassword: 'old', newPassword: 'newpass12' } },
      { name: 'profile update', body: { name: '新名字' } },
    ];

    for (const op of operations) {
      const res = await handler(baseRequest(op.body));
      expect(res.status, `${op.name} should return 401`).toBe(401);
      const data = await res.json();
      expect(data.error).toBe('未登录');
    }
  });
});
