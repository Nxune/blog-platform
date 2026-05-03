import type { CommentStatus } from "@prisma/client";

export interface Comment {
  id: string;
  content: string;
  createdAt: Date;
  updatedAt: Date;
  authorId: string;
  author: {
    id: string;
    name: string | null;
    email: string;
    image: string | null;
  };
  postId: string;
  parentId: string | null;
  status: CommentStatus;
  replies?: Comment[];
}
