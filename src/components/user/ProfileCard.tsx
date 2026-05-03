import Link from "next/link";
import { formatDate } from "@/lib/utils";

interface ProfileUser {
  name: string | null;
  username: string | null;
  email: string;
  image: string | null;
  bio: string | null;
  website: string | null;
  location: string | null;
  createdAt: Date;
  _count: { posts: number; likes: number };
}

export function ProfileCard({ user }: { user: ProfileUser }) {
  return (
    <div className="rounded-lg border p-6">
      <div className="flex items-start gap-4">
        <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-full bg-primary/10 text-xl font-medium text-primary">
          {(user.name ?? user.email).charAt(0).toUpperCase()}
        </div>
        <div className="min-w-0 flex-1">
          <h1 className="text-xl font-bold">
            {user.name ?? user.email}
          </h1>
          {user.username && (
            <p className="text-sm text-muted-foreground">@{user.username}</p>
          )}
          {user.bio && (
            <p className="mt-2 text-sm">{user.bio}</p>
          )}
          <div className="mt-3 flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
            {user.location && (
              <span>{user.location}</span>
            )}
            {user.website && (
              <a
                href={user.website.startsWith("http") ? user.website : `https://${user.website}`}
                target="_blank"
                rel="noopener noreferrer"
                className="text-primary hover:underline"
              >
                {user.website.replace(/^https?:\/\//, "")}
              </a>
            )}
            <span>{formatDate(user.createdAt)} 加入</span>
            <span>{user._count.posts} 篇文章</span>
            <span>{user._count.likes} 个赞</span>
          </div>
        </div>
      </div>
    </div>
  );
}
