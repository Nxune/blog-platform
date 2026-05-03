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
    return fallback ?? <div className="flex items-center justify-center p-8">加载中...</div>;
  }

  if (!isAuthenticated) {
    return null;
  }

  if (adminOnly && user?.role !== "ADMIN") {
    return <div className="flex items-center justify-center p-8 text-destructive">无权限访问</div>;
  }

  return <>{children}</>;
}
