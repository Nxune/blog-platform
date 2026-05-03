"use client";

import { useState, useEffect } from "react";
import { CommentForm } from "./CommentForm";
import { CommentTree } from "./CommentTree";
import { useComments } from "@/hooks/useComments";

interface CommentSectionProps {
  postSlug: string;
}

export function CommentSection({ postSlug }: CommentSectionProps) {
  const { comments, isLoading, error, fetchComments, addComment } = useComments(postSlug);
  const [replyId, setReplyId] = useState<string | null>(null);

  useEffect(() => {
    fetchComments();
  }, [fetchComments]);

  const handleSubmit = async (content: string): Promise<boolean> => {
    const success = await addComment(content, replyId ?? undefined);
    if (success) {
      setReplyId(null);
    }
    return success;
  };

  const replyForm = (
    <div className="mt-2">
      <CommentForm
        onSubmit={handleSubmit}
        placeholder="写下你的回复..."
        buttonLabel="回复"
      />
    </div>
  );

  return (
    <section className="space-y-6">
      <h3 className="text-lg font-semibold">评论</h3>

      <CommentForm onSubmit={handleSubmit} />

      {isLoading ? (
        <div className="flex items-center gap-2 py-4 text-sm text-muted-foreground">
          <svg className="h-3.5 w-3.5 animate-spin" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
          </svg>
          <span>加载评论中...</span>
        </div>
      ) : error ? (
        <p className="text-sm text-destructive">{error}</p>
      ) : (
        <CommentTree
          comments={comments}
          onReply={setReplyId}
          replyId={replyId}
          replyForm={replyForm}
        />
      )}
    </section>
  );
}
