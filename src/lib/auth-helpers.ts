import { auth } from "./auth";

function isAdmin(role: string): boolean {
  return role === "ADMIN" || role === "SUPER_ADMIN";
}

export async function requireAuth() {
  const session = await auth();

  if (!session?.user) {
    throw new Error("UNAUTHORIZED");
  }

  return session;
}

export async function requireAdmin() {
  const session = await requireAuth();

  const role = (session.user as Record<string, unknown>).role as string;
  if (!isAdmin(role)) {
    throw new Error("FORBIDDEN");
  }

  return session;
}

export async function requireSuperAdmin() {
  const session = await requireAuth();

  const role = (session.user as Record<string, unknown>).role;
  if (role !== "SUPER_ADMIN") {
    throw new Error("FORBIDDEN");
  }

  return session;
}

export async function requireOwner(
  ownerId: string,
  resourceName: string = "资源"
) {
  const session = await requireAuth();

  const userId = (session.user as Record<string, unknown>).id as string;
  const role = (session.user as Record<string, unknown>).role as string;

  if (isAdmin(role)) return session;
  if (userId === ownerId) return session;

  throw new Error(`您没有权限操作此${resourceName}`);
}

export function getUserId(session: Record<string, unknown>) {
  return (session.user as Record<string, unknown>).id as string;
}
