"use client";

import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { useRequireAuth } from "@/hooks/useAuth";

interface AuthGuardProps {
  children: React.ReactNode;
  adminOnly?: boolean;
  fallback?: React.ReactNode;
}

export function AuthGuard({ children, adminOnly = false, fallback }: AuthGuardProps) {
  const router = useRouter();
  const { user, isLoading, isAuthenticated } = useRequireAuth();

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.push("/login");
    }
  }, [isLoading, isAuthenticated, router]);

  if (isLoading) {
    return fallback ?? (
      <div className="flex items-center justify-center p-8">
        <svg className="mr-2 h-4 w-4 animate-spin text-muted-foreground" fill="none" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
        </svg>
        <span className="text-sm text-muted-foreground">加载中...</span>
      </div>
    );
  }

  if (!isAuthenticated) {
    return null;
  }

  if (adminOnly && user?.role !== "ADMIN" && user?.role !== "SUPER_ADMIN") {
    return <div className="flex items-center justify-center p-8 text-destructive">无权限访问</div>;
  }

  return <>{children}</>;
}
