// @vitest-environment node
import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('@/services/post.service', () => ({
  listPosts: vi.fn(),
}));

import { listPosts } from '@/services/post.service';

const mockPost = {
  id: 'post-1',
  title: 'React 教程',
  slug: 'react-tutorial',
  content: '# React',
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

async function searchHandler() {
  const { GET } = await import('@/app/api/search/route');
  return GET;
}

describe('GET /api/search', () => {
  beforeEach(() => vi.clearAllMocks());

  it('应返回搜索结果', async () => {
    vi.mocked(listPosts).mockResolvedValue({
      posts: [mockPost], total: 1, page: 1, pageSize: 10, totalPages: 1,
    });
    const handler = await searchHandler();
    const res = await handler(new Request('http://localhost:3000/api/search?q=react'));
    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data.posts).toHaveLength(1);
    expect(listPosts).toHaveBeenCalledWith(expect.objectContaining({
      search: 'react', published: true,
    }));
  });

  it('空查询应返回空结果', async () => {
    const handler = await searchHandler();
    const res = await handler(new Request('http://localhost:3000/api/search?q='));
    const data = await res.json();
    expect(data.posts).toEqual([]);
    expect(data.total).toBe(0);
    expect(listPosts).not.toHaveBeenCalled();
  });

  it('空白查询应返回空结果', async () => {
    const handler = await searchHandler();
    const res = await handler(new Request('http://localhost:3000/api/search?q=   '));
    const data = await res.json();
    expect(data.posts).toEqual([]);
    expect(listPosts).not.toHaveBeenCalled();
  });

  it('应传递分页参数', async () => {
    vi.mocked(listPosts).mockResolvedValue({
      posts: [], total: 0, page: 2, pageSize: 10, totalPages: 0,
    });
    const handler = await searchHandler();
    await handler(new Request('http://localhost:3000/api/search?q=react&page=2'));
    expect(listPosts).toHaveBeenCalledWith(expect.objectContaining({ page: 2 }));
  });

  it('搜索无结果应返回空数组', async () => {
    vi.mocked(listPosts).mockResolvedValue({
      posts: [], total: 0, page: 1, pageSize: 10, totalPages: 0,
    });
    const handler = await searchHandler();
    const res = await handler(new Request('http://localhost:3000/api/search?q=nonexistent'));
    const data = await res.json();
    expect(data.posts).toEqual([]);
    expect(data.total).toBe(0);
  });

  it('应始终仅搜索已发布文章', async () => {
    vi.mocked(listPosts).mockResolvedValue({
      posts: [], total: 0, page: 1, pageSize: 10, totalPages: 0,
    });
    const handler = await searchHandler();
    await handler(new Request('http://localhost:3000/api/search?q=react'));
    expect(listPosts).toHaveBeenCalledWith(expect.objectContaining({ published: true }));
  });

  it('应正确处理特殊字符查询', async () => {
    vi.mocked(listPosts).mockResolvedValue({
      posts: [], total: 0, page: 1, pageSize: 10, totalPages: 0,
    });
    const handler = await searchHandler();
    await handler(new Request('http://localhost:3000/api/search?q=C%23+%26+.NET'));
    expect(listPosts).toHaveBeenCalledWith(expect.objectContaining({ search: 'C# & .NET' }));
  });

  it('应处理 URL 编码的中文查询', async () => {
    vi.mocked(listPosts).mockResolvedValue({
      posts: [], total: 0, page: 1, pageSize: 10, totalPages: 0,
    });
    const handler = await searchHandler();
    await handler(new Request('http://localhost:3000/api/search?q=%E6%90%9C%E7%B4%A2'));
    expect(listPosts).toHaveBeenCalledWith(expect.objectContaining({ search: '搜索' }));
  });

  it('缺少 q 参数应返回空结果', async () => {
    const handler = await searchHandler();
    const res = await handler(new Request('http://localhost:3000/api/search'));
    const data = await res.json();
    expect(data.posts).toEqual([]);
    expect(data.total).toBe(0);
    expect(listPosts).not.toHaveBeenCalled();
  });

  it('应使用默认分页', async () => {
    vi.mocked(listPosts).mockResolvedValue({
      posts: [], total: 0, page: 1, pageSize: 10, totalPages: 0,
    });
    const handler = await searchHandler();
    await handler(new Request('http://localhost:3000/api/search?q=react'));
    expect(listPosts).toHaveBeenCalledWith(expect.objectContaining({ page: 1, pageSize: 10 }));
  });
});
