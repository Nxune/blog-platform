export interface TestComment {
  content: string;
  parentId?: string | null;
}

export const testComments = {
  topLevel: { content: '这是一条测试评论，用于验证评论功能是否正常工作。' },
  reply: { content: '这是一条回复评论。' },
  markdownContent: { content: '**加粗** *斜体* `代码` [链接](https://example.com)' },
} as const satisfies Record<string, TestComment>;

export const invalidComments = {
  emptyContent: { content: '' },
  longContent: { content: 'x'.repeat(2001) },
  xssContent: { content: '<script>alert("xss")</script>' },
  sqlInjection: { content: "'; DROP TABLE comments; --" },
} as const;
