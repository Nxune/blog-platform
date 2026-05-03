import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";

export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  const session = await auth();
  if (!session?.user) {
    redirect("/login");
  }

  const role = (session.user as Record<string, unknown>).role as string;
  const userId = (session.user as Record<string, unknown>).id as string;
  const isAdmin = role === "ADMIN";

  const [postCount, commentCount, tagCount, viewCountResult] =
    await Promise.all([
      isAdmin
        ? prisma.post.count()
        : prisma.post.count({ where: { authorId: userId } }),
      isAdmin
        ? prisma.comment.count()
        : prisma.comment.count({
            where: { post: { authorId: userId } },
          }),
      prisma.tag.count(),
      isAdmin
        ? prisma.post.aggregate({ _sum: { viewCount: true } })
        : prisma.post.aggregate({
            where: { authorId: userId },
            _sum: { viewCount: true },
          }),
    ]);

  const stats = [
    { label: isAdmin ? "文章总数" : "我的文章", value: postCount },
    { label: isAdmin ? "评论总数" : "我的评论", value: commentCount },
    { label: "标签数", value: tagCount },
    { label: isAdmin ? "总阅读量" : "我的阅读量", value: viewCountResult._sum.viewCount ?? 0 },
  ];

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">仪表盘概览</h1>
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {stats.map(({ label, value }) => (
          <div key={label} className="rounded-lg border p-4">
            <p className="text-sm text-muted-foreground">{label}</p>
            <p className="mt-1 text-2xl font-semibold">{value.toLocaleString()}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
