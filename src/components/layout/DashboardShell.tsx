"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { AuthGuard } from "@/components/auth/AuthGuard";
import { useAuth } from "@/hooks/useAuth";

interface DashboardShellProps {
  children: React.ReactNode;
}

export function DashboardShell({ children }: DashboardShellProps) {
  const pathname = usePathname();
  const { user } = useAuth();
  const isSuperAdmin = user?.role === "SUPER_ADMIN";

  const navItems = [
    { href: "/dashboard", label: "概览" },
    { href: "/dashboard/posts", label: "帖子" },
    { href: "/dashboard/comments", label: "评论" },
    { href: "/dashboard/tags", label: "标签" },
    ...(isSuperAdmin ? [{ href: "/dashboard/admin/users", label: "用户管理" }] : []),
    { href: "/dashboard/settings", label: "设置" },
  ];

  return (
    <AuthGuard>
      <div className="flex min-h-[calc(100vh-4rem)]">
        <aside className="hidden w-56 shrink-0 border-r md:block">
          <nav className="space-y-1 p-4">
            {navItems.map(({ href, label }) => (
              <Link
                key={href}
                href={href}
                aria-current={pathname === href || (href !== "/dashboard" && pathname.startsWith(href)) ? "page" : undefined}
                className={`block rounded-lg px-3 py-2 text-sm ${
                  pathname === href || (href !== "/dashboard" && pathname.startsWith(href))
                    ? "bg-primary/10 font-medium text-primary"
                    : "text-muted-foreground hover:bg-muted"
                }`}
              >
                {label}
              </Link>
            ))}
          </nav>
        </aside>
        <div className="flex min-w-0 flex-1 flex-col">
          <nav className="flex gap-1 overflow-x-auto border-b px-4 py-2 md:hidden" aria-label="仪表盘导航">
            {navItems.map(({ href, label }) => (
              <Link
                key={href}
                href={href}
                aria-current={pathname === href || (href !== "/dashboard" && pathname.startsWith(href)) ? "page" : undefined}
                className={`shrink-0 whitespace-nowrap rounded-lg px-3 py-1.5 text-sm ${
                  pathname === href || (href !== "/dashboard" && pathname.startsWith(href))
                    ? "bg-primary/10 font-medium text-primary"
                    : "text-muted-foreground hover:bg-muted"
                }`}
              >
                {label}
              </Link>
            ))}
          </nav>
          <main className="flex-1 p-6">{children}</main>
        </div>
      </div>
    </AuthGuard>
  );
}
