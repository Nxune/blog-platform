"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";

interface Comment {
  id: string;
  content: string;
  status: string;
  createdAt: string;
  author: { name: string | null; email: string };
  post: { title: string; slug: string };
}

interface PageData {
  comments: Comment[];
  total: number;
  page: number;
  totalPages: number;
}

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

export default function DashboardCommentsPage() {
  const router = useRouter();
  const [data, setData] = useState<PageData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  const [page, setPage] = useState(1);
  const [statusFilter, setStatusFilter] = useState("");
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [selectAll, setSelectAll] = useState(false);

  const fetchComments = useCallback(async () => {
    setIsLoading(true);
    setError("");
    setSelectedIds(new Set());
    setSelectAll(false);
    try {
      const params = new URLSearchParams({
        page: String(page),
        pageSize: "20",
      });
      if (statusFilter) params.set("status", statusFilter);

      const res = await fetch(`/api/comments?${params}`);
      if (res.status === 403) {
        router.push("/dashboard");
        return;
      }
      if (!res.ok) throw new Error("获取失败");
      setData(await res.json());
    } catch {
      setError("获取评论列表失败");
    } finally {
      setIsLoading(false);
    }
  }, [page, statusFilter, router]);

  useEffect(() => {
    fetchComments();
  }, [fetchComments]);

  const toggleSelect = (id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const toggleSelectAll = () => {
    if (selectAll) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(data?.comments.map((c) => c.id) ?? []));
    }
    setSelectAll(!selectAll);
  };

  const batchModerate = async (status?: string) => {
    if (selectedIds.size === 0) return;
    if (
      status &&
      !confirm(
        `将选中的 ${selectedIds.size} 条评论标记为「${statusLabels[status] ?? status}」？`
      )
    )
      return;
    if (!status && !confirm(`确定删除选中的 ${selectedIds.size} 条评论？`))
      return;

    const action = status ? "moderate" : "delete";
    const body = status
      ? {
          action,
          commentIds: Array.from(selectedIds),
          status,
        }
      : { action, commentIds: Array.from(selectedIds) };

    try {
      const res = await fetch("/api/admin/comments/batch", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      if (res.ok) {
        fetchComments();
      } else {
        const result = await res.json();
        alert(result.error || "操作失败");
      }
    } catch {
      alert("操作失败");
    }
  };

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">评论管理</h1>

      <div className="flex flex-wrap items-center gap-3">
        <select
          value={statusFilter}
          onChange={(e) => {
            setStatusFilter(e.target.value);
            setPage(1);
          }}
          className="rounded-lg border px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-primary"
        >
          <option value="">全部状态</option>
          <option value="PENDING">待审核</option>
          <option value="APPROVED">已通过</option>
          <option value="SPAM">垃圾</option>
          <option value="DELETED">已删除</option>
        </select>

        {selectedIds.size > 0 && (
          <div className="flex items-center gap-2">
            <span className="text-sm text-muted-foreground">
              已选 {selectedIds.size} 条
            </span>
            <button
              onClick={() => batchModerate("APPROVED")}
              className="rounded-lg border px-3 py-1.5 text-xs hover:bg-muted"
            >
              通过
            </button>
            <button
              onClick={() => batchModerate("SPAM")}
              className="rounded-lg border px-3 py-1.5 text-xs hover:bg-muted"
            >
              垃圾
            </button>
            <button
              onClick={() => batchModerate()}
              className="rounded-lg border px-3 py-1.5 text-xs text-destructive hover:bg-muted"
            >
              删除
            </button>
          </div>
        )}
      </div>

      {error && <p className="text-sm text-destructive">{error}</p>}

      {isLoading ? (
        <p className="py-12 text-center text-muted-foreground">加载中...</p>
      ) : !data || data.comments.length === 0 ? (
        <p className="py-12 text-center text-muted-foreground">暂无评论</p>
      ) : (
        <div className="overflow-x-auto rounded-lg border">
          <table className="w-full text-sm">
            <thead className="bg-muted/50">
              <tr>
                <th className="w-10 px-4 py-3">
                  <input
                    type="checkbox"
                    checked={selectAll && data.comments.length > 0}
                    onChange={toggleSelectAll}
                    className="rounded border-gray-300"
                  />
                </th>
                <th className="px-4 py-3 text-left font-medium">内容</th>
                <th className="px-4 py-3 text-left font-medium">作者</th>
                <th className="px-4 py-3 text-left font-medium">文章</th>
                <th className="px-4 py-3 text-left font-medium">状态</th>
                <th className="px-4 py-3 text-left font-medium">时间</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {data.comments.map((comment) => (
                <tr key={comment.id} className="hover:bg-muted/30">
                  <td className="px-4 py-3">
                    <input
                      type="checkbox"
                      checked={selectedIds.has(comment.id)}
                      onChange={() => toggleSelect(comment.id)}
                      className="rounded border-gray-300"
                    />
                  </td>
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
                    {new Date(comment.createdAt).toLocaleDateString("zh-CN")}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {data && data.totalPages > 1 && (
        <div className="flex items-center justify-center gap-2">
          <button
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={page <= 1}
            className="rounded border px-3 py-1 text-sm hover:bg-muted disabled:opacity-50"
          >
            上一页
          </button>
          <span className="text-sm text-muted-foreground">
            {data.page} / {data.totalPages}
          </span>
          <button
            onClick={() => setPage((p) => Math.min(data.totalPages, p + 1))}
            disabled={page >= data.totalPages}
            className="rounded border px-3 py-1 text-sm hover:bg-muted disabled:opacity-50"
          >
            下一页
          </button>
        </div>
      )}
    </div>
  );
}
