export interface TestPost {
  title: string;
  content: string;
  excerpt?: string;
  tags: string[];
  status: 'draft' | 'published';
  coverImage?: string;
}

export const testPosts = {
  published: {
    title: '测试文章标题 - Hello World',
    content: '# Hello World\n\n这是一篇测试文章的**内容**。\n\n- 列表项 1\n- 列表项 2',
    excerpt: '这是一篇测试文章的摘要内容。',
    tags: ['技术', 'JavaScript'],
    status: 'published' as const,
  },
  draft: {
    title: '草稿文章标题',
    content: '这是一篇草稿文章，尚未发布。',
    tags: ['草稿'],
    status: 'draft' as const,
  },
  multiTag: {
    title: '多标签测试文章',
    content: '这篇文章包含多个标签。',
    tags: ['技术', '前端', 'React', 'TypeScript', 'CSS'],
    status: 'published' as const,
  },
} as const satisfies Record<string, TestPost>;

export const invalidPosts = {
  emptyTitle: { title: '', content: '有内容但标题为空。', tags: [], status: 'draft' as const },
  longTitle: { title: '长'.repeat(101), content: '标题超过 200 字符。', tags: [], status: 'draft' as const },
  emptyContent: { title: '空内容文章', content: '', tags: [], status: 'draft' as const },
  xssContent: { title: 'XSS 测试', content: '<script>alert("xss")</script>', tags: [], status: 'draft' as const },
} as const;
