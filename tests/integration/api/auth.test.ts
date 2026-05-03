// @vitest-environment node
import { describe, it, expect, vi, beforeEach } from 'vitest';

// ── Registration route mocks ──
vi.mock('@/lib/prisma', () => ({
  prisma: {
    user: {
      findUnique: vi.fn(),
      create: vi.fn(),
    },
  },
}));

vi.mock('bcryptjs', () => ({
  hash: vi.fn(),
}));

// ── NextAuth catch-all route mock ──
vi.mock('@/lib/auth', () => ({
  handlers: {
    GET: vi.fn(),
    POST: vi.fn(),
  },
  auth: vi.fn(),
  signIn: vi.fn(),
  signOut: vi.fn(),
}));

import { prisma } from '@/lib/prisma';
import { hash } from 'bcryptjs';

async function registerHandler() {
  const { POST } = await import('@/app/api/auth/register/route');
  return POST;
}

async function nextAuthHandler() {
  const mod = await import('@/app/api/auth/[...nextauth]/route');
  return mod;
}

describe('GET/POST /api/auth/[...nextauth]', () => {
  it('应导出 GET 处理函数', async () => {
    const { GET } = await nextAuthHandler();
    expect(GET).toBeDefined();
    expect(typeof GET).toBe('function');
  });

  it('应导出 POST 处理函数', async () => {
    const { POST } = await nextAuthHandler();
    expect(POST).toBeDefined();
    expect(typeof POST).toBe('function');
  });

  it('应使用 lib/auth 的 handlers', async () => {
    const { handlers } = await import('@/lib/auth');
    const mod = await nextAuthHandler();
    expect(mod.GET).toBe(handlers.GET);
    expect(mod.POST).toBe(handlers.POST);
  });
});

describe('POST /api/auth/register', () => {
  beforeEach(() => vi.clearAllMocks());

  it('应成功注册新用户并返回 201', async () => {
    vi.mocked(prisma.user.findUnique).mockResolvedValue(null);
    vi.mocked(hash).mockResolvedValue('$2a$12$hashedpassword' as never);
    vi.mocked(prisma.user.create).mockResolvedValue({ id: 'new-user' } as any);

    const handler = await registerHandler();
    const res = await handler(new Request('http://localhost:3000/api/auth/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: '新用户', email: 'new@test.com', password: 'Password1!' }),
    }));
    expect(res.status).toBe(201);
    const data = await res.json();
    expect(data.success).toBe(true);
    expect(prisma.user.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          name: '新用户',
          email: 'new@test.com',
          role: 'READER',
        }),
      })
    );
  });

  it('应拒绝重复邮箱并返回 409', async () => {
    vi.mocked(prisma.user.findUnique).mockResolvedValue({ id: 'existing' } as any);

    const handler = await registerHandler();
    const res = await handler(new Request('http://localhost:3000/api/auth/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: '重复', email: 'existing@test.com', password: 'Password1!' }),
    }));
    expect(res.status).toBe(409);
    const data = await res.json();
    expect(data.error).toBe('该邮箱已被注册');
  });

  it('应拒绝空字段并返回 400', async () => {
    const handler = await registerHandler();

    let res = await handler(new Request('http://localhost:3000/api/auth/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: '', email: 'test@test.com', password: 'Password1!' }),
    }));
    expect(res.status).toBe(400);

    res = await handler(new Request('http://localhost:3000/api/auth/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: 'Test', email: '', password: 'Password1!' }),
    }));
    expect(res.status).toBe(400);

    res = await handler(new Request('http://localhost:3000/api/auth/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: 'Test', email: 'test@test.com', password: '' }),
    }));
    expect(res.status).toBe(400);
  });

  it('应使用 bcrypt 加密密码', async () => {
    vi.mocked(prisma.user.findUnique).mockResolvedValue(null);
    vi.mocked(hash).mockResolvedValue('$2a$12$hashed' as never);
    vi.mocked(prisma.user.create).mockResolvedValue({ id: 'new' } as any);

    const handler = await registerHandler();
    await handler(new Request('http://localhost:3000/api/auth/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: 'Test', email: 'test@test.com', password: 'mypassword' }),
    }));
    expect(hash).toHaveBeenCalledWith('mypassword', 12);
  });

  it('新用户角色默认为 READER', async () => {
    vi.mocked(prisma.user.findUnique).mockResolvedValue(null);
    vi.mocked(hash).mockResolvedValue('$2a$12$hashed' as never);
    vi.mocked(prisma.user.create).mockResolvedValue({ id: 'new' } as any);

    const handler = await registerHandler();
    await handler(new Request('http://localhost:3000/api/auth/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: 'Test', email: 'test@test.com', password: 'Password1!' }),
    }));
    expect(prisma.user.create).toHaveBeenCalledWith(
      expect.objectContaining({ data: expect.objectContaining({ role: 'READER' }) })
    );
  });

  it('用户名默认使用邮箱前缀', async () => {
    vi.mocked(prisma.user.findUnique).mockResolvedValue(null);
    vi.mocked(hash).mockResolvedValue('$2a$12$hashed' as never);
    vi.mocked(prisma.user.create).mockResolvedValue({ id: 'new' } as any);

    const handler = await registerHandler();
    await handler(new Request('http://localhost:3000/api/auth/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: 'Test', email: 'hello@test.com', password: 'Password1!' }),
    }));
    expect(prisma.user.create).toHaveBeenCalledWith(
      expect.objectContaining({ data: expect.objectContaining({ username: 'hello' }) })
    );
  });

  it('数据库错误应返回 500', async () => {
    vi.mocked(prisma.user.findUnique).mockRejectedValue(new Error('DB error'));

    const handler = await registerHandler();
    const res = await handler(new Request('http://localhost:3000/api/auth/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: 'Test', email: 'test@test.com', password: 'Password1!' }),
    }));
    expect(res.status).toBe(500);
  });
});

describe('Auth 模块结构', () => {
  it('lib/auth 应导出 handlers, auth, signIn, signOut', async () => {
    const authModule = await import('@/lib/auth');
    expect(authModule.handlers).toBeDefined();
    expect(authModule.auth).toBeDefined();
    expect(authModule.signIn).toBeDefined();
    expect(authModule.signOut).toBeDefined();
  });
});
