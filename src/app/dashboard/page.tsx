import Link from "next/link";
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
  const isSuperAdmin = role === "SUPER_ADMIN";
  const isAdmin = role === "ADMIN" || isSuperAdmin;

  const [postCount, commentCount, userCount, tagCount, viewCountResult] =
    await Promise.all([
      isAdmin
        ? prisma.post.count()
        : prisma.post.count({ where: { authorId: userId } }),
      isAdmin
        ? prisma.comment.count()
        : prisma.comment.count({ where: { post: { authorId: userId } } }),
      isSuperAdmin ? prisma.user.count() : Promise.resolve(null),
      prisma.tag.count(),
      isAdmin
        ? prisma.post.aggregate({ _sum: { viewCount: true } })
        : prisma.post.aggregate({
            where: { authorId: userId },
            _sum: { viewCount: true },
          }),
    ]);

  const recentUsers = isSuperAdmin
    ? await prisma.user.findMany({
        orderBy: { createdAt: "desc" },
        take: 5,
        select: { id: true, name: true, email: true, role: true, createdAt: true },
      })
    : [];

  const roleLabels: Record<string, string> = {
    SUPER_ADMIN: "超级管理员",
    ADMIN: "管理员",
    USER: "用户",
  };

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">
          {isSuperAdmin ? "超级管理员控制台" : "工作台概览"}
        </h1>
        {isSuperAdmin && (
          <span className="rounded-full bg-purple-100 px-3 py-1 text-xs font-medium text-purple-700">
            超级管理员
          </span>
        )}
      </div>

      {/* 统计卡片 */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {[
          { label: isAdmin ? "帖子总数" : "我的帖子", value: postCount },
          { label: isAdmin ? "评论总数" : "我的评论", value: commentCount },
          ...(isSuperAdmin
            ? [{ label: "注册用户", value: userCount as number }]
            : []),
          { label: "标签数", value: tagCount },
          { label: isAdmin ? "总阅读量" : "我的阅读量", value: (viewCountResult._sum.viewCount ?? 0).toLocaleString() },
        ].map(({ label, value }) => (
          <div key={label} className="rounded-lg border p-4">
            <p className="text-sm text-muted-foreground">{label}</p>
            <p className="mt-1 text-2xl font-semibold">
              {typeof value === "number" ? value.toLocaleString() : value}
            </p>
          </div>
        ))}
      </div>

      {/* 超级管理员快捷操作 */}
      {isSuperAdmin && (
        <div className="space-y-4">
          <h2 className="text-lg font-semibold">系统管理</h2>
          <div className="grid gap-4 md:grid-cols-3">
            {[
              {
                href: "/dashboard/admin/users",
                title: "用户管理",
                desc: "查看、修改角色、删除用户",
                color: "border-purple-200 bg-purple-50 hover:bg-purple-100",
              },
              {
                href: "/dashboard/posts",
                title: "帖子管理",
                desc: "查看、编辑、删除所有帖子",
                color: "border-blue-200 bg-blue-50 hover:bg-blue-100",
              },
              {
                href: "/dashboard/comments",
                title: "评论管理",
                desc: "审核、删除所有评论",
                color: "border-green-200 bg-green-50 hover:bg-green-100",
              },
            ].map(({ href, title, desc, color }) => (
              <Link
                key={href}
                href={href}
                className={`rounded-lg border p-4 transition-colors ${color}`}
              >
                <h3 className="font-medium">{title}</h3>
                <p className="mt-1 text-sm text-muted-foreground">{desc}</p>
              </Link>
            ))}
          </div>
        </div>
      )}

      {/* 最近注册用户 */}
      {isSuperAdmin && recentUsers.length > 0 && (
        <div className="space-y-3">
          <h2 className="text-lg font-semibold">最近注册用户</h2>
          <div className="overflow-x-auto rounded-lg border">
            <table className="w-full text-sm">
              <thead className="bg-muted/50">
                <tr>
                  <th className="px-4 py-2 text-left font-medium">用户</th>
                  <th className="px-4 py-2 text-left font-medium">邮箱</th>
                  <th className="px-4 py-2 text-left font-medium">角色</th>
                  <th className="px-4 py-2 text-left font-medium">注册时间</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {recentUsers.map((u) => (
                  <tr key={u.id}>
                    <td className="px-4 py-2 font-medium">{u.name ?? "未设置"}</td>
                    <td className="px-4 py-2 text-muted-foreground">{u.email}</td>
                    <td className="px-4 py-2">
                      <span className="rounded-full bg-muted px-2 py-0.5 text-xs">
                        {roleLabels[u.role] ?? u.role}
                      </span>
                    </td>
                    <td className="px-4 py-2 text-muted-foreground">
                      {new Date(u.createdAt).toLocaleDateString("zh-CN")}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
