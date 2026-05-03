import type { Role } from "@prisma/client";

export interface UserProfile {
  id: string;
  name: string;
  email: string;
  image: string | null;
  role: Role;
  bio: string | null;
  createdAt: Date;
}
