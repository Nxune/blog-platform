"use client";

import Link from "next/link";
import { useAuth } from "@/hooks/useAuth";

export function Header() {
  const { user, isAuthenticated } = useAuth();

  return (
    <header className="border-b">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4">
        <div className="flex items-center gap-8">
          <Link href="/" className="text-xl font-bold">
            Blog
          </Link>
          <nav className="hidden items-center gap-6 md:flex">
            <Link href="/blog" className="text-sm text-muted-foreground hover:text-foreground">
              文章
            </Link>
            <Link href="/tags" className="text-sm text-muted-foreground hover:text-foreground">
              标签
            </Link>
            <Link href="/about" className="text-sm text-muted-foreground hover:text-foreground">
              关于
            </Link>
          </nav>
        </div>

        <div className="flex items-center gap-4">
          <Link href="/search" className="text-sm text-muted-foreground hover:text-foreground">
            搜索
          </Link>
          {isAuthenticated ? (
            <div className="flex items-center gap-3">
              {user?.role === "ADMIN" && (
                <Link
                  href="/dashboard"
                  className="text-sm text-muted-foreground hover:text-foreground"
                >
                  管理
                </Link>
              )}
              <span className="text-sm text-muted-foreground">{user?.name ?? user?.email}</span>
            </div>
          ) : (
            <div className="flex items-center gap-3">
              <Link
                href="/login"
                className="text-sm text-muted-foreground hover:text-foreground"
              >
                登录
              </Link>
              <Link
                href="/register"
                className="rounded-lg bg-primary px-4 py-2 text-sm text-primary-foreground"
              >
                注册
              </Link>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
