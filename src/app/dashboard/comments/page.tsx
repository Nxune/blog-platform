import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";

export const dynamic = "force-dynamic";

export default async function DashboardCommentsPage() {
  const session = await auth();
  if (
    !session?.user ||
    (session.user as Record<string, unknown>).role !== "ADMIN"
  ) {
    redirect("/login");
  }

  const comments = await prisma.comment.findMany({
    select: {
      id: true,
      content: true,
      status: true,
      createdAt: true,
      author: { select: { name: true, email: true } },
      post: { select: { title: true, slug: true } },
    },
    orderBy: { createdAt: "desc" },
    take: 100,
  });

  const statusLabels: Record<string, string> = {
    PENDING: "待审核",
    APPROVED: "已通过",
    SPAM: "垃圾",
    DELETED: "已删除",
  };

  const statusColors: Record<string, string> = {
    PENDING: "bg-yellow-100 text-yellow-700",
    APPROVED: "bg-green-100 text-green-700",
    SPAM: "bg-red-100 text-red-700",
    DELETED: "bg-gray-100 text-gray-500",
  };

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">评论管理</h1>

      {comments.length === 0 ? (
        <p className="py-12 text-center text-muted-foreground">暂无评论</p>
      ) : (
        <div className="overflow-x-auto rounded-lg border">
          <table className="w-full text-sm">
            <thead className="bg-muted/50">
              <tr>
                <th className="px-4 py-3 text-left font-medium">内容</th>
                <th className="px-4 py-3 text-left font-medium">作者</th>
                <th className="px-4 py-3 text-left font-medium">文章</th>
                <th className="px-4 py-3 text-left font-medium">状态</th>
                <th className="px-4 py-3 text-left font-medium">时间</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {comments.map((comment) => (
                <tr key={comment.id} className="hover:bg-muted/30">
                  <td className="max-w-xs truncate px-4 py-3">
                    {comment.content}
                  </td>
                  <td className="px-4 py-3 text-muted-foreground">
                    {comment.author.name || comment.author.email}
                  </td>
                  <td className="px-4 py-3 text-muted-foreground">
                    {comment.post.title}
                  </td>
                  <td className="px-4 py-3">
                    <span
                      className={`rounded-full px-2 py-0.5 text-xs ${
                        statusColors[comment.status] ?? ""
                      }`}
                    >
                      {statusLabels[comment.status] ?? comment.status}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-muted-foreground">
                    {comment.createdAt.toLocaleDateString("zh-CN")}
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
