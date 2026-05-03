// @vitest-environment node
import { describe, it, expect } from 'vitest';
import { formatDate, slugify, truncate } from '@/lib/utils';

describe('formatDate', () => {
  it('应正确格式化 Date 对象为中文日期格式', () => {
    const date = new Date('2026-05-03T12:00:00Z');
    const result = formatDate(date);
    expect(result).toContain('2026');
    expect(result).toContain('5月');
    expect(result).toContain('3日');
  });

  it('应处理字符串日期', () => {
    const result = formatDate('2026-05-03');
    expect(result).toContain('2026');
  });

  it('应正确处理月末日期', () => {
    const date = new Date('2026-01-31');
    const result = formatDate(date);
    expect(result).toContain('31日');
  });

  it('应处理 Date 字符串', () => {
    expect(formatDate('2026-05-03')).toContain('2026');
  });

  it('应处理时间戳数字', () => {
    const ts = new Date('2026-05-03').getTime();
    expect(formatDate(ts)).toContain('2026');
  });

  it('应处理跨年日期', () => {
    const result = formatDate(new Date('2025-12-31'));
    expect(result).toContain('2025');
    expect(result).toContain('12月');
  });
});

describe('slugify', () => {
  it('应将英文标题转为 slug', () => {
    expect(slugify('Hello World')).toBe('hello-world');
  });

  it('应处理特殊字符', () => {
    expect(slugify('Hello & World!')).toBe('hello-world');
  });

  it('应去除首尾连字符', () => {
    expect(slugify('  hello world  ')).toBe('hello-world');
  });

  it('应处理多个连续空格', () => {
    expect(slugify('hello   world')).toBe('hello-world');
  });

  it('应保留中文字符', () => {
    const result = slugify('你好 World');
    expect(result).toContain('你好');
    expect(result).toContain('world');
  });

  it('应处理空字符串', () => {
    expect(slugify('')).toBe('');
  });

  it('应处理只有特殊字符的字符串', () => {
    expect(slugify('!!!---???')).toBe('');
  });

  it('应处理带数字的字符串', () => {
    expect(slugify('Hello 2 World 3')).toBe('hello-2-world-3');
  });

  it('应处理下划线', () => {
    expect(slugify('hello_world_test')).toBe('hello_world_test');
  });

  it('应转换大写字母为小写', () => {
    expect(slugify('HELLO WORLD')).toBe('hello-world');
  });
});

describe('truncate', () => {
  it('应截断超过长度的文本并添加省略号', () => {
    expect(truncate('Hello World This Is Long', 10)).toBe('Hello...');
  });

  it('应在单词边界处截断', () => {
    const result = truncate('Hello World This Is Long', 12);
    expect(result).toMatch(/\.\.\.$/);
    expect(result!.length).toBeLessThanOrEqual(15);
  });

  it('不应截断未超过长度的文本', () => {
    expect(truncate('Hello', 10)).toBe('Hello');
  });

  it('应处理恰好等于长度的文本', () => {
    expect(truncate('1234567890', 10)).toBe('1234567890');
  });

  it('应处理空字符串', () => {
    expect(truncate('', 10)).toBe('');
  });

  it('应处理只有空格的字符串', () => {
    expect(truncate('     ', 3)).toBe('...');
  });

  it('应处理长度参数为 0', () => {
    expect(truncate('Hello', 0)).toBe('...');
  });

  it('应处理包含中文的文本', () => {
    // slice(0,6) = '这是一段很长' + replace(/\s+\S*$/) 不匹配 + '...'
    const result = truncate('这是一段很长的中文文本', 6);
    expect(result).toBe('这是一段很长...');
  });

  it('应处理长度 1 的截断', () => {
    const result = truncate('Hello', 1);
    expect(result).toBe('H...');
  });
});
