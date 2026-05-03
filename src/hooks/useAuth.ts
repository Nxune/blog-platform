"use client";

import { useSession } from "next-auth/react";
import type { UserProfile } from "@/types/user";

export function useAuth() {
  const { data: session, status } = useSession();

  const rawUser = session?.user as Record<string, unknown> | undefined;
  const user: UserProfile | undefined = session?.user
    ? {
        id: session.user.id ?? "",
        name: session.user.name ?? "",
        username: (rawUser?.username as string) ?? null,
        email: session.user.email ?? "",
        image: session.user.image ?? null,
        role: (rawUser?.role as UserProfile["role"]) ?? "USER",
        bio: (rawUser?.bio as string) ?? null,
        website: (rawUser?.website as string) ?? null,
        location: (rawUser?.location as string) ?? null,
        createdAt: new Date(),
      }
    : undefined;

  return {
    user,
    isAuthenticated: status === "authenticated",
    isLoading: status === "loading",
    error: null,
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
    isAdmin: user?.role === "ADMIN" || user?.role === "SUPER_ADMIN",
    isLoading,
    user,
  };
}
