// @vitest-environment node
import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('@/services/tag.service', () => ({
  listTags: vi.fn(),
  createTag: vi.fn(),
  deleteTag: vi.fn(),
}));

vi.mock('@/lib/auth-helpers', () => ({
  requireAdmin: vi.fn(),
}));

import { listTags, createTag, deleteTag } from '@/services/tag.service';
import { requireAdmin } from '@/lib/auth-helpers';

const mockTags = [
  { id: '1', name: '技术', slug: 'tech', _count: { posts: 5 } },
  { id: '2', name: '前端', slug: 'frontend', _count: { posts: 3 } },
];

async function getHandler() {
  const { GET } = await import('@/app/api/tags/route');
  return GET;
}

async function postHandler() {
  const { POST } = await import('@/app/api/tags/route');
  return POST;
}

async function deleteHandler() {
  const { DELETE } = await import('@/app/api/tags/route');
  return DELETE;
}

describe('GET /api/tags', () => {
  beforeEach(() => vi.clearAllMocks());

  it('应返回标签列表', async () => {
    vi.mocked(listTags).mockResolvedValue([
      { id: '1', name: '技术', slug: 'tech', _count: { posts: 5 } },
      { id: '2', name: '前端', slug: 'frontend', _count: { posts: 3 } },
    ] as any);

    const handler = await getHandler();
    const res = await handler();
    const data = await res.json();
    expect(res.status).toBe(200);
    expect(data).toHaveLength(2);
  });

  it('空数据库应返回空数组', async () => {
    vi.mocked(listTags).mockResolvedValue([]);
    const handler = await getHandler();
    const res = await handler();
    const data = await res.json();
    expect(data).toEqual([]);
  });

  it('应包含文章计数', async () => {
    vi.mocked(listTags).mockResolvedValue(mockTags as any);
    const handler = await getHandler();
    const data = await (await handler()).json();
    expect(data[0]._count.posts).toBe(5);
    expect(data[1]._count.posts).toBe(3);
  });
});

describe('POST /api/tags', () => {
  beforeEach(() => vi.clearAllMocks());

  it('应成功创建标签并返回 201（管理员）', async () => {
    vi.mocked(requireAdmin).mockResolvedValue({ user: { id: 'admin-1' } } as any);
    vi.mocked(createTag).mockResolvedValue({ id: '1', name: '新标签', slug: '新标签' } as any);

    const handler = await postHandler();
    const res = await handler(new Request('http://localhost:3000/api/tags', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: '新标签' }),
    }));
    expect(res.status).toBe(201);
  });

  it('应拒绝非管理员请求并返回 403', async () => {
    vi.mocked(requireAdmin).mockRejectedValue(new Error('FORBIDDEN'));

    const handler = await postHandler();
    const res = await handler(new Request('http://localhost:3000/api/tags', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: '新标签' }),
    }));
    expect(res.status).toBe(403);
  });

  it('应拒绝空标签名并返回 400', async () => {
    vi.mocked(requireAdmin).mockResolvedValue({ user: { id: 'admin-1' } } as any);

    const handler = await postHandler();
    const res = await handler(new Request('http://localhost:3000/api/tags', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: '' }),
    }));
    expect(res.status).toBe(400);
  });

  it('应返回 409 给重复标签', async () => {
    vi.mocked(requireAdmin).mockResolvedValue({ user: { id: 'admin-1' } } as any);
    vi.mocked(createTag).mockRejectedValue(new Error('标签已存在'));

    const handler = await postHandler();
    const res = await handler(new Request('http://localhost:3000/api/tags', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: '已存在' }),
    }));
    expect(res.status).toBe(409);
  });

  it('应拒绝非字符串 name 并返回 400', async () => {
    vi.mocked(requireAdmin).mockResolvedValue({ user: { id: 'admin-1' } } as any);

    const handler = await postHandler();
    const res = await handler(new Request('http://localhost:3000/api/tags', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: 123 }),
    }));
    expect(res.status).toBe(400);
  });

  it('应拒绝空 name 对象并返回 400', async () => {
    vi.mocked(requireAdmin).mockResolvedValue({ user: { id: 'admin-1' } } as any);

    const handler = await postHandler();
    const res = await handler(new Request('http://localhost:3000/api/tags', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: null }),
    }));
    expect(res.status).toBe(400);
  });
});

describe('DELETE /api/tags', () => {
  beforeEach(() => vi.clearAllMocks());

  it('应成功删除标签（管理员）', async () => {
    vi.mocked(requireAdmin).mockResolvedValue({ user: { id: 'admin-1' } } as any);
    vi.mocked(deleteTag).mockResolvedValue(undefined as any);

    const handler = await deleteHandler();
    const res = await handler(new Request('http://localhost:3000/api/tags?id=tag-1'));
    expect(res.status).toBe(200);
  });

  it('应拒绝非管理员请求并返回 403', async () => {
    vi.mocked(requireAdmin).mockRejectedValue(new Error('FORBIDDEN'));

    const handler = await deleteHandler();
    const res = await handler(new Request('http://localhost:3000/api/tags?id=tag-1'));
    expect(res.status).toBe(403);
  });

  it('应拒绝缺少 ID 的请求并返回 400', async () => {
    vi.mocked(requireAdmin).mockResolvedValue({ user: { id: 'admin-1' } } as any);

    const handler = await deleteHandler();
    const res = await handler(new Request('http://localhost:3000/api/tags'));
    expect(res.status).toBe(400);
  });

  it('应拒绝空字符串 ID 并返回 400', async () => {
    vi.mocked(requireAdmin).mockResolvedValue({ user: { id: 'admin-1' } } as any);

    const handler = await deleteHandler();
    const res = await handler(new Request('http://localhost:3000/api/tags?id='));
    expect(res.status).toBe(400);
  });
});
