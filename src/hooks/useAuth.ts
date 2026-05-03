"use client";

import { authClient } from "@/lib/auth-client";
import type { UserProfile } from "@/types/user";

export function useAuth() {
  const { data: session, isPending, error } = authClient.useSession();

  const user = session?.user
    ? ({
        id: session.user.id,
        name: session.user.name,
        email: session.user.email,
        image: session.user.image ?? null,
        role: (session.user as Record<string, unknown>).role as UserProfile["role"] ?? "USER",
        bio: (session.user as Record<string, unknown>).bio as string | null ?? null,
        createdAt: session.user.createdAt,
      } satisfies UserProfile)
    : undefined;

  return {
    user,
    isAuthenticated: !!session?.user,
    isLoading: isPending,
    error,
  };
}

export function useRequireAuth() {
  const { user, isLoading, isAuthenticated } = useAuth();

  return {
    user,
    isLoading,
    isAuthenticated,
    shouldRedirect: !isLoading && !isAuthenticated,
    redirectTo: "/login",
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
