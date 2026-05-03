// @vitest-environment node
import { describe, it, expect } from 'vitest';
import { loginSchema, registerSchema, postSchema, commentSchema } from '@/lib/validations';

// ============================================================
// 登录验证 Schema
// ============================================================
describe('loginSchema', () => {
  it('应接受有效的登录数据', () => {
    const result = loginSchema.safeParse({
      email: 'user@example.com',
      password: 'password123',
    });
    expect(result.success).toBe(true);
  });

  it('应拒绝无效邮箱', () => {
    const result = loginSchema.safeParse({
      email: 'not-an-email',
      password: 'password123',
    });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0].path).toContain('email');
    }
  });

  it('应拒绝过短的密码（少于 6 字符）', () => {
    const result = loginSchema.safeParse({
      email: 'user@example.com',
      password: '12345',
    });
    expect(result.success).toBe(false);
  });

  it('应拒绝空邮箱', () => {
    const result = loginSchema.safeParse({
      email: '',
      password: 'password123',
    });
    expect(result.success).toBe(false);
  });

  it('应拒绝空密码', () => {
    const result = loginSchema.safeParse({
      email: 'user@example.com',
      password: '',
    });
    expect(result.success).toBe(false);
  });

  it('应拒绝缺失 email 字段', () => {
    const result = loginSchema.safeParse({ password: 'password123' });
    expect(result.success).toBe(false);
  });

  it('应拒绝缺失 password 字段', () => {
    const result = loginSchema.safeParse({ email: 'user@example.com' });
    expect(result.success).toBe(false);
  });

  it('邮箱含首尾空格应被拒绝', () => {
    const result = loginSchema.safeParse({
      email: '  user@example.com  ',
      password: 'password123',
    });
    // Schema 可能不自动 trim，因此应拒绝
    expect(result.success).toBe(false);
  });

  it('应接受含特殊字符的邮箱', () => {
    const result = loginSchema.safeParse({
      email: 'user+tag@example.com',
      password: 'password123',
    });
    expect(result.success).toBe(true);
  });
});

// ============================================================
// 注册验证 Schema
// ============================================================
describe('registerSchema', () => {
  it('应接受有效的注册数据', () => {
    const result = registerSchema.safeParse({
      name: '测试用户',
      email: 'user@example.com',
      password: 'strongPass1',
    });
    expect(result.success).toBe(true);
  });

  it('应拒绝短于 2 字符的用户名', () => {
    const result = registerSchema.safeParse({
      name: 'a',
      email: 'user@example.com',
      password: 'strongPass1',
    });
    expect(result.success).toBe(false);
  });

  it('应拒绝超过 50 字符的用户名', () => {
    const result = registerSchema.safeParse({
      name: 'a'.repeat(51),
      email: 'user@example.com',
      password: 'strongPass1',
    });
    expect(result.success).toBe(false);
  });

  it('应拒绝短于 8 字符的密码', () => {
    const result = registerSchema.safeParse({
      name: '测试用户',
      email: 'user@example.com',
      password: 'short',
    });
    expect(result.success).toBe(false);
  });

  it('应拒绝无效邮箱', () => {
    const result = registerSchema.safeParse({
      name: '测试用户',
      email: 'not-email',
      password: 'strongPass1',
    });
    expect(result.success).toBe(false);
  });

  it('应拒绝空用户名', () => {
    const result = registerSchema.safeParse({
      name: '',
      email: 'user@example.com',
      password: 'strongPass1',
    });
    expect(result.success).toBe(false);
  });

  it('应拒绝空邮箱', () => {
    const result = registerSchema.safeParse({
      name: '测试用户',
      email: '',
      password: 'strongPass1',
    });
    expect(result.success).toBe(false);
  });

  it('应拒绝空密码', () => {
    const result = registerSchema.safeParse({
      name: '测试用户',
      email: 'user@example.com',
      password: '',
    });
    expect(result.success).toBe(false);
  });

  it('应拒绝缺失字段', () => {
    const result = registerSchema.safeParse({});
    expect(result.success).toBe(false);
  });

  it('密码恰好 8 字符应被接受', () => {
    const result = registerSchema.safeParse({
      name: '测试用户',
      email: 'user@example.com',
      password: '8chars!!',
    });
    expect(result.success).toBe(true);
  });

  it('密码仅含字母但仍满足最小长度应被接受', () => {
    const result = registerSchema.safeParse({
      name: '测试用户',
      email: 'user@example.com',
      password: 'OnlyLetters',
    });
    expect(result.success).toBe(true);
  });
});

// ============================================================
// 文章验证 Schema
// ============================================================
describe('postSchema', () => {
  it('应接受有效的文章数据', () => {
    const result = postSchema.safeParse({
      title: '文章标题',
      content: '文章内容',
      published: true,
      tags: ['技术', '前端'],
    });
    expect(result.success).toBe(true);
  });

  it('应拒绝空标题', () => {
    const result = postSchema.safeParse({
      title: '',
      content: '内容',
    });
    expect(result.success).toBe(false);
  });

  it('应拒绝超过 200 字符的标题', () => {
    const result = postSchema.safeParse({
      title: 'x'.repeat(201),
      content: '内容',
    });
    expect(result.success).toBe(false);
  });

  it('应拒绝空内容', () => {
    const result = postSchema.safeParse({
      title: '标题',
      content: '',
    });
    expect(result.success).toBe(false);
  });

  it('应接受可选的 excerpt', () => {
    const result = postSchema.safeParse({
      title: '标题',
      content: '内容',
      excerpt: '摘要',
    });
    expect(result.success).toBe(true);
  });

  it('应拒绝超过 500 字符的 excerpt', () => {
    const result = postSchema.safeParse({
      title: '标题',
      content: '内容',
      excerpt: 'x'.repeat(501),
    });
    expect(result.success).toBe(false);
  });

  it('应接受空的 coverImage 字符串', () => {
    const result = postSchema.safeParse({
      title: '标题',
      content: '内容',
      coverImage: '',
    });
    expect(result.success).toBe(true);
  });

  it('应拒绝无效的 coverImage URL', () => {
    const result = postSchema.safeParse({
      title: '标题',
      content: '内容',
      coverImage: 'not-a-url',
    });
    expect(result.success).toBe(false);
  });

  it('应接受有效的 coverImage URL', () => {
    const result = postSchema.safeParse({
      title: '标题',
      content: '内容',
      coverImage: 'https://example.com/image.jpg',
    });
    expect(result.success).toBe(true);
  });

  it('应接受 featured 为 false', () => {
    const result = postSchema.safeParse({
      title: '标题',
      content: '内容',
      featured: false,
    });
    expect(result.success).toBe(true);
  });

  it('应跳过空的 tags 数组', () => {
    const result = postSchema.safeParse({
      title: '标题',
      content: '内容',
      tags: [],
    });
    expect(result.success).toBe(true);
  });

  it('应拒绝缺失 title 和 content', () => {
    const result = postSchema.safeParse({});
    expect(result.success).toBe(false);
  });

  it('应接受 featured 为 true', () => {
    const result = postSchema.safeParse({
      title: '标题',
      content: '内容',
      featured: true,
    });
    expect(result.success).toBe(true);
  });

  it('应拒绝 coverImage 为 null（仅接受 string 或 undefined）', () => {
    const result = postSchema.safeParse({
      title: '标题',
      content: '内容',
      coverImage: null,
    });
    // coverImage 类型为 string().url().optional().or(literal(""))，不接受 null
    expect(result.success).toBe(false);
  });

  it('应接受 published 为 true', () => {
    const result = postSchema.safeParse({
      title: '标题',
      content: '内容',
      published: true,
    });
    expect(result.success).toBe(true);
  });
});

// ============================================================
// 评论验证 Schema
// ============================================================
describe('commentSchema', () => {
  it('应接受有效的评论数据', () => {
    const result = commentSchema.safeParse({
      content: '这是一条评论',
    });
    expect(result.success).toBe(true);
  });

  it('应拒绝空评论', () => {
    const result = commentSchema.safeParse({
      content: '',
    });
    expect(result.success).toBe(false);
  });

  it('应拒绝超过 5000 字符的评论', () => {
    const result = commentSchema.safeParse({
      content: 'x'.repeat(5001),
    });
    expect(result.success).toBe(false);
  });

  it('应接受带有 parentId 的回复评论', () => {
    const result = commentSchema.safeParse({
      content: '回复内容',
      parentId: 'comment-uuid-123',
    });
    expect(result.success).toBe(true);
  });

  it('应处理只含空格的评论（取决于 schema 实现）', () => {
    const result = commentSchema.safeParse({
      content: '   ',
    });
    // Schema 接受非空字符串，空格算作有效字符
    expect(result.success).toBe(true);
  });

  it('应拒绝缺失 content 字段', () => {
    const result = commentSchema.safeParse({});
    expect(result.success).toBe(false);
  });

  it('应拒绝 null content', () => {
    const result = commentSchema.safeParse({ content: null });
    expect(result.success).toBe(false);
  });

  it('应拒绝极长评论（10001 字符）', () => {
    const result = commentSchema.safeParse({
      content: 'x'.repeat(10001),
    });
    expect(result.success).toBe(false);
  });

  it('应接受恰好 5000 字符的评论', () => {
    const result = commentSchema.safeParse({
      content: 'x'.repeat(5000),
    });
    expect(result.success).toBe(true);
  });

  it('评论内容含 HTML 标签应被接受', () => {
    const result = commentSchema.safeParse({
      content: '<script>alert("xss")</script>',
    });
    expect(result.success).toBe(true);
  });

  it('评论 content 为数字时被拒绝', () => {
    const result = commentSchema.safeParse({ content: 123 });
    expect(result.success).toBe(false);
  });
});
