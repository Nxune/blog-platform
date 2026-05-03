import type { Role } from "@prisma/client";

export interface UserProfile {
  id: string;
  name: string | null;
  email: string;
  image: string | null;
  role: Role;
  bio: string | null;
  createdAt: Date;
}

export interface Session {
  user: UserProfile;
  session: {
    id: string;
    expiresAt: Date;
    token: string;
  };
}
