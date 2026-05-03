"use client";

import type { Comment } from "@/types/comment";
import { formatDate } from "@/lib/utils";

interface CommentTreeProps {
  comments: Comment[];
  onReply: (parentId: string) => void;
  replyId: string | null;
  replyForm: React.ReactNode;
}

function CommentCard({
  comment,
  onReply,
  isReply = false,
  replyId,
  replyForm,
}: {
  comment: Comment;
  onReply: (parentId: string) => void;
  isReply?: boolean;
  replyId: string | null;
  replyForm: React.ReactNode;
}) {
  return (
    <div className={`space-y-2 ${isReply ? "ml-8 border-l pl-4" : ""}`}>
      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        <span className="font-medium text-foreground">
          {comment.author.name || comment.author.email}
        </span>
        <span>{formatDate(comment.createdAt)}</span>
      </div>
      <p className="text-sm leading-relaxed">{comment.content}</p>
      <button
        type="button"
        onClick={() => onReply(comment.id)}
        className="text-xs text-muted-foreground hover:text-primary"
        aria-label={`回复 ${comment.author.name || comment.author.email}`}
      >
        回复
      </button>
      {replyId === comment.id && replyForm}

      {(comment as Comment & { replies?: Comment[] }).replies?.map((reply) => (
        <CommentCard
          key={reply.id}
          comment={reply}
          onReply={onReply}
          isReply
          replyId={replyId}
          replyForm={replyForm}
        />
      ))}
    </div>
  );
}

export function CommentTree({
  comments,
  onReply,
  replyId,
  replyForm,
}: CommentTreeProps) {
  if (comments.length === 0) {
    return <p className="py-4 text-sm text-muted-foreground">暂无评论</p>;
  }

  return (
    <div className="space-y-6">
      {comments.map((comment) => (
        <CommentCard
          key={comment.id}
          comment={comment}
          onReply={onReply}
          replyId={replyId}
          replyForm={replyForm}
        />
      ))}
    </div>
  );
}
