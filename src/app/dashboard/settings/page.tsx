"use client";

import { useState } from "react";
import { useAuth } from "@/hooks/useAuth";

export default function DashboardSettingsPage() {
  const { user } = useAuth();
  const [name, setName] = useState(user?.name ?? "");

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">设置</h1>

      <div className="max-w-md space-y-4">
        <div>
          <label className="block text-sm font-medium">邮箱</label>
          <p className="mt-1 text-sm text-muted-foreground">{user?.email}</p>
        </div>

        <div>
          <label htmlFor="name" className="block text-sm font-medium">
            用户名
          </label>
          <input
            id="name"
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="mt-1 w-full rounded-lg border px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-primary"
          />
        </div>
      </div>
    </div>
  );
}
