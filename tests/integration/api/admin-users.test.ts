// @vitest-environment node
import { describe, it, expect, vi, beforeEach } from 'vitest';

// ── Mocks ──
vi.mock('@/lib/auth', () => ({
  auth: vi.fn(),
}));

vi.mock('@/lib/prisma', () => ({
  prisma: {
    user: {
      findMany: vi.fn(),
      findUnique: vi.fn(),
      count: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
    },
  },
}));

vi.mock('@/lib/auth-helpers', () => ({
  requireSuperAdmin: vi.fn(),
  getUserId: vi.fn(),
}));

vi.mock('bcryptjs', () => ({
  compare: vi.fn(),
  hash: vi.fn(),
}));

import { prisma } from '@/lib/prisma';
import { requireSuperAdmin, getUserId } from '@/lib/auth-helpers';
import { compare } from 'bcryptjs';

// ── Test data ──
const mockUsers = [
  {
    id: 'super-1', name: 'SuperAdmin', email: 'super@test.com', role: 'SUPER_ADMIN',
    createdAt: new Date('2026-01-01'), _count: { posts: 0, comments: 0 },
  },
  {
    id: 'admin-1', name: 'Admin', email: 'admin@test.com', role: 'ADMIN',
    createdAt: new Date('2026-02-01'), _count: { posts: 5, comments: 3 },
  },
  {
    id: 'user-1', name: 'User', email: 'user@test.com', role: 'USER',
    createdAt: new Date('2026-03-01'), _count: { posts: 2, comments: 1 },
  },
  {
    id: 'user-2', name: null, email: 'newuser@test.com', role: 'USER',
    createdAt: new Date('2026-04-01'), _count: { posts: 0, comments: 0 },
  },
];

// ── Handler loaders ──
async function listUsersHandler() {
  const { GET } = await import('@/app/api/admin/users/route');
  return GET;
}

async function getUserHandler() {
  const mod = await import('@/app/api/admin/users/[id]/route');
  return { GET: mod.GET, DELETE: mod.DELETE };
}

async function roleHandler() {
  const { PATCH } = await import('@/app/api/admin/users/[id]/role/route');
  return PATCH;
}

// ──────────────────────────────────────────
// GET /api/admin/users — 用户列表
// ──────────────────────────────────────────
describe('GET /api/admin/users — 用户列表', () => {
  beforeEach(() => vi.clearAllMocks());

  it('SUPER_ADMIN 应能获取用户列表', async () => {
    vi.mocked(requireSuperAdmin).mockResolvedValue({
      user: { id: 'super-1', role: 'SUPER_ADMIN' },
    } as any);
    vi.mocked(prisma.user.findMany).mockResolvedValue(mockUsers as any);
    vi.mocked(prisma.user.count).mockResolvedValue(4);

    const handler = await listUsersHandler();
    const res = await handler(new Request('http://localhost:3000/api/admin/users'));

    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data.users).toHaveLength(4);
    expect(data.total).toBe(4);
    expect(data.page).toBe(1);
  });

  it('ADMIN 应被拒绝访问用户列表（403）', async () => {
    vi.mocked(requireSuperAdmin).mockRejectedValue(new Error('FORBIDDEN'));

    const handler = await listUsersHandler();
    const res = await handler(new Request('http://localhost:3000/api/admin/users'));

    expect(res.status).toBe(403);
    const data = await res.json();
    expect(data.error).toBe('无权限');
  });

  it('未认证用户应被拒绝访问用户列表（401）', async () => {
    vi.mocked(requireSuperAdmin).mockRejectedValue(new Error('UNAUTHORIZED'));

    const handler = await listUsersHandler();
    const res = await handler(new Request('http://localhost:3000/api/admin/users'));

    expect(res.status).toBe(401);
    const data = await res.json();
    expect(data.error).toBe('请先登录');
  });

  it('应支持分页参数', async () => {
    vi.mocked(requireSuperAdmin).mockResolvedValue({
      user: { id: 'super-1', role: 'SUPER_ADMIN' },
    } as any);
    vi.mocked(prisma.user.findMany).mockResolvedValue([mockUsers[2]] as any);
    vi.mocked(prisma.user.count).mockResolvedValue(4);

    const handler = await listUsersHandler();
    const res = await handler(new Request('http://localhost:3000/api/admin/users?page=2&pageSize=1'));

    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data.page).toBe(2);
    expect(data.users).toHaveLength(1);
    expect(prisma.user.findMany).toHaveBeenCalledWith(
      expect.objectContaining({ skip: 1, take: 1 })
    );
  });

  it('应限制 pageSize 最大为 100', async () => {
    vi.mocked(requireSuperAdmin).mockResolvedValue({
      user: { id: 'super-1', role: 'SUPER_ADMIN' },
    } as any);
    vi.mocked(prisma.user.findMany).mockResolvedValue([]);
    vi.mocked(prisma.user.count).mockResolvedValue(0);

    const handler = await listUsersHandler();
    await handler(new Request('http://localhost:3000/api/admin/users?pageSize=999'));

    expect(prisma.user.findMany).toHaveBeenCalledWith(
      expect.objectContaining({ take: 100 })
    );
  });
});

// ──────────────────────────────────────────
// GET /api/admin/users/[id] — 单个用户
// ──────────────────────────────────────────
describe('GET /api/admin/users/[id] — 单个用户详情', () => {
  beforeEach(() => vi.clearAllMocks());

  it('SUPER_ADMIN 应能获取用户详情', async () => {
    vi.mocked(requireSuperAdmin).mockResolvedValue({
      user: { id: 'super-1', role: 'SUPER_ADMIN' },
    } as any);
    vi.mocked(prisma.user.findUnique).mockResolvedValue(mockUsers[2] as any);

    const { GET } = await getUserHandler();
    const res = await GET(
      new Request('http://localhost:3000/api/admin/users/user-1'),
      { params: Promise.resolve({ id: 'user-1' }) } as any
    );

    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data.email).toBe('user@test.com');
    expect(data.role).toBe('USER');
  });

  it('不存在的用户应返回 404', async () => {
    vi.mocked(requireSuperAdmin).mockResolvedValue({
      user: { id: 'super-1', role: 'SUPER_ADMIN' },
    } as any);
    vi.mocked(prisma.user.findUnique).mockResolvedValue(null);

    const { GET } = await getUserHandler();
    const res = await GET(
      new Request('http://localhost:3000/api/admin/users/nonexistent'),
      { params: Promise.resolve({ id: 'nonexistent' }) } as any
    );

    expect(res.status).toBe(404);
    const data = await res.json();
    expect(data.error).toBe('用户不存在');
  });
});

// ──────────────────────────────────────────
// PATCH /api/admin/users/[id]/role — 角色修改
// ──────────────────────────────────────────
describe('PATCH /api/admin/users/[id]/role — 角色修改', () => {
  beforeEach(() => vi.clearAllMocks());

  const superAdminSession = { user: { id: 'super-1', role: 'SUPER_ADMIN' } };

  it('SUPER_ADMIN 应能修改普通用户角色为 ADMIN', async () => {
    vi.mocked(requireSuperAdmin).mockResolvedValue(superAdminSession as any);
    vi.mocked(getUserId).mockReturnValue('super-1');
    vi.mocked(prisma.user.findUnique)
      .mockResolvedValueOnce({ password: '$2a$12$hashed' } as any)  // self password
      .mockResolvedValueOnce({ id: 'user-1', name: 'User', role: 'USER' } as any);  // target
    vi.mocked(compare).mockResolvedValue(true as never);
    vi.mocked(prisma.user.update).mockResolvedValue({
      id: 'user-1', name: 'User', email: 'user@test.com', role: 'ADMIN',
    } as any);

    const handler = await roleHandler();
    const res = await handler(
      new Request('http://localhost:3000/api/admin/users/user-1/role', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ role: 'ADMIN', password: 'correct-password' }),
      }),
      { params: Promise.resolve({ id: 'user-1' }) } as any
    );

    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data.role).toBe('ADMIN');
  });

  it('SUPER_ADMIN 应能修改用户角色为 USER', async () => {
    vi.mocked(requireSuperAdmin).mockResolvedValue(superAdminSession as any);
    vi.mocked(getUserId).mockReturnValue('super-1');
    vi.mocked(prisma.user.findUnique)
      .mockResolvedValueOnce({ password: '$2a$12$hashed' } as any)
      .mockResolvedValueOnce({ id: 'admin-1', name: 'Admin', role: 'ADMIN' } as any);
    vi.mocked(compare).mockResolvedValue(true as never);
    vi.mocked(prisma.user.update).mockResolvedValue({
      id: 'admin-1', name: 'Admin', email: 'admin@test.com', role: 'USER',
    } as any);

    const handler = await roleHandler();
    const res = await handler(
      new Request('http://localhost:3000/api/admin/users/admin-1/role', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ role: 'USER', password: 'correct-password' }),
      }),
      { params: Promise.resolve({ id: 'admin-1' }) } as any
    );

    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data.role).toBe('USER');
  });

  it('不能修改自己的角色（400）', async () => {
    vi.mocked(requireSuperAdmin).mockResolvedValue(superAdminSession as any);
    vi.mocked(getUserId).mockReturnValue('super-1');

    const handler = await roleHandler();
    const res = await handler(
      new Request('http://localhost:3000/api/admin/users/super-1/role', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ role: 'ADMIN', password: 'any' }),
      }),
      { params: Promise.resolve({ id: 'super-1' }) } as any
    );

    expect(res.status).toBe(400);
    const data = await res.json();
    expect(data.error).toBe('不能修改自己的角色');
    expect(prisma.user.update).not.toHaveBeenCalled();
  });

  it('不能修改其他 SUPER_ADMIN 的角色（400）', async () => {
    vi.mocked(requireSuperAdmin).mockResolvedValue(superAdminSession as any);
    vi.mocked(getUserId).mockReturnValue('super-1');
    vi.mocked(prisma.user.findUnique)
      .mockResolvedValueOnce({ password: '$2a$12$hashed' } as any)
      .mockResolvedValueOnce({ id: 'super-2', name: 'OtherSuper', role: 'SUPER_ADMIN' } as any);
    vi.mocked(compare).mockResolvedValue(true as never);

    const handler = await roleHandler();
    const res = await handler(
      new Request('http://localhost:3000/api/admin/users/super-2/role', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ role: 'USER', password: 'correct-password' }),
      }),
      { params: Promise.resolve({ id: 'super-2' }) } as any
    );

    expect(res.status).toBe(400);
    const data = await res.json();
    expect(data.error).toBe('不能修改超级管理员的角色');
    expect(prisma.user.update).not.toHaveBeenCalled();
  });

  it('无效的角色值应被拒绝（400）', async () => {
    vi.mocked(requireSuperAdmin).mockResolvedValue(superAdminSession as any);
    vi.mocked(getUserId).mockReturnValue('super-1');

    const handler = await roleHandler();
    const res = await handler(
      new Request('http://localhost:3000/api/admin/users/user-1/role', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ role: 'SUPER_ADMIN', password: 'any' }),
      }),
      { params: Promise.resolve({ id: 'user-1' }) } as any
    );

    expect(res.status).toBe(400);
    const data = await res.json();
    expect(data.error).toContain('无效的角色值');
  });

  it('错误密码应被拒绝（400）', async () => {
    vi.mocked(requireSuperAdmin).mockResolvedValue(superAdminSession as any);
    vi.mocked(getUserId).mockReturnValue('super-1');
    vi.mocked(prisma.user.findUnique)
      .mockResolvedValueOnce({ password: '$2a$12$hashed' } as any);
    vi.mocked(compare).mockResolvedValue(false as never);

    const handler = await roleHandler();
    const res = await handler(
      new Request('http://localhost:3000/api/admin/users/user-1/role', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ role: 'USER', password: 'wrong-password' }),
      }),
      { params: Promise.resolve({ id: 'user-1' }) } as any
    );

    expect(res.status).toBe(400);
    const data = await res.json();
    expect(data.error).toBe('密码错误');
  });

  it('缺少密码应被拒绝（400）', async () => {
    vi.mocked(requireSuperAdmin).mockResolvedValue(superAdminSession as any);
    vi.mocked(getUserId).mockReturnValue('super-1');

    const handler = await roleHandler();
    const res = await handler(
      new Request('http://localhost:3000/api/admin/users/user-1/role', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ role: 'USER' }),
      }),
      { params: Promise.resolve({ id: 'user-1' }) } as any
    );

    expect(res.status).toBe(400);
    const data = await res.json();
    expect(data.error).toBe('需要当前密码验证');
  });

  it('不存在的用户应返回 404', async () => {
    vi.mocked(requireSuperAdmin).mockResolvedValue(superAdminSession as any);
    vi.mocked(getUserId).mockReturnValue('super-1');
    vi.mocked(prisma.user.findUnique)
      .mockResolvedValueOnce({ password: '$2a$12$hashed' } as any)
      .mockResolvedValueOnce(null);
    vi.mocked(compare).mockResolvedValue(true as never);

    const handler = await roleHandler();
    const res = await handler(
      new Request('http://localhost:3000/api/admin/users/nonexistent/role', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ role: 'USER', password: 'correct' }),
      }),
      { params: Promise.resolve({ id: 'nonexistent' }) } as any
    );

    expect(res.status).toBe(404);
    const data = await res.json();
    expect(data.error).toBe('用户不存在');
  });

  it('ADMIN 不能修改角色（403）', async () => {
    vi.mocked(requireSuperAdmin).mockRejectedValue(new Error('FORBIDDEN'));

    const handler = await roleHandler();
    const res = await handler(
      new Request('http://localhost:3000/api/admin/users/user-1/role', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ role: 'ADMIN', password: 'any' }),
      }),
      { params: Promise.resolve({ id: 'user-1' }) } as any
    );

    expect(res.status).toBe(403);
  });
});

// ──────────────────────────────────────────
// DELETE /api/admin/users/[id] — 用户删除
// ──────────────────────────────────────────
describe('DELETE /api/admin/users/[id] — 用户删除', () => {
  beforeEach(() => vi.clearAllMocks());

  const superAdminSession = { user: { id: 'super-1', role: 'SUPER_ADMIN' } };

  it('SUPER_ADMIN 应能删除普通用户', async () => {
    vi.mocked(requireSuperAdmin).mockResolvedValue(superAdminSession as any);
    vi.mocked(getUserId).mockReturnValue('super-1');
    vi.mocked(prisma.user.findUnique)
      .mockResolvedValueOnce({ password: '$2a$12$hashed' } as any)  // self password
      .mockResolvedValueOnce({ id: 'user-1', email: 'user@test.com', role: 'USER' } as any);  // target
    vi.mocked(compare).mockResolvedValue(true as never);
    vi.mocked(prisma.user.delete).mockResolvedValue({} as any);

    const { DELETE } = await getUserHandler();
    const res = await DELETE(
      new Request('http://localhost:3000/api/admin/users/user-1', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password: 'correct-password' }),
      }),
      { params: Promise.resolve({ id: 'user-1' }) } as any
    );

    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data.success).toBe(true);
    expect(prisma.user.delete).toHaveBeenCalledWith({ where: { id: 'user-1' } });
  });

  it('不能删除自己的账户（400）', async () => {
    vi.mocked(requireSuperAdmin).mockResolvedValue(superAdminSession as any);
    vi.mocked(getUserId).mockReturnValue('super-1');

    const { DELETE } = await getUserHandler();
    const res = await DELETE(
      new Request('http://localhost:3000/api/admin/users/super-1', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password: 'any' }),
      }),
      { params: Promise.resolve({ id: 'super-1' }) } as any
    );

    expect(res.status).toBe(400);
    const data = await res.json();
    expect(data.error).toBe('不能删除自己的账户');
    expect(prisma.user.delete).not.toHaveBeenCalled();
  });

  it('不能删除其他 SUPER_ADMIN（400）', async () => {
    vi.mocked(requireSuperAdmin).mockResolvedValue(superAdminSession as any);
    vi.mocked(getUserId).mockReturnValue('super-1');
    vi.mocked(prisma.user.findUnique)
      .mockResolvedValueOnce({ password: '$2a$12$hashed' } as any)
      .mockResolvedValueOnce({ id: 'super-2', email: 'other@test.com', role: 'SUPER_ADMIN' } as any);
    vi.mocked(compare).mockResolvedValue(true as never);

    const { DELETE } = await getUserHandler();
    const res = await DELETE(
      new Request('http://localhost:3000/api/admin/users/super-2', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password: 'correct' }),
      }),
      { params: Promise.resolve({ id: 'super-2' }) } as any
    );

    expect(res.status).toBe(400);
    const data = await res.json();
    expect(data.error).toBe('不能删除超级管理员');
    expect(prisma.user.delete).not.toHaveBeenCalled();
  });

  it('删除需要密码验证', async () => {
    vi.mocked(requireSuperAdmin).mockResolvedValue(superAdminSession as any);
    vi.mocked(getUserId).mockReturnValue('super-1');

    const { DELETE } = await getUserHandler();
    const res = await DELETE(
      new Request('http://localhost:3000/api/admin/users/user-1', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({}),
      }),
      { params: Promise.resolve({ id: 'user-1' }) } as any
    );

    expect(res.status).toBe(400);
    const data = await res.json();
    expect(data.error).toBe('需要当前密码验证');
  });

  it('错误密码删除被拒绝（400）', async () => {
    vi.mocked(requireSuperAdmin).mockResolvedValue(superAdminSession as any);
    vi.mocked(getUserId).mockReturnValue('super-1');
    vi.mocked(prisma.user.findUnique)
      .mockResolvedValueOnce({ password: '$2a$12$hashed' } as any);
    vi.mocked(compare).mockResolvedValue(false as never);

    const { DELETE } = await getUserHandler();
    const res = await DELETE(
      new Request('http://localhost:3000/api/admin/users/user-1', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password: 'wrong' }),
      }),
      { params: Promise.resolve({ id: 'user-1' }) } as any
    );

    expect(res.status).toBe(400);
    const data = await res.json();
    expect(data.error).toBe('密码错误');
  });

  it('不存在的用户删除应返回 404', async () => {
    vi.mocked(requireSuperAdmin).mockResolvedValue(superAdminSession as any);
    vi.mocked(getUserId).mockReturnValue('super-1');
    vi.mocked(prisma.user.findUnique)
      .mockResolvedValueOnce({ password: '$2a$12$hashed' } as any)
      .mockResolvedValueOnce(null);
    vi.mocked(compare).mockResolvedValue(true as never);

    const { DELETE } = await getUserHandler();
    const res = await DELETE(
      new Request('http://localhost:3000/api/admin/users/nonexistent', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password: 'correct' }),
      }),
      { params: Promise.resolve({ id: 'nonexistent' }) } as any
    );

    expect(res.status).toBe(404);
    const data = await res.json();
    expect(data.error).toBe('用户不存在');
  });

  it('ADMIN 不能删除用户（403）', async () => {
    vi.mocked(requireSuperAdmin).mockRejectedValue(new Error('FORBIDDEN'));

    const { DELETE } = await getUserHandler();
    const res = await DELETE(
      new Request('http://localhost:3000/api/admin/users/user-1', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password: 'any' }),
      }),
      { params: Promise.resolve({ id: 'user-1' }) } as any
    );

    expect(res.status).toBe(403);
  });

  it('SUPER_ADMIN 应能删除 ADMIN', async () => {
    vi.mocked(requireSuperAdmin).mockResolvedValue(superAdminSession as any);
    vi.mocked(getUserId).mockReturnValue('super-1');
    vi.mocked(prisma.user.findUnique)
      .mockResolvedValueOnce({ password: '$2a$12$hashed' } as any)
      .mockResolvedValueOnce({ id: 'admin-1', email: 'admin@test.com', role: 'ADMIN' } as any);
    vi.mocked(compare).mockResolvedValue(true as never);
    vi.mocked(prisma.user.delete).mockResolvedValue({} as any);

    const { DELETE } = await getUserHandler();
    const res = await DELETE(
      new Request('http://localhost:3000/api/admin/users/admin-1', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password: 'correct' }),
      }),
      { params: Promise.resolve({ id: 'admin-1' }) } as any
    );

    expect(res.status).toBe(200);
    expect(prisma.user.delete).toHaveBeenCalledWith({ where: { id: 'admin-1' } });
  });
});
