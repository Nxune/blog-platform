"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { AuthGuard } from "@/components/auth/AuthGuard";

interface DashboardShellProps {
  children: React.ReactNode;
}

const navItems = [
  { href: "/dashboard", label: "概览" },
  { href: "/dashboard/posts", label: "文章" },
  { href: "/dashboard/comments", label: "评论" },
  { href: "/dashboard/tags", label: "标签" },
  { href: "/dashboard/settings", label: "设置" },
];

export function DashboardShell({ children }: DashboardShellProps) {
  const pathname = usePathname();

  return (
    <AuthGuard>
      <div className="flex min-h-[calc(100vh-4rem)]">
        <aside className="hidden w-56 border-r md:block">
          <nav className="space-y-1 p-4">
            {navItems.map(({ href, label }) => (
              <Link
                key={href}
                href={href}
                className={`block rounded-lg px-3 py-2 text-sm ${
                  pathname === href
                    ? "bg-primary/10 font-medium text-primary"
                    : "text-muted-foreground hover:bg-muted"
                }`}
              >
                {label}
              </Link>
            ))}
          </nav>
        </aside>
        <main className="flex-1 p-6">{children}</main>
      </div>
    </AuthGuard>
  );
}
