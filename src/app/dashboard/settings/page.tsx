"use client";

import { useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useSession } from "next-auth/react";

export default function DashboardSettingsPage() {
  const { user } = useAuth();
  const { update } = useSession();
  const [name, setName] = useState(user?.name ?? "");
  const [username, setUsername] = useState(user?.username ?? "");
  const [bio, setBio] = useState(user?.bio ?? "");
  const [website, setWebsite] = useState(user?.website ?? "");
  const [location, setLocation] = useState(user?.location ?? "");

  // Email change
  const [newEmail, setNewEmail] = useState("");
  const [emailPassword, setEmailPassword] = useState("");

  // Password change
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const [loading, setLoading] = useState<"name" | "email" | "password" | null>(null);

  const showMessage = (type: "success" | "error", text: string) => {
    setMessage({ type, text });
    setTimeout(() => setMessage(null), 3000);
  };

  const handleSaveProfile = async () => {
    setLoading("name");
    try {
      const res = await fetch("/api/auth/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, username, bio, website, location }),
      });
      if (res.ok) {
        showMessage("success", "个人资料已更新");
        await update({ name });
      } else {
        const data = await res.json();
        showMessage("error", data.error ?? "更新失败");
      }
    } catch {
      showMessage("error", "更新失败，请重试");
    } finally {
      setLoading(null);
    }
  };

  const handleChangeEmail = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading("email");
    try {
      const res = await fetch("/api/auth/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ type: "email", email: newEmail, password: emailPassword }),
      });
      const data = await res.json();
      if (res.ok) {
        showMessage("success", data.message ?? "邮箱已更新");
        await update({ email: newEmail });
        setNewEmail("");
        setEmailPassword("");
      } else {
        showMessage("error", data.error ?? "更新失败");
      }
    } catch {
      showMessage("error", "更新失败，请重试");
    } finally {
      setLoading(null);
    }
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newPassword !== confirmPassword) {
      showMessage("error", "两次输入的新密码不一致");
      return;
    }
    setLoading("password");
    try {
      const res = await fetch("/api/auth/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ type: "password", currentPassword, newPassword }),
      });
      const data = await res.json();
      if (res.ok) {
        showMessage("success", data.message ?? "密码已更新");
        setCurrentPassword("");
        setNewPassword("");
        setConfirmPassword("");
      } else {
        showMessage("error", data.error ?? "更新失败");
      }
    } catch {
      showMessage("error", "更新失败，请重试");
    } finally {
      setLoading(null);
    }
  };

  return (
    <div className="mx-auto max-w-lg space-y-8">
      <h1 className="text-2xl font-bold">账号设置</h1>

      {message && (
        <div
          className={`rounded-lg px-4 py-2 text-sm ${
            message.type === "success"
              ? "bg-green-50 text-green-700"
              : "bg-red-50 text-red-700"
          }`}
        >
          {message.text}
        </div>
      )}

      {/* 用户名 */}
      <section className="space-y-4 rounded-lg border p-6">
        <h2 className="font-semibold">用户名</h2>
        <div>
          <label htmlFor="name" className="block text-sm font-medium">
            显示名称
          </label>
          <input
            id="name"
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="mt-1 w-full rounded-lg border px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-primary"
          />
        </div>
        <button
          onClick={handleSaveName}
          disabled={loading === "name"}
          className="rounded-lg bg-primary px-4 py-2 text-sm text-primary-foreground hover:opacity-90 disabled:opacity-50"
        >
          {loading === "name" ? "保存中..." : "保存"}
        </button>
      </section>

      {/* 修改邮箱 */}
      <section className="space-y-4 rounded-lg border p-6">
        <h2 className="font-semibold">修改邮箱</h2>
        <p className="text-sm text-muted-foreground">当前邮箱：{user?.email}</p>
        <form onSubmit={handleChangeEmail} className="space-y-3">
          <div>
            <label htmlFor="newEmail" className="block text-sm font-medium">
              新邮箱地址
            </label>
            <input
              id="newEmail"
              type="email"
              value={newEmail}
              onChange={(e) => setNewEmail(e.target.value)}
              required
              className="mt-1 w-full rounded-lg border px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-primary"
            />
          </div>
          <div>
            <label htmlFor="emailPassword" className="block text-sm font-medium">
              当前密码（用于确认身份）
            </label>
            <input
              id="emailPassword"
              type="password"
              value={emailPassword}
              onChange={(e) => setEmailPassword(e.target.value)}
              required
              className="mt-1 w-full rounded-lg border px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-primary"
            />
          </div>
          <button
            type="submit"
            disabled={loading === "email"}
            className="rounded-lg bg-primary px-4 py-2 text-sm text-primary-foreground hover:opacity-90 disabled:opacity-50"
          >
            {loading === "email" ? "更新中..." : "更新邮箱"}
          </button>
        </form>
      </section>

      {/* 修改密码 */}
      <section className="space-y-4 rounded-lg border p-6">
        <h2 className="font-semibold">修改密码</h2>
        <form onSubmit={handleChangePassword} className="space-y-3">
          <div>
            <label htmlFor="currentPassword" className="block text-sm font-medium">
              当前密码
            </label>
            <input
              id="currentPassword"
              type="password"
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
              required
              className="mt-1 w-full rounded-lg border px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-primary"
            />
          </div>
          <div>
            <label htmlFor="newPassword" className="block text-sm font-medium">
              新密码（至少 8 个字符）
            </label>
            <input
              id="newPassword"
              type="password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              required
              minLength={8}
              className="mt-1 w-full rounded-lg border px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-primary"
            />
          </div>
          <div>
            <label htmlFor="confirmPassword" className="block text-sm font-medium">
              确认新密码
            </label>
            <input
              id="confirmPassword"
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              required
              className="mt-1 w-full rounded-lg border px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-primary"
            />
          </div>
          <button
            type="submit"
            disabled={loading === "password"}
            className="rounded-lg bg-primary px-4 py-2 text-sm text-primary-foreground hover:opacity-90 disabled:opacity-50"
          >
            {loading === "password" ? "更新中..." : "更新密码"}
          </button>
        </form>
      </section>
    </div>
  );
}
