import { prisma } from "@/lib/prisma";
import type { UserProfile } from "@/types/user";

export async function getUserById(id: string): Promise<UserProfile | null> {
  const user = await prisma.user.findUnique({
    where: { id },
    select: {
      id: true,
      name: true,
      email: true,
      image: true,
      role: true,
      bio: true,
      createdAt: true,
    },
  });
  return user;
}

export async function updateProfile(
  userId: string,
  data: { name?: string; bio?: string; image?: string }
): Promise<UserProfile> {
  const user = await prisma.user.update({
    where: { id: userId },
    data,
    select: {
      id: true,
      name: true,
      email: true,
      image: true,
      role: true,
      bio: true,
      createdAt: true,
    },
  });
  return user;
}
