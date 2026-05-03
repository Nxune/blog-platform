import Link from "next/link";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";

export const dynamic = "force-dynamic";

export default async function DashboardPostsPage() {
  const session = await auth();
  if (
    !session?.user ||
    (session.user as Record<string, unknown>).role !== "ADMIN"
  ) {
    redirect("/login");
  }

  const posts = await prisma.post.findMany({
    select: {
      id: true,
      title: true,
      slug: true,
      published: true,
      createdAt: true,
      updatedAt: true,
      author: { select: { name: true, email: true } },
      _count: { select: { comments: true } },
    },
    orderBy: { updatedAt: "desc" },
    take: 100,
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">文章管理</h1>
        <Link
          href="/dashboard/posts/new"
          className="rounded-lg bg-primary px-4 py-2 text-sm text-primary-foreground hover:opacity-90"
        >
          新建文章
        </Link>
      </div>

      {posts.length === 0 ? (
        <p className="py-12 text-center text-muted-foreground">暂无文章</p>
      ) : (
        <div className="overflow-x-auto rounded-lg border">
          <table className="w-full text-sm">
            <thead className="bg-muted/50">
              <tr>
                <th className="px-4 py-3 text-left font-medium">标题</th>
                <th className="px-4 py-3 text-left font-medium">作者</th>
                <th className="px-4 py-3 text-left font-medium">状态</th>
                <th className="px-4 py-3 text-left font-medium">评论</th>
                <th className="px-4 py-3 text-left font-medium">更新于</th>
                <th className="px-4 py-3 text-left font-medium">操作</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {posts.map((post) => (
                <tr key={post.id} className="hover:bg-muted/30">
                  <td className="px-4 py-3">
                    <Link
                      href={`/dashboard/posts/${post.slug}/edit`}
                      className="font-medium hover:text-primary"
                    >
                      {post.title}
                    </Link>
                  </td>
                  <td className="px-4 py-3 text-muted-foreground">
                    {post.author.name || post.author.email}
                  </td>
                  <td className="px-4 py-3">
                    <span
                      className={`rounded-full px-2 py-0.5 text-xs ${
                        post.published
                          ? "bg-green-100 text-green-700"
                          : "bg-yellow-100 text-yellow-700"
                      }`}
                    >
                      {post.published ? "已发布" : "草稿"}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-muted-foreground">
                    {post._count.comments}
                  </td>
                  <td className="px-4 py-3 text-muted-foreground">
                    {post.updatedAt.toLocaleDateString("zh-CN")}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex gap-2">
                      <Link
                        href={`/dashboard/posts/${post.slug}/edit`}
                        className="text-primary hover:underline"
                      >
                        编辑
                      </Link>
                      <Link
                        href={`/blog/${post.slug}`}
                        className="text-muted-foreground hover:underline"
                      >
                        查看
                      </Link>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
