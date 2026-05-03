import { auth } from "./auth";
import { headers } from "next/headers";

export async function requireAuth() {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

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
