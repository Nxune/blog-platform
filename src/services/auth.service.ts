import { prisma } from "@/lib/prisma";
import type { UserProfile } from "@/types/user";

export async function getUserById(id: string): Promise<UserProfile | null> {
  const user = await prisma.user.findUnique({
    where: { id },
    select: {
      id: true,
      name: true,
      email: true,
      username: true,
      avatar: true,
      role: true,
      bio: true,
      createdAt: true,
    },
  });
  if (!user) return null;
  return {
    id: user.id,
    name: user.name ?? "",
    email: user.email,
    image: user.avatar,
    role: user.role,
    bio: user.bio,
    createdAt: user.createdAt,
  };
}

export async function updateProfile(
  userId: string,
  data: { name?: string; bio?: string }
): Promise<UserProfile> {
  const user = await prisma.user.update({
    where: { id: userId },
    data,
    select: {
      id: true,
      name: true,
      email: true,
      username: true,
      avatar: true,
      role: true,
      bio: true,
      createdAt: true,
    },
  });
  return {
    id: user.id,
    name: user.name ?? "",
    email: user.email,
    image: user.avatar,
    role: user.role,
    bio: user.bio,
    createdAt: user.createdAt,
  };
}
