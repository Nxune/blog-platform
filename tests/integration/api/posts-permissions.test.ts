// @vitest-environment node
import { describe, it, expect, vi, beforeEach } from 'vitest';

// Mock post service
vi.mock('@/services/post.service', () => ({
  listPosts: vi.fn(),
  getPostBySlug: vi.fn(),
  createPost: vi.fn(),
  updatePost: vi.fn(),
  deletePost: vi.fn(),
  updateViewCount: vi.fn().mockResolvedValue(undefined),
}));

// Mock auth helpers — use requireOwner and requireAuth for permission tests
vi.mock('@/lib/auth-helpers', () => ({
  requireAuth: vi.fn(),
  requireOwner: vi.fn(),
}));

// Mock validations to pass through
vi.mock('@/lib/validations', () => ({
  postSchema: {
    parse: vi.fn((data) => data),
  },
}));

import {
  getPostBySlug,
  createPost,
  updatePost,
  deletePost,
} from '@/services/post.service';
import { requireAuth, requireOwner } from '@/lib/auth-helpers';

// ── Shared test data ──
const userOwnPost = {
  id: 'post-1',
  title: '我自己的文章',
  slug: 'my-post',
  content: '# Content',
  excerpt: null,
  coverImage: null,
  published: false,
  featured: false,
  viewCount: 0,
  createdAt: new Date('2026-05-03'),
  updatedAt: new Date('2026-05-03'),
  publishedAt: null,
  authorId: 'user-1',
  author: { id: 'user-1', name: 'User', email: 'user@test.com', image: null },
  tags: [],
  _count: { comments: 0 },
};

const otherUsersPost = {
  ...userOwnPost,
  id: 'post-2',
  title: '他人的文章',
  slug: 'other-post',
  authorId: 'user-2',
  author: { id: 'user-2', name: 'Other', email: 'other@test.com', image: null },
};

// ── Handlers ──
async function handlers() {
  const postsRoute = await import('@/app/api/posts/route');
  const slugRoute = await import('@/app/api/posts/[slug]/route');
  return {
    POST: postsRoute.POST,
    PATCH: slugRoute.PATCH,
    DELETE: slugRoute.DELETE,
  };
}

describe('POST /api/posts — 文章创建权限', () => {
  beforeEach(() => vi.clearAllMocks());

  it('已登录用户（普通用户）应能创建文章', async () => {
    vi.mocked(requireAuth).mockResolvedValue({
      user: { id: 'user-1', role: 'USER' },
    } as any);
    vi.mocked(createPost).mockResolvedValue(userOwnPost as any);

    const { POST } = await handlers();
    const res = await POST(
      new Request('http://localhost:3000/api/posts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title: '新文章', content: '# Content' }),
      })
    );
    expect(res.status).toBe(201);
  });

  it('未登录用户应被拒绝创建文章（401）', async () => {
    vi.mocked(requireAuth).mockRejectedValue(new Error('UNAUTHORIZED'));

    const { POST } = await handlers();
    const res = await POST(
      new Request('http://localhost:3000/api/posts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title: '新文章', content: '# Content' }),
      })
    );
    expect(res.status).toBe(401);
    const data = await res.json();
    expect(data.error).toBe('请先登录');
  });
});

describe('PATCH /api/posts/[slug] — 文章更新权限', () => {
  beforeEach(() => vi.clearAllMocks());

  it('普通用户应能更新自己的文章', async () => {
    vi.mocked(getPostBySlug).mockResolvedValue(userOwnPost as any);
    vi.mocked(requireOwner).mockResolvedValue({
      user: { id: 'user-1', role: 'USER' },
    } as any);
    vi.mocked(updatePost).mockResolvedValue({
      ...userOwnPost,
      title: '已更新的标题',
    } as any);

    const { PATCH } = await handlers();
    const res = await PATCH(
      new Request('http://localhost:3000/api/posts/my-post', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title: '已更新的标题' }),
      }),
      { params: Promise.resolve({ slug: 'my-post' }) } as any
    );
    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data.title).toBe('已更新的标题');
  });

  it('管理员应能更新任何人的文章', async () => {
    vi.mocked(getPostBySlug).mockResolvedValue(otherUsersPost as any);
    vi.mocked(requireOwner).mockResolvedValue({
      user: { id: 'admin-1', role: 'ADMIN' },
    } as any);
    vi.mocked(updatePost).mockResolvedValue({
      ...otherUsersPost,
      title: '管理员更新了他人文章',
    } as any);

    const { PATCH } = await handlers();
    const res = await PATCH(
      new Request('http://localhost:3000/api/posts/other-post', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title: '管理员更新了他人文章' }),
      }),
      { params: Promise.resolve({ slug: 'other-post' }) } as any
    );
    expect(res.status).toBe(200);
  });

  it('普通用户应不能更新他人的文章（403）', async () => {
    vi.mocked(getPostBySlug).mockResolvedValue(otherUsersPost as any);
    vi.mocked(requireOwner).mockRejectedValue(new Error('FORBIDDEN'));

    const { PATCH } = await handlers();
    const res = await PATCH(
      new Request('http://localhost:3000/api/posts/other-post', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title: '想偷改别人的文章' }),
      }),
      { params: Promise.resolve({ slug: 'other-post' }) } as any
    );
    expect(res.status).toBe(403);
  });

  it('更新不存在的文章应返回 404', async () => {
    vi.mocked(getPostBySlug).mockResolvedValue(null);

    const { PATCH } = await handlers();
    const res = await PATCH(
      new Request('http://localhost:3000/api/posts/nonexistent', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title: 'N/A' }),
      }),
      { params: Promise.resolve({ slug: 'nonexistent' }) } as any
    );
    expect(res.status).toBe(404);
  });
});

describe('DELETE /api/posts/[slug] — 文章删除权限', () => {
  beforeEach(() => vi.clearAllMocks());

  it('普通用户应能删除自己的文章', async () => {
    vi.mocked(getPostBySlug).mockResolvedValue(userOwnPost as any);
    vi.mocked(requireOwner).mockResolvedValue({
      user: { id: 'user-1', role: 'USER' },
    } as any);

    const { DELETE } = await handlers();
    const res = await DELETE(
      new Request('http://localhost:3000/api/posts/my-post'),
      { params: Promise.resolve({ slug: 'my-post' }) } as any
    );
    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data.success).toBe(true);
    expect(deletePost).toHaveBeenCalledWith('post-1');
  });

  it('管理员应能删除任何人的文章', async () => {
    vi.mocked(getPostBySlug).mockResolvedValue(otherUsersPost as any);
    vi.mocked(requireOwner).mockResolvedValue({
      user: { id: 'admin-1', role: 'ADMIN' },
    } as any);

    const { DELETE } = await handlers();
    const res = await DELETE(
      new Request('http://localhost:3000/api/posts/other-post'),
      { params: Promise.resolve({ slug: 'other-post' }) } as any
    );
    expect(res.status).toBe(200);
    expect(deletePost).toHaveBeenCalledWith('post-2');
  });

  it('普通用户应不能删除他人的文章（403）', async () => {
    vi.mocked(getPostBySlug).mockResolvedValue(otherUsersPost as any);
    vi.mocked(requireOwner).mockRejectedValue(new Error('FORBIDDEN'));

    const { DELETE } = await handlers();
    const res = await DELETE(
      new Request('http://localhost:3000/api/posts/other-post'),
      { params: Promise.resolve({ slug: 'other-post' }) } as any
    );
    expect(res.status).toBe(403);
    expect(deletePost).not.toHaveBeenCalled();
  });

  it('删除不存在的文章应返回 404', async () => {
    vi.mocked(getPostBySlug).mockResolvedValue(null);

    const { DELETE } = await handlers();
    const res = await DELETE(
      new Request('http://localhost:3000/api/posts/nonexistent'),
      { params: Promise.resolve({ slug: 'nonexistent' }) } as any
    );
    expect(res.status).toBe(404);
  });
});
