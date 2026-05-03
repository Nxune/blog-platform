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
});
