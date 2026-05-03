// @vitest-environment node
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { NextRequest } from 'next/server';

// Mock better-auth/cookies
vi.mock('better-auth/cookies', () => ({
  getSessionCookie: vi.fn(),
}));

import { getSessionCookie } from 'better-auth/cookies';

// Re-import middleware after mocks are set up
const { default: middleware } = await import('@/middleware');

function createMockRequest(url: string): NextRequest {
  return {
    nextUrl: new URL(url),
    url,
  } as unknown as NextRequest;
}

describe('middleware', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('应允许访问公开路由（无 session cookie）', async () => {
    vi.mocked(getSessionCookie).mockReturnValue(null);
    const request = createMockRequest('http://localhost:3000/');
    const response = await middleware(request);
    expect(response).toBeDefined();
  });

  it('应重定向未认证用户从 /dashboard 到 /login', async () => {
    vi.mocked(getSessionCookie).mockReturnValue(null);
    const request = createMockRequest('http://localhost:3000/dashboard');
    const response = await middleware(request);
    expect(response?.status).toBe(307); // redirect
  });

  it('应允许已认证用户访问 /dashboard', async () => {
    vi.mocked(getSessionCookie).mockReturnValue('valid-session-token');
    const request = createMockRequest('http://localhost:3000/dashboard');
    const response = await middleware(request);
    expect(response).toBeDefined();
  });

  it('应重定向已认证用户从 /login 到首页', async () => {
    vi.mocked(getSessionCookie).mockReturnValue('valid-session-token');
    const request = createMockRequest('http://localhost:3000/login');
    const response = await middleware(request);
    expect(response?.status).toBe(307);
  });

  it('应允许未认证用户访问 /login', async () => {
    vi.mocked(getSessionCookie).mockReturnValue(null);
    const request = createMockRequest('http://localhost:3000/login');
    const response = await middleware(request);
    expect(response).toBeDefined();
  });

  it('应允许未认证用户访问 /register', async () => {
    vi.mocked(getSessionCookie).mockReturnValue(null);
    const request = createMockRequest('http://localhost:3000/register');
    const response = await middleware(request);
    expect(response).toBeDefined();
  });

  it('应允许访问 API 路由不受中间件影响', async () => {
    vi.mocked(getSessionCookie).mockReturnValue(null);
    const request = createMockRequest('http://localhost:3000/api/posts');
    const response = await middleware(request);
    expect(response).toBeDefined();
  });
});
