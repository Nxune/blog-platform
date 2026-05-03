"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";

interface User {
  id: string;
  name: string | null;
  email: string;
  role: string;
  createdAt: string;
  _count: { posts: number; comments: number };
}

interface PageData {
  users: User[];
  total: number;
  page: number;
  totalPages: number;
}

const roleLabels: Record<string, string> = {
  SUPER_ADMIN: "超级管理员",
  ADMIN: "管理员",
  USER: "用户",
};

const roleColors: Record<string, string> = {
  SUPER_ADMIN: "bg-purple-100 text-purple-700",
  ADMIN: "bg-blue-100 text-blue-700",
  USER: "bg-gray-100 text-gray-700",
};

export default function AdminUsersPage() {
  const { data: session } = useSession();
  const router = useRouter();
  const [data, setData] = useState<PageData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");

  // Selection state
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [selectAll, setSelectAll] = useState(false);

  // Password confirmation modal
  const [password, setPassword] = useState("");
  const [modalAction, setModalAction] = useState<{
    type: "role" | "delete" | "batch-role" | "batch-delete";
    userId?: string;
    newRole?: string;
  } | null>(null);
  const [actionError, setActionError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const currentUserId = (session?.user as Record<string, unknown> | undefined)
    ?.id as string | undefined;

  const fetchUsers = useCallback(async () => {
    setIsLoading(true);
    setError("");
    setSelectedIds(new Set());
    setSelectAll(false);
    try {
      const params = new URLSearchParams({ page: String(page), pageSize: "20" });
      if (search) params.set("search", search);
      const res = await fetch(`/api/admin/users?${params}`);
      if (res.status === 403) {
        router.push("/dashboard");
        return;
      }
      if (!res.ok) throw new Error("获取失败");
      setData(await res.json());
    } catch {
      setError("获取用户列表失败");
    } finally {
      setIsLoading(false);
    }
  }, [page, search, router]);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

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
      setSelectedIds(new Set(data?.users.map((u) => u.id) ?? []));
    }
    setSelectAll(!selectAll);
  };

  const handleRoleChange = (userId: string, newRole: string) => {
    setModalAction({ type: "role", userId, newRole });
    setPassword("");
    setActionError("");
  };

  const handleDelete = (userId: string) => {
    setModalAction({ type: "delete", userId });
    setPassword("");
    setActionError("");
  };

  const handleBatchRole = (newRole: string) => {
    setModalAction({ type: "batch-role", newRole });
    setPassword("");
    setActionError("");
  };

  const handleBatchDelete = () => {
    setModalAction({ type: "batch-delete" });
    setPassword("");
    setActionError("");
  };

  const confirmAction = async () => {
    if (!modalAction || !password) return;
    setIsSubmitting(true);
    setActionError("");

    try {
      let res: Response;

      if (modalAction.type === "role") {
        res = await fetch(
          `/api/admin/users/${modalAction.userId}/role`,
          {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              role: modalAction.newRole,
              password,
            }),
          }
        );
      } else if (modalAction.type === "delete") {
        res = await fetch(`/api/admin/users/${modalAction.userId}`, {
          method: "DELETE",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ password }),
        });
      } else {
        res = await fetch("/api/admin/users/batch", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            action:
              modalAction.type === "batch-role" ? "role" : "delete",
            userIds: Array.from(selectedIds),
            role: modalAction.newRole,
            password,
          }),
        });
      }

      const result = await res.json();
      if (!res.ok) {
        setActionError(result.error || "操作失败");
        return;
      }

      setModalAction(null);
      setPassword("");
      setSelectedIds(new Set());
      setSelectAll(false);
      fetchUsers();
    } catch {
      setActionError("网络错误");
    } finally {
      setIsSubmitting(false);
    }
  };

  const isSelectable = (user: User) =>
    user.id !== currentUserId && user.role !== "SUPER_ADMIN";

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">用户管理</h1>

      <div className="flex gap-2">
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && fetchUsers()}
          placeholder="搜索邮箱或用户名..."
          className="flex-1 rounded-lg border px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-primary"
        />
        <button
          onClick={fetchUsers}
          className="rounded-lg border px-4 py-2 text-sm hover:bg-muted"
        >
          搜索
        </button>
      </div>

      {error && <p className="text-sm text-destructive">{error}</p>}

      {selectedIds.size > 0 && (
        <div className="flex items-center gap-2 rounded-lg border bg-muted/30 px-4 py-2">
          <span className="text-sm text-muted-foreground">
            已选 {selectedIds.size} 位用户
          </span>
          <button
            onClick={() => handleBatchRole("ADMIN")}
            className="rounded border px-3 py-1 text-xs hover:bg-muted"
          >
            设为管理员
          </button>
          <button
            onClick={() => handleBatchRole("USER")}
            className="rounded border px-3 py-1 text-xs hover:bg-muted"
          >
            设为用户
          </button>
          <button
            onClick={handleBatchDelete}
            className="rounded border px-3 py-1 text-xs text-destructive hover:bg-muted"
          >
            批量删除
          </button>
        </div>
      )}

      {isLoading ? (
        <p className="py-12 text-center text-muted-foreground">加载中...</p>
      ) : !data || data.users.length === 0 ? (
        <p className="py-12 text-center text-muted-foreground">暂无用户</p>
      ) : (
        <div className="overflow-x-auto rounded-lg border">
          <table className="w-full text-sm">
            <thead className="bg-muted/50">
              <tr>
                <th className="w-10 px-4 py-3">
                  <input
                    type="checkbox"
                    checked={
                      selectAll &&
                      data.users.filter(isSelectable).length > 0
                    }
                    onChange={toggleSelectAll}
                    className="rounded border-gray-300"
                  />
                </th>
                <th className="px-4 py-3 text-left font-medium">用户</th>
                <th className="px-4 py-3 text-left font-medium">邮箱</th>
                <th className="px-4 py-3 text-left font-medium">角色</th>
                <th className="px-4 py-3 text-left font-medium">文章</th>
                <th className="px-4 py-3 text-left font-medium">评论</th>
                <th className="px-4 py-3 text-left font-medium">注册时间</th>
                <th className="px-4 py-3 text-left font-medium">操作</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {data.users.map((user) => {
                const isSelf = user.id === currentUserId;
                const isSuperAdmin = user.role === "SUPER_ADMIN";
                const canManage = !isSelf && !isSuperAdmin;

                return (
                  <tr key={user.id} className="hover:bg-muted/30">
                    <td className="px-4 py-3">
                      <input
                        type="checkbox"
                        checked={selectedIds.has(user.id)}
                        onChange={() => toggleSelect(user.id)}
                        disabled={!canManage}
                        className="rounded border-gray-300"
                      />
                    </td>
                    <td className="px-4 py-3 font-medium">
                      {user.name || "未设置"}
                      {isSelf && (
                        <span className="ml-2 text-xs text-muted-foreground">
                          (自己)
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-muted-foreground">
                      {user.email}
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={`rounded-full px-2 py-0.5 text-xs ${
                          roleColors[user.role] ?? ""
                        }`}
                      >
                        {roleLabels[user.role] ?? user.role}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-muted-foreground">
                      {user._count.posts}
                    </td>
                    <td className="px-4 py-3 text-muted-foreground">
                      {user._count.comments}
                    </td>
                    <td className="px-4 py-3 text-muted-foreground">
                      {new Date(user.createdAt).toLocaleDateString("zh-CN")}
                    </td>
                    <td className="px-4 py-3">
                      {isSelf ? (
                        <span className="text-xs text-muted-foreground">
                          -
                        </span>
                      ) : isSuperAdmin ? (
                        <span className="text-xs text-muted-foreground">
                          不可操作
                        </span>
                      ) : (
                        <div className="flex gap-2">
                          <select
                            value={user.role}
                            onChange={(e) =>
                              handleRoleChange(user.id, e.target.value)
                            }
                            className="rounded border px-2 py-1 text-xs outline-none"
                          >
                            <option value="USER">用户</option>
                            <option value="ADMIN">管理员</option>
                          </select>
                          <button
                            onClick={() => handleDelete(user.id)}
                            className="text-xs text-destructive hover:underline"
                          >
                            删除
                          </button>
                        </div>
                      )}
                    </td>
                  </tr>
                );
              })}
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
            onClick={() =>
              setPage((p) => Math.min(data.totalPages, p + 1))
            }
            disabled={page >= data.totalPages}
            className="rounded border px-3 py-1 text-sm hover:bg-muted disabled:opacity-50"
          >
            下一页
          </button>
        </div>
      )}

      {modalAction && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="w-full max-w-sm rounded-lg bg-background p-6 shadow-lg">
            <h3 className="mb-2 text-lg font-semibold">
              {modalAction.type === "role"
                ? "确认修改角色"
                : modalAction.type === "delete"
                  ? "确认删除用户"
                  : modalAction.type === "batch-role"
                    ? "批量修改角色"
                    : "批量删除用户"}
            </h3>
            <p className="mb-4 text-sm text-muted-foreground">
              {modalAction.type === "role"
                ? `将用户角色修改为 ${modalAction.newRole === "ADMIN" ? "管理员" : "用户"}`
                : modalAction.type === "delete"
                  ? "此操作不可撤销，确定要删除该用户？"
                  : modalAction.type === "batch-role"
                    ? `将 ${selectedIds.size} 位选中用户的角色修改为 ${modalAction.newRole === "ADMIN" ? "管理员" : "用户"}`
                    : `确定删除选中的 ${selectedIds.size} 位用户？此操作不可撤销。`}
            </p>
            <p className="mb-4 text-xs text-destructive">
              需要输入您的当前密码进行验证
            </p>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="当前密码"
              className="mb-4 w-full rounded-lg border px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-primary"
            />
            {actionError && (
              <p className="mb-4 text-sm text-destructive">{actionError}</p>
            )}
            <div className="flex justify-end gap-3">
              <button
                onClick={() => setModalAction(null)}
                className="rounded-lg border px-4 py-2 text-sm hover:bg-muted"
              >
                取消
              </button>
              <button
                onClick={confirmAction}
                disabled={!password || isSubmitting}
                className={`rounded-lg px-4 py-2 text-sm text-white disabled:opacity-50 ${
                  modalAction.type === "delete" ||
                  modalAction.type === "batch-delete"
                    ? "bg-destructive hover:opacity-90"
                    : "bg-primary hover:opacity-90"
                }`}
              >
                {isSubmitting ? "处理中..." : "确认"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
