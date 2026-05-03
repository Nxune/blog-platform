import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { PostCard } from "@/components/blog/PostCard";

export const dynamic = "force-dynamic";

export default async function HomePage() {
  const [posts, stats] = await Promise.all([
    prisma.post.findMany({
      where: { published: true },
      include: {
        author: { select: { id: true, name: true, email: true, image: true } },
        tags: { include: { tag: true } },
        _count: { select: { comments: true } },
      },
      orderBy: { publishedAt: "desc" },
      take: 6,
    }),
    prisma.$transaction([
      prisma.post.count({ where: { published: true } }),
      prisma.user.count(),
      prisma.comment.count({ where: { status: "APPROVED" } }),
    ]),
  ]);

  return (
    <div className="mx-auto max-w-6xl px-4 py-12">
      <section className="py-20 text-center">
        <h1 className="mb-4 text-4xl font-bold tracking-tight">Nexus Community Engine</h1>
        <p className="mb-8 text-lg text-muted-foreground">
          自托管 · 低占用 · AI 原生 · 联邦互联的下一代社区引擎
        </p>
        <div className="flex items-center justify-center gap-4">
          <Link
            href="/blog"
            className="rounded-lg bg-primary px-6 py-3 text-primary-foreground hover:opacity-90"
          >
            浏览帖子
          </Link>
          <Link
            href="/register"
            className="rounded-lg border px-6 py-3 hover:bg-muted"
          >
            加入社区
          </Link>
        </div>
        <div className="mt-12 flex items-center justify-center gap-12">
          <div className="text-center">
            <p className="text-2xl font-bold">{stats[0]}</p>
            <p className="text-sm text-muted-foreground">帖子</p>
          </div>
          <div className="text-center">
            <p className="text-2xl font-bold">{stats[1]}</p>
            <p className="text-sm text-muted-foreground">成员</p>
          </div>
          <div className="text-center">
            <p className="text-2xl font-bold">{stats[2]}</p>
            <p className="text-sm text-muted-foreground">评论</p>
          </div>
        </div>
      </section>

      <section className="py-12">
        <div className="mb-8 flex items-center justify-between">
          <h2 className="text-2xl font-semibold">最新帖子</h2>
          <Link href="/blog" className="text-sm text-primary hover:underline">
            查看全部
          </Link>
        </div>
        {posts.length === 0 ? (
          <p className="col-span-full py-12 text-center text-muted-foreground">
            暂无帖子
          </p>
        ) : (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {posts.map((post) => (
              <PostCard
                key={post.id}
                post={{
                  ...post,
                  author: { ...post.author, image: post.author.image ?? null },
                }}
              />
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
