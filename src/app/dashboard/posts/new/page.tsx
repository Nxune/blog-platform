"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Editor } from "@/components/editor/Editor";

export default function NewPostPage() {
  const router = useRouter();
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !content.trim()) return;

    setIsSubmitting(true);
    try {
      const res = await fetch("/api/posts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title, content, published: false }),
      });

      if (res.ok) {
        router.push("/dashboard/posts");
        router.refresh();
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">新建文章</h1>
      <form onSubmit={handleSubmit} className="space-y-4">
        <input
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="文章标题"
          className="w-full rounded-lg border px-4 py-3 text-lg font-medium outline-none focus:ring-2 focus:ring-primary"
        />
        <Editor onChange={setContent} />
        <div className="flex justify-end gap-3">
          <button
            type="submit"
            disabled={isSubmitting || !title.trim() || !content.trim()}
            className="rounded-lg bg-primary px-6 py-2 text-sm text-primary-foreground hover:opacity-90 disabled:opacity-50"
          >
            {isSubmitting ? "保存中..." : "保存草稿"}
          </button>
        </div>
      </form>
    </div>
  );
}
