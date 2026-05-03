import "@testing-library/jest-dom/vitest";
import { beforeAll, afterAll, beforeEach, afterEach, vi } from "vitest";

beforeAll(() => {
  if (process.env.NODE_ENV !== 'test') {
    throw new Error('测试必须在 NODE_ENV=test 环境下运行');
  }
  vi.spyOn(console, 'log').mockImplementation(() => {});
});

afterAll(() => {
  vi.restoreAllMocks();
});

beforeEach(() => {
  vi.clearAllMocks();
});

afterEach(() => {
  // 清理副作用
});
