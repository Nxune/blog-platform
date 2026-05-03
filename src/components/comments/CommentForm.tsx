"use client";

import { useState } from "react";
import { useAuth } from "@/hooks/useAuth";

interface CommentFormProps {
  onSubmit: (content: string) => Promise<boolean>;
  placeholder?: string;
  buttonLabel?: string;
}

export function CommentForm({ onSubmit, placeholder, buttonLabel }: CommentFormProps) {
  const [content, setContent] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { isAuthenticated } = useAuth();

  if (!isAuthenticated) {
    return (
      <p className="text-sm text-muted-foreground">
        请<a href="/login" className="text-primary hover:underline">登录</a>后发表评论
      </p>
    );
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!content.trim()) return;

    setIsSubmitting(true);
    const success = await onSubmit(content);
    setIsSubmitting(false);

    if (success) {
      setContent("");
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-2">
      <textarea
        value={content}
        onChange={(e) => setContent(e.target.value)}
        placeholder={placeholder ?? "写下你的评论..."}
        rows={3}
        className="w-full rounded-lg border p-3 text-sm outline-none focus:ring-2 focus:ring-primary"
        disabled={isSubmitting}
      />
      <div className="flex justify-end">
        <button
          type="submit"
          disabled={!content.trim() || isSubmitting}
          className="rounded-lg bg-primary px-4 py-2 text-sm text-primary-foreground hover:opacity-90 disabled:opacity-50"
        >
          {isSubmitting ? "提交中..." : buttonLabel ?? "发表评论"}
        </button>
      </div>
    </form>
  );
}
