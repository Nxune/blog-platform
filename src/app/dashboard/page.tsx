import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";

export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  const session = await auth();
  if (
    !session?.user ||
    (session.user as Record<string, unknown>).role !== "ADMIN"
  ) {
    redirect("/login");
  }

  const [postCount, commentCount, tagCount, viewCountResult] =
    await Promise.all([
      prisma.post.count(),
      prisma.comment.count(),
      prisma.tag.count(),
      prisma.post.aggregate({ _sum: { viewCount: true } }),
    ]);

  const stats = [
    { label: "文章总数", value: postCount },
    { label: "评论总数", value: commentCount },
    { label: "标签数", value: tagCount },
    { label: "总阅读量", value: viewCountResult._sum.viewCount ?? 0 },
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
