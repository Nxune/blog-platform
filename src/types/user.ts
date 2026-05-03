import type { Role } from "@prisma/client";

export interface UserProfile {
  id: string;
  name: string | null;
  username: string | null;
  email: string;
  image: string | null;
  role: Role;
  bio: string | null;
  website: string | null;
  location: string | null;
  createdAt: Date;
}
