// @vitest-environment node
import { describe, it, expect, vi, beforeEach } from 'vitest';

// Mock service layer
vi.mock('@/services/post.service', () => ({
  listPosts: vi.fn(),
  getPostBySlug: vi.fn(),
  createPost: vi.fn(),
  updatePost: vi.fn(),
  deletePost: vi.fn(),
  updateViewCount: vi.fn().mockResolvedValue(undefined),
}));

// Mock auth helpers
vi.mock('@/lib/auth-helpers', () => ({
  requireAuth: vi.fn(),
  requireAdmin: vi.fn(),
}));

// Mock validation schema to test real validation
vi.mock('@/lib/validations', () => ({
  postSchema: {
    parse: vi.fn((data) => {
      if (!data.title) throw Object.assign(new Error('Validation error'), { issues: [{ path: ['title'], message: '标题不能为空' }] });
      if (data.title.length > 200) throw Object.assign(new Error('Validation error'), { issues: [{ path: ['title'], message: '标题过长' }] });
      if (!data.content) throw Object.assign(new Error('Validation error'), { issues: [{ path: ['content'], message: '内容不能为空' }] });
      return data;
    }),
    safeParse: vi.fn((data) => {
      if (!data.title) return { success: false, error: { issues: [{ path: ['title'], message: '标题不能为空' }] } };
      if (!data.content) return { success: false, error: { issues: [{ path: ['content'], message: '内容不能为空' }] } };
      return { success: true, data };
    }),
  },
}));

import { listPosts, getPostBySlug, createPost, updatePost, deletePost } from '@/services/post.service';
import { requireAuth, requireAdmin } from '@/lib/auth-helpers';

const mockPost = {
  id: 'post-1',
  title: '测试文章',
  slug: '测试文章',
  content: '# 内容',
  excerpt: null,
  coverImage: null,
  published: true,
  featured: false,
  viewCount: 0,
  createdAt: new Date('2026-05-03'),
  updatedAt: new Date('2026-05-03'),
  publishedAt: new Date('2026-05-03'),
  authorId: 'user-1',
  author: { id: 'user-1', name: '作者', email: 'author@test.com', image: null },
  tags: [],
  _count: { comments: 0 },
};

async function getHandler() {
  const { GET } = await import('@/app/api/posts/route');
  return GET;
}

async function postHandler() {
  const { POST } = await import('@/app/api/posts/route');
  return POST;
}

// eslint-disable-next-line @typescript-eslint/no-unused-vars
async function getBySlugHandler() {
  const mod = await import('@/app/api/posts/[slug]/route');
  return { GET: mod.GET, PATCH: mod.PATCH, DELETE: mod.DELETE };
}

describe('GET /api/posts', () => {
  beforeEach(() => vi.clearAllMocks());

  it('应返回已发布文章列表（分页）', async () => {
    vi.mocked(listPosts).mockResolvedValue({
      posts: [mockPost], total: 1, page: 1, pageSize: 10, totalPages: 1,
    });
    const handler = await getHandler();
    const res = await handler(new Request('http://localhost:3000/api/posts'));
    const data = await res.json();
    expect(res.status).toBe(200);
    expect(data.posts).toHaveLength(1);
    expect(data.total).toBe(1);
  });

  it('空结果应返回空数组', async () => {
    vi.mocked(listPosts).mockResolvedValue({
      posts: [], total: 0, page: 1, pageSize: 10, totalPages: 0,
    });
    const handler = await getHandler();
    const res = await handler(new Request('http://localhost:3000/api/posts'));
    const data = await res.json();
    expect(data.posts).toEqual([]);
    expect(data.total).toBe(0);
  });

  it('应传递标签筛选参数', async () => {
    vi.mocked(listPosts).mockResolvedValue({
      posts: [mockPost], total: 1, page: 1, pageSize: 10, totalPages: 1,
    });
    const handler = await getHandler();
    await handler(new Request('http://localhost:3000/api/posts?tag=javascript'));
    expect(listPosts).toHaveBeenCalledWith(expect.objectContaining({ tag: 'javascript' }));
  });

  it('应传递搜索参数', async () => {
    vi.mocked(listPosts).mockResolvedValue({
      posts: [mockPost], total: 1, page: 1, pageSize: 10, totalPages: 1,
    });
    const handler = await getHandler();
    await handler(new Request('http://localhost:3000/api/posts?search=react'));
    expect(listPosts).toHaveBeenCalledWith(expect.objectContaining({ search: 'react' }));
  });
});

describe('POST /api/posts', () => {
  beforeEach(() => vi.clearAllMocks());

  it('应成功创建文章并返回 201（管理员）', async () => {
    vi.mocked(requireAdmin).mockResolvedValue({ user: { id: 'admin-1' } } as any);
    vi.mocked(requireAuth).mockResolvedValue({ user: { id: 'admin-1' } } as any);
    vi.mocked(createPost).mockResolvedValue(mockPost as any);

    const handler = await postHandler();
    const res = await handler(new Request('http://localhost:3000/api/posts', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ title: '新文章', content: '# 内容', published: true }),
    }));
    const data = await res.json();
    expect(res.status).toBe(201);
    expect(data.title).toBe('测试文章');
  });

  it('应拒绝非管理员请求并返回 403', async () => {
    vi.mocked(requireAdmin).mockRejectedValue(new Error('FORBIDDEN'));

    const handler = await postHandler();
    const res = await handler(new Request('http://localhost:3000/api/posts', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ title: '新文章', content: '# 内容' }),
    }));
    expect(res.status).toBe(403);
  });

  it('应拒绝空标题并返回 400', async () => {
    vi.mocked(requireAdmin).mockResolvedValue({ user: { id: 'admin-1' } } as any);

    const handler = await postHandler();
    const res = await handler(new Request('http://localhost:3000/api/posts', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ title: '', content: '内容' }),
    }));
    expect(res.status).toBe(400);
  });
});

describe('GET /api/posts/[slug]', () => {
  beforeEach(() => vi.clearAllMocks());

  it('应返回已发布文章详情', async () => {
    vi.mocked(getPostBySlug).mockResolvedValue(mockPost as any);
    const { GET } = await getBySlugHandler();
    const res = await GET(new Request('http://localhost:3000/api/posts/test-post'), {
      params: Promise.resolve({ slug: 'test-post' }),
    } as any);
    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data.title).toBe('测试文章');
  });

  it('应返回 404 给不存在的文章', async () => {
    vi.mocked(getPostBySlug).mockResolvedValue(null);
    const { GET } = await getBySlugHandler();
    const res = await GET(new Request('http://localhost:3000/api/posts/nonexistent'), {
      params: Promise.resolve({ slug: 'nonexistent' }),
    } as any);
    expect(res.status).toBe(404);
  });
});

describe('PATCH /api/posts/[slug]', () => {
  beforeEach(() => vi.clearAllMocks());

  it('应成功更新文章（管理员）', async () => {
    vi.mocked(requireAdmin).mockResolvedValue({ user: { id: 'admin-1' } } as any);
    vi.mocked(getPostBySlug).mockResolvedValue(mockPost as any);
    vi.mocked(updatePost).mockResolvedValue({ ...mockPost, title: '更新标题' } as any);

    const { PATCH } = await getBySlugHandler();
    const res = await PATCH(new Request('http://localhost:3000/api/posts/test-post', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ title: '更新标题' }),
    }), { params: Promise.resolve({ slug: 'test-post' }) } as any);
    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data.title).toBe('更新标题');
  });

  it('应拒绝非管理员请求并返回 403', async () => {
    vi.mocked(requireAdmin).mockRejectedValue(new Error('FORBIDDEN'));
    const { PATCH } = await getBySlugHandler();
    const res = await PATCH(new Request('http://localhost:3000/api/posts/test-post'), {
      params: Promise.resolve({ slug: 'test-post' }),
    } as any);
    expect(res.status).toBe(403);
  });

  it('应返回 404 给不存在的文章', async () => {
    vi.mocked(requireAdmin).mockResolvedValue({ user: { id: 'admin-1' } } as any);
    vi.mocked(getPostBySlug).mockResolvedValue(null);
    const { PATCH } = await getBySlugHandler();
    const res = await PATCH(new Request('http://localhost:3000/api/posts/test-post'), {
      params: Promise.resolve({ slug: 'test-post' }),
    } as any);
    expect(res.status).toBe(404);
  });
});

describe('DELETE /api/posts/[slug]', () => {
  beforeEach(() => vi.clearAllMocks());

  it('应成功删除文章（管理员）', async () => {
    vi.mocked(requireAdmin).mockResolvedValue({ user: { id: 'admin-1' } } as any);
    vi.mocked(getPostBySlug).mockResolvedValue(mockPost as any);
    vi.mocked(deletePost).mockResolvedValue(undefined as any);

    const { DELETE } = await getBySlugHandler();
    const res = await DELETE(new Request('http://localhost:3000/api/posts/test-post'), {
      params: Promise.resolve({ slug: 'test-post' }),
    } as any);
    expect(res.status).toBe(200);
  });

  it('应拒绝非管理员请求并返回 403', async () => {
    vi.mocked(requireAdmin).mockRejectedValue(new Error('FORBIDDEN'));
    const { DELETE } = await getBySlugHandler();
    const res = await DELETE(new Request('http://localhost:3000/api/posts/test-post'), {
      params: Promise.resolve({ slug: 'test-post' }),
    } as any);
    expect(res.status).toBe(403);
  });
});
