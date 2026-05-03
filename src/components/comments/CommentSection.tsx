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
        <p className="text-sm text-muted-foreground">加载评论中...</p>
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
