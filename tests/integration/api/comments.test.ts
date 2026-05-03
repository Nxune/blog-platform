// @vitest-environment node
import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('@/services/comment.service', () => ({
  getCommentsByPostSlug: vi.fn(),
  createComment: vi.fn(),
  deleteComment: vi.fn(),
  listAllComments: vi.fn(),
  moderateComment: vi.fn(),
  getCommentById: vi.fn(),
}));

vi.mock('@/lib/auth-helpers', () => ({
  requireAuth: vi.fn(),
  requireAdmin: vi.fn(),
  requireOwner: vi.fn(),
}));

vi.mock('@/lib/validations', () => ({
  commentSchema: {
    safeParse: vi.fn((data) => {
      if (!data.content) return { success: false };
      if (data.content.length > 5000) return { success: false };
      return { success: true, data };
    }),
  },
}));

import { getCommentsByPostSlug, createComment, deleteComment, listAllComments, moderateComment, getCommentById } from '@/services/comment.service';
import { requireAuth, requireAdmin, requireOwner } from '@/lib/auth-helpers';

const mockComment = {
  id: 'comment-1',
  content: '测试评论',
  createdAt: new Date(),
  updatedAt: new Date(),
  authorId: 'user-1',
  author: { id: 'user-1', name: '用户', email: 'user@test.com', image: null },
  postId: 'post-1',
  parentId: null,
  status: 'APPROVED',
};

async function getPostCommentsHandler() {
  const { GET } = await import('@/app/api/posts/[slug]/comments/route');
  return GET;
}

async function postCommentHandler() {
  const { POST } = await import('@/app/api/posts/[slug]/comments/route');
  return POST;
}

async function getAllCommentsHandler() {
  const { GET } = await import('@/app/api/comments/route');
  return GET;
}

async function deleteCommentHandler() {
  const { DELETE } = await import('@/app/api/comments/[id]/route');
  return DELETE;
}

async function moderateCommentHandler() {
  const { PATCH } = await import('@/app/api/comments/[id]/status/route');
  return PATCH;
}

describe('GET /api/posts/[slug]/comments', () => {
  beforeEach(() => vi.clearAllMocks());

  it('应返回文章评论列表', async () => {
    vi.mocked(getCommentsByPostSlug).mockResolvedValue([mockComment, { ...mockComment, id: 'comment-2' }] as any);
    const handler = await getPostCommentsHandler();
    const res = await handler(new Request('http://localhost:3000/api/posts/test-post/comments'), {
      params: Promise.resolve({ slug: 'test-post' }),
    } as any);
    const data = await res.json();
    expect(res.status).toBe(200);
    expect(data.comments).toHaveLength(2);
  });

  it('应返回 404 给不存在的文章', async () => {
    vi.mocked(getCommentsByPostSlug).mockRejectedValue(new Error('NOT_FOUND'));
    const handler = await getPostCommentsHandler();
    const res = await handler(new Request('http://localhost:3000/api/posts/nonexistent/comments'), {
      params: Promise.resolve({ slug: 'nonexistent' }),
    } as any);
    expect(res.status).toBe(404);
  });

  it('无评论时应返回空数组', async () => {
    vi.mocked(getCommentsByPostSlug).mockResolvedValue([]);
    const handler = await getPostCommentsHandler();
    const res = await handler(new Request('http://localhost:3000/api/posts/empty-post/comments'), {
      params: Promise.resolve({ slug: 'empty-post' }),
    } as any);
    const data = await res.json();
    expect(data.comments).toEqual([]);
  });
});

describe('POST /api/posts/[slug]/comments', () => {
  beforeEach(() => vi.clearAllMocks());

  it('应成功发表评论并返回 201', async () => {
    vi.mocked(requireAuth).mockResolvedValue({ user: { id: 'user-1' } } as any);
    vi.mocked(createComment).mockResolvedValue(mockComment as any);

    const handler = await postCommentHandler();
    const res = await handler(new Request('http://localhost:3000/api/posts/test-post/comments', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ content: '测试评论' }),
    }), { params: Promise.resolve({ slug: 'test-post' }) } as any);
    expect(res.status).toBe(201);
  });

  it('应成功发表含特殊字符的评论', async () => {
    vi.mocked(requireAuth).mockResolvedValue({ user: { id: 'user-1' } } as any);
    vi.mocked(createComment).mockResolvedValue({ ...mockComment, content: '🔥 ❤️ 👨‍👩‍👧‍👦 & <test>' } as any);

    const handler = await postCommentHandler();
    const res = await handler(new Request('http://localhost:3000/api/posts/test-post/comments', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ content: '🔥 ❤️ 👨‍👩‍👧‍👦 & <test>' }),
    }), { params: Promise.resolve({ slug: 'test-post' }) } as any);
    expect(res.status).toBe(201);
  });

  it('应拒绝未认证请求并返回 401', async () => {
    vi.mocked(requireAuth).mockRejectedValue(new Error('UNAUTHORIZED'));

    const handler = await postCommentHandler();
    const res = await handler(new Request('http://localhost:3000/api/posts/test-post/comments', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ content: '评论' }),
    }), { params: Promise.resolve({ slug: 'test-post' }) } as any);
    expect(res.status).toBe(401);
  });

  it('应拒绝空评论并返回 400', async () => {
    vi.mocked(requireAuth).mockResolvedValue({ user: { id: 'user-1' } } as any);

    const handler = await postCommentHandler();
    const res = await handler(new Request('http://localhost:3000/api/posts/test-post/comments', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ content: '' }),
    }), { params: Promise.resolve({ slug: 'test-post' }) } as any);
    expect(res.status).toBe(400);
  });

  it('应成功回复已存在的评论', async () => {
    vi.mocked(requireAuth).mockResolvedValue({ user: { id: 'user-1' } } as any);
    vi.mocked(createComment).mockResolvedValue({ ...mockComment, parentId: 'parent-1' } as any);

    const handler = await postCommentHandler();
    const res = await handler(new Request('http://localhost:3000/api/posts/test-post/comments', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ content: '回复内容', parentId: 'parent-1' }),
    }), { params: Promise.resolve({ slug: 'test-post' }) } as any);
    expect(res.status).toBe(201);
    expect(createComment).toHaveBeenCalledWith(expect.objectContaining({ parentId: 'parent-1' }));
  });

  it('应拒绝为不存在文章添加评论并返回 404', async () => {
    vi.mocked(requireAuth).mockResolvedValue({ user: { id: 'user-1' } } as any);
    vi.mocked(createComment).mockRejectedValue(new Error('POST_NOT_FOUND'));

    const handler = await postCommentHandler();
    const res = await handler(new Request('http://localhost:3000/api/posts/nonexistent/comments', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ content: '评论' }),
    }), { params: Promise.resolve({ slug: 'nonexistent' }) } as any);
    expect(res.status).toBe(404);
  });

  it('应拒绝回复不存在的父评论并返回 400', async () => {
    vi.mocked(requireAuth).mockResolvedValue({ user: { id: 'user-1' } } as any);
    vi.mocked(createComment).mockRejectedValue(new Error('PARENT_NOT_FOUND'));

    const handler = await postCommentHandler();
    const res = await handler(new Request('http://localhost:3000/api/posts/test-post/comments', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ content: '回复', parentId: 'bad-parent' }),
    }), { params: Promise.resolve({ slug: 'test-post' }) } as any);
    expect(res.status).toBe(400);
  });

  it('应拒绝超长评论并返回 400', async () => {
    vi.mocked(requireAuth).mockResolvedValue({ user: { id: 'user-1' } } as any);

    const handler = await postCommentHandler();
    const res = await handler(new Request('http://localhost:3000/api/posts/test-post/comments', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ content: 'x'.repeat(5001) }),
    }), { params: Promise.resolve({ slug: 'test-post' }) } as any);
    expect(res.status).toBe(400);
  });
});

describe('GET /api/comments（管理员）', () => {
  beforeEach(() => vi.clearAllMocks());

  it('应返回所有评论列表', async () => {
    vi.mocked(requireAdmin).mockResolvedValue({ user: { id: 'admin-1', role: 'ADMIN' } } as any);
    vi.mocked(listAllComments).mockResolvedValue({
      comments: [mockComment], total: 1, page: 1, pageSize: 20, totalPages: 1,
    });

    const handler = await getAllCommentsHandler();
    const res = await handler(new Request('http://localhost:3000/api/comments'));
    expect(res.status).toBe(200);
  });

  it('应拒绝非管理员并返回 403', async () => {
    vi.mocked(requireAdmin).mockRejectedValue(new Error('FORBIDDEN'));

    const handler = await getAllCommentsHandler();
    const res = await handler(new Request('http://localhost:3000/api/comments'));
    expect(res.status).toBe(403);
  });

  it('应支持分页参数', async () => {
    vi.mocked(requireAdmin).mockResolvedValue({ user: { id: 'admin-1', role: 'ADMIN' } } as any);
    vi.mocked(listAllComments).mockResolvedValue({
      comments: [], total: 0, page: 2, pageSize: 10, totalPages: 0,
    });

    const handler = await getAllCommentsHandler();
    await handler(new Request('http://localhost:3000/api/comments?page=2&pageSize=10'));
    expect(listAllComments).toHaveBeenCalledWith(expect.objectContaining({ page: 2, pageSize: 10 }));
  });

  it('应支持按状态筛选', async () => {
    vi.mocked(requireAdmin).mockResolvedValue({ user: { id: 'admin-1', role: 'ADMIN' } } as any);
    vi.mocked(listAllComments).mockResolvedValue({
      comments: [], total: 0, page: 1, pageSize: 20, totalPages: 0,
    });

    const handler = await getAllCommentsHandler();
    await handler(new Request('http://localhost:3000/api/comments?status=PENDING'));
    expect(listAllComments).toHaveBeenCalledWith(expect.objectContaining({ status: 'PENDING' }));
  });

  it('应使用默认分页参数', async () => {
    vi.mocked(requireAdmin).mockResolvedValue({ user: { id: 'admin-1', role: 'ADMIN' } } as any);
    vi.mocked(listAllComments).mockResolvedValue({
      comments: [], total: 0, page: 1, pageSize: 20, totalPages: 0,
    });

    const handler = await getAllCommentsHandler();
    await handler(new Request('http://localhost:3000/api/comments'));
    expect(listAllComments).toHaveBeenCalledWith(expect.objectContaining({ page: 1, pageSize: 20 }));
  });
});

describe('DELETE /api/comments/[id]（所有者或管理员）', () => {
  beforeEach(() => vi.clearAllMocks());

  it('评论作者应能删除自己的评论', async () => {
    vi.mocked(getCommentById).mockResolvedValue({ id: 'comment-1', authorId: 'user-1' } as any);
    vi.mocked(requireOwner).mockResolvedValue({ user: { id: 'user-1', role: 'USER' } } as any);
    vi.mocked(deleteComment).mockResolvedValue(undefined as any);

    const handler = await deleteCommentHandler();
    const res = await handler(new Request('http://localhost:3000/api/comments/comment-1'), {
      params: Promise.resolve({ id: 'comment-1' }),
    } as any);
    expect(res.status).toBe(200);
  });

  it('管理员应能删除任何评论', async () => {
    vi.mocked(getCommentById).mockResolvedValue({ id: 'comment-2', authorId: 'user-2' } as any);
    vi.mocked(requireOwner).mockResolvedValue({ user: { id: 'admin-1', role: 'ADMIN' } } as any);
    vi.mocked(deleteComment).mockResolvedValue(undefined as any);

    const handler = await deleteCommentHandler();
    const res = await handler(new Request('http://localhost:3000/api/comments/comment-2'), {
      params: Promise.resolve({ id: 'comment-2' }),
    } as any);
    expect(res.status).toBe(200);
  });

  it('应拒绝非所有者非管理员并返回 403', async () => {
    vi.mocked(getCommentById).mockResolvedValue({ id: 'comment-1', authorId: 'user-1' } as any);
    vi.mocked(requireOwner).mockRejectedValue(new Error('FORBIDDEN'));

    const handler = await deleteCommentHandler();
    const res = await handler(new Request('http://localhost:3000/api/comments/comment-1'), {
      params: Promise.resolve({ id: 'comment-1' }),
    } as any);
    expect(res.status).toBe(403);
  });

  it('删除不存在的评论应返回 404', async () => {
    vi.mocked(getCommentById).mockResolvedValue(null);

    const handler = await deleteCommentHandler();
    const res = await handler(new Request('http://localhost:3000/api/comments/nonexistent'), {
      params: Promise.resolve({ id: 'nonexistent' }),
    } as any);
    expect(res.status).toBe(404);
  });
});

describe('PATCH /api/comments/[id]/status（审核评论）', () => {
  beforeEach(() => vi.clearAllMocks());

  it('应成功审核评论状态（管理员）', async () => {
    vi.mocked(requireAdmin).mockResolvedValue({ user: { id: 'admin-1' } } as any);
    vi.mocked(moderateComment).mockResolvedValue({ ...mockComment, status: 'APPROVED' } as any);

    const handler = await moderateCommentHandler();
    const res = await handler(new Request('http://localhost:3000/api/comments/comment-1/status', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: 'APPROVED' }),
    }), { params: Promise.resolve({ id: 'comment-1' }) } as any);
    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data.status).toBe('APPROVED');
  });

  it('应拒绝非管理员并返回 403', async () => {
    vi.mocked(requireAdmin).mockRejectedValue(new Error('FORBIDDEN'));

    const handler = await moderateCommentHandler();
    const res = await handler(new Request('http://localhost:3000/api/comments/comment-1/status', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: 'APPROVED' }),
    }), { params: Promise.resolve({ id: 'comment-1' }) } as any);
    expect(res.status).toBe(403);
  });

  it('应拒绝无效状态值并返回 400', async () => {
    vi.mocked(requireAdmin).mockResolvedValue({ user: { id: 'admin-1' } } as any);

    const handler = await moderateCommentHandler();
    const res = await handler(new Request('http://localhost:3000/api/comments/comment-1/status', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: 'INVALID_STATUS' }),
    }), { params: Promise.resolve({ id: 'comment-1' }) } as any);
    expect(res.status).toBe(400);
  });

  it('应支持标记为 SPAM', async () => {
    vi.mocked(requireAdmin).mockResolvedValue({ user: { id: 'admin-1' } } as any);
    vi.mocked(moderateComment).mockResolvedValue({ ...mockComment, status: 'SPAM' } as any);

    const handler = await moderateCommentHandler();
    const res = await handler(new Request('http://localhost:3000/api/comments/comment-1/status', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: 'SPAM' }),
    }), { params: Promise.resolve({ id: 'comment-1' }) } as any);
    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data.status).toBe('SPAM');
  });

  it('应支持标记为 DELETED', async () => {
    vi.mocked(requireAdmin).mockResolvedValue({ user: { id: 'admin-1' } } as any);
    vi.mocked(moderateComment).mockResolvedValue({ ...mockComment, status: 'DELETED' } as any);

    const handler = await moderateCommentHandler();
    const res = await handler(new Request('http://localhost:3000/api/comments/comment-1/status', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: 'DELETED' }),
    }), { params: Promise.resolve({ id: 'comment-1' }) } as any);
    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data.status).toBe('DELETED');
  });
});
