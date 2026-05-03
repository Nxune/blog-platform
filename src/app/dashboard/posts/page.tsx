import Link from "next/link";

export default function DashboardPostsPage() {
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
      <p className="text-center py-12 text-muted-foreground">暂无文章</p>
    </div>
  );
}
