import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { PostCard } from "@/components/blog/PostCard";

export const dynamic = "force-dynamic";

export default async function HomePage() {
  const posts = await prisma.post.findMany({
    where: { published: true },
    include: {
      author: { select: { id: true, name: true, email: true, image: true } },
      tags: { include: { tag: true } },
      _count: { select: { comments: true } },
    },
    orderBy: { publishedAt: "desc" },
    take: 6,
  });

  return (
    <div className="mx-auto max-w-6xl px-4 py-12">
      <section className="py-20 text-center">
        <h1 className="mb-4 text-4xl font-bold tracking-tight">欢迎来到博客平台</h1>
        <p className="mb-8 text-lg text-muted-foreground">
          探索精彩文章，分享你的想法
        </p>
        <div className="flex items-center justify-center gap-4">
          <Link
            href="/blog"
            className="rounded-lg bg-primary px-6 py-3 text-primary-foreground hover:opacity-90"
          >
            浏览文章
          </Link>
          <Link
            href="/register"
            className="rounded-lg border px-6 py-3 hover:bg-muted"
          >
            开始写作
          </Link>
        </div>
      </section>

      <section className="py-12">
        <div className="mb-8 flex items-center justify-between">
          <h2 className="text-2xl font-semibold">最新文章</h2>
          <Link href="/blog" className="text-sm text-primary hover:underline">
            查看全部
          </Link>
        </div>
        {posts.length === 0 ? (
          <p className="col-span-full py-12 text-center text-muted-foreground">
            暂无文章
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
