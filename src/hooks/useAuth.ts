"use client";

import { useSession } from "better-auth/react";
import type { UserProfile } from "@/types/user";

export function useAuth() {
  const { data: session, isPending, error } = useSession();

  return {
    user: session?.user as UserProfile | undefined,
    isAuthenticated: !!session?.user,
    isLoading: isPending,
    error,
  };
}

export function useRequireAuth(redirectTo?: string) {
  const { user, isLoading, isAuthenticated } = useAuth();

  return {
    user,
    isLoading,
    isAuthenticated,
    shouldRedirect: !isLoading && !isAuthenticated,
    redirectTo: redirectTo ?? "/login",
  };
}

export function useAdmin() {
  const { user, isLoading } = useAuth();

  return {
    isAdmin: user?.role === "ADMIN",
    isLoading,
    user,
  };
}
