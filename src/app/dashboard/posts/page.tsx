"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";

interface Post {
  id: string;
  title: string;
  slug: string;
  published: boolean;
  createdAt: string;
  updatedAt: string;
  author: { id: string; name: string | null; email: string };
  _count: { comments: number };
}

export default function DashboardPostsPage() {
  const { data: session } = useSession();
  const router = useRouter();
  const [posts, setPosts] = useState<Post[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [error, setError] = useState("");

  const role = (session?.user as Record<string, unknown> | undefined)
    ?.role as string | undefined;
  const isSuperAdmin = role === "SUPER_ADMIN";

  const fetchPosts = useCallback(async () => {
    setIsLoading(true);
    setError("");
    try {
      const params = new URLSearchParams();
      if (search) params.set("search", search);
      const res = await fetch(`/api/dashboard/posts?${params}`);
      if (res.status === 401) {
        router.push("/login");
        return;
      }
      if (!res.ok) throw new Error("获取失败");
      const data = await res.json();
      setPosts(data.posts ?? []);
    } catch {
      setError("获取文章列表失败");
    } finally {
      setIsLoading(false);
    }
  }, [search, router]);

  useEffect(() => {
    fetchPosts();
  }, [fetchPosts]);

  const handleDelete = async (postId: string, title: string) => {
    if (!confirm(`确定要删除文章「${title}」吗？此操作不可撤销。`)) return;
    try {
      const res = await fetch(`/api/dashboard/posts/${postId}`, {
        method: "DELETE",
      });
      if (!res.ok) {
        const data = await res.json();
        alert(data.error || "删除失败");
        return;
      }
      fetchPosts();
    } catch {
      alert("删除失败");
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-4">
        <h1 className="text-2xl font-bold">文章管理</h1>
        <Link
          href="/dashboard/posts/new"
          className="shrink-0 rounded-lg bg-primary px-4 py-2 text-sm text-primary-foreground hover:opacity-90"
        >
          新建文章
        </Link>
      </div>

      <div className="flex gap-2">
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && fetchPosts()}
          placeholder={isSuperAdmin ? "搜索标题或作者邮箱..." : "搜索标题..."}
          className="flex-1 rounded-lg border px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-primary"
        />
        <button
          onClick={fetchPosts}
          className="rounded-lg border px-4 py-2 text-sm hover:bg-muted"
        >
          搜索
        </button>
      </div>

      {error && <p className="text-sm text-destructive">{error}</p>}

      {isLoading ? (
        <div className="flex items-center justify-center py-12">
          <svg className="mr-2 h-4 w-4 animate-spin text-muted-foreground" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
          </svg>
          <span className="text-sm text-muted-foreground">加载中...</span>
        </div>
      ) : posts.length === 0 ? (
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
                    {new Date(post.updatedAt).toLocaleDateString("zh-CN")}
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
                      {isSuperAdmin && (
                        <button
                          onClick={() => handleDelete(post.id, post.title)}
                          className="text-destructive hover:underline"
                        >
                          删除
                        </button>
                      )}
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
