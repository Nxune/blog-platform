import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { ProfileCard } from "@/components/user/ProfileCard";
import { PostCard } from "@/components/blog/PostCard";

export default async function UserProfilePage({
  params,
}: {
  params: Promise<{ username: string }>;
}) {
  const { username } = await params;

  const user = await prisma.user.findUnique({
    where: { username },
    include: {
      _count: { select: { posts: true, likes: true } },
      posts: {
        where: { published: true },
        orderBy: { createdAt: "desc" },
        include: {
          tags: { include: { tag: true } },
          author: { select: { name: true, email: true, username: true, image: true } },
          _count: { select: { comments: true } },
        },
      },
    },
  });

  if (!user) {
    notFound();
  }

  return (
    <div className="mx-auto max-w-4xl px-4 py-8">
      <ProfileCard user={user} />
      <div className="mt-8">
        <h2 className="mb-4 text-lg font-semibold">
          文章 ({user.posts.length})
        </h2>
        <div className="space-y-4">
          {user.posts.map((post) => (
            <PostCard key={post.id} post={post as never} />
          ))}
          {user.posts.length === 0 && (
            <p className="text-sm text-muted-foreground">暂无已发布的文章</p>
          )}
        </div>
      </div>
    </div>
  );
}
