"use client";

import { useState } from "react";
import Link from "next/link";
import { useAuth } from "@/hooks/useAuth";
import { signOut } from "next-auth/react";

const roleBadge: Record<string, string> = {
  SUPER_ADMIN: "超级管理员",
  ADMIN: "管理员",
  USER: "",
};

export function Header() {
  const { user, isAuthenticated } = useAuth();
  const [menuOpen, setMenuOpen] = useState(false);
  const [mobileNavOpen, setMobileNavOpen] = useState(false);

  return (
    <header className="border-b">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4">
        <div className="flex items-center gap-8">
          <Link href="/" className="text-xl font-bold">
            Nexus
          </Link>
          <nav className="hidden items-center gap-6 md:flex">
            <Link href="/blog" className="text-sm text-muted-foreground hover:text-foreground">
              帖子
            </Link>
            <Link href="/tags" className="text-sm text-muted-foreground hover:text-foreground">
              标签
            </Link>
            <Link href="/about" className="text-sm text-muted-foreground hover:text-foreground">
              关于
            </Link>
          </nav>
        </div>

        <div className="flex items-center gap-1 md:gap-4">
          <Link href="/search" className="rounded-lg p-2 text-sm text-muted-foreground hover:text-foreground md:px-0" aria-label="搜索">
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="m21 21-5.197-5.197m0 0A7.5 7.5 0 1 0 5.196 5.196a7.5 7.5 0 0 0 10.607 10.607Z" />
            </svg>
            <span className="hidden md:inline">搜索</span>
          </Link>

          <button
            onClick={() => setMobileNavOpen(!mobileNavOpen)}
            className="rounded-lg p-2 hover:bg-muted md:hidden"
            aria-label={mobileNavOpen ? "关闭导航菜单" : "打开导航菜单"}
            aria-expanded={mobileNavOpen}
          >
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
              {mobileNavOpen ? (
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" />
              ) : (
                <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25h16.5" />
              )}
            </svg>
          </button>
          {isAuthenticated && user ? (
            <div className="relative">
              <button
                onClick={() => setMenuOpen(!menuOpen)}
                className="flex items-center gap-2 rounded-lg px-3 py-1.5 text-sm hover:bg-muted"
                aria-haspopup="true"
                aria-expanded={menuOpen}
                aria-label="用户菜单"
              >
                <span className="flex h-7 w-7 items-center justify-center rounded-full bg-primary/10 text-xs font-medium text-primary">
                  {(user.name ?? user.email ?? "?").charAt(0).toUpperCase()}
                </span>
                <span className="hidden md:inline">{user.name ?? user.email}</span>
              </button>

              {menuOpen && (
                <>
                  <div className="fixed inset-0 z-10" onClick={() => setMenuOpen(false)} />
                  <div className="absolute right-0 z-20 mt-2 w-48 rounded-lg border bg-background py-1 shadow-lg">
                    <div className="border-b px-3 py-2">
                      <p className="text-sm font-medium">{user.name ?? user.email}</p>
                      <p className="text-xs text-muted-foreground">{user.email}</p>
                      {roleBadge[user.role ?? ""] && (
                        <span className="mt-1 inline-block rounded-full bg-primary/10 px-2 py-0.5 text-xs text-primary">
                          {roleBadge[user.role ?? ""]}
                        </span>
                      )}
                    </div>
                    <Link
                      href="/dashboard"
                      onClick={() => setMenuOpen(false)}
                      className="block px-3 py-2 text-sm hover:bg-muted"
                    >
                      工作台
                    </Link>
                    <Link
                      href="/dashboard/settings"
                      onClick={() => setMenuOpen(false)}
                      className="block px-3 py-2 text-sm hover:bg-muted"
                    >
                      账号设置
                    </Link>
                    {user?.username && (
                      <Link
                        href={`/u/${user.username}`}
                        onClick={() => setMenuOpen(false)}
                        className="block px-3 py-2 text-sm hover:bg-muted"
                      >
                        个人主页
                      </Link>
                    )}
                    <button
                      onClick={() => signOut({ callbackUrl: "/" })}
                      className="block w-full px-3 py-2 text-left text-sm text-destructive hover:bg-muted"
                    >
                      退出登录
                    </button>
                  </div>
                </>
              )}
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

      {mobileNavOpen && (
        <>
          <div className="fixed inset-0 z-40 bg-black/20" onClick={() => setMobileNavOpen(false)} />
          <nav className="fixed left-0 right-0 top-16 z-50 border-b bg-background px-4 pb-4 pt-2 shadow-lg md:hidden">
            <div className="flex flex-col gap-1">
              <Link
                href="/blog"
                onClick={() => setMobileNavOpen(false)}
                className="rounded-lg px-3 py-2 text-sm hover:bg-muted"
              >
                帖子
              </Link>
              <Link
                href="/tags"
                onClick={() => setMobileNavOpen(false)}
                className="rounded-lg px-3 py-2 text-sm hover:bg-muted"
              >
                标签
              </Link>
              <Link
                href="/about"
                onClick={() => setMobileNavOpen(false)}
                className="rounded-lg px-3 py-2 text-sm hover:bg-muted"
              >
                关于
              </Link>
            </div>
          </nav>
        </>
      )}
    </header>
  );
}
