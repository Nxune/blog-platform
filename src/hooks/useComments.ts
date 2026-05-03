"use client";

import { useState, useCallback } from "react";
import type { Comment } from "@/types/comment";

interface UseCommentsReturn {
  comments: Comment[];
  isLoading: boolean;
  error: string | null;
  fetchComments: () => Promise<void>;
  addComment: (content: string, parentId?: string) => Promise<boolean>;
}

export function useComments(postSlug: string): UseCommentsReturn {
  const [comments, setComments] = useState<Comment[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchComments = useCallback(async () => {
    setIsLoading(true);
    try {
      const res = await fetch(`/api/posts/${postSlug}/comments`);
      if (!res.ok) throw new Error("获取评论失败");
      const data = await res.json();
      setComments(data.comments ?? data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "未知错误");
    } finally {
      setIsLoading(false);
    }
  }, [postSlug]);

  const addComment = useCallback(
    async (content: string, parentId?: string): Promise<boolean> => {
      try {
        const res = await fetch(`/api/posts/${postSlug}/comments`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ content, parentId }),
        });
        if (!res.ok) throw new Error("发表评论失败");
        await fetchComments();
        return true;
      } catch (err) {
        setError(err instanceof Error ? err.message : "未知错误");
        return false;
      }
    },
    [postSlug, fetchComments]
  );

  return { comments, isLoading, error, fetchComments, addComment };
}
