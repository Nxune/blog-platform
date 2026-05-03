import { auth } from "./auth";

export async function requireAuth() {
  const session = await auth();

  if (!session?.user) {
    throw new Error("UNAUTHORIZED");
  }

  return session;
}

export async function requireAdmin() {
  const session = await requireAuth();

  const role = (session.user as Record<string, unknown>).role;
  if (role !== "ADMIN") {
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

  if (role === "ADMIN") return session;
  if (userId === ownerId) return session;

  throw new Error(`您没有权限操作此${resourceName}`);
}

export function getUserId(session: Record<string, unknown>) {
  return (session.user as Record<string, unknown>).id as string;
}
