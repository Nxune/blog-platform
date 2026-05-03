import { prisma } from "@/lib/prisma";
import type { Comment } from "@/types/comment";
import type { CommentStatus } from "@prisma/client";

const commentInclude = {
  author: {
    select: { id: true, name: true, email: true, image: true },
  },
} as const;

function mapComment(comment: Record<string, unknown>): Comment {
  const author = comment.author as Record<string, unknown> | undefined;
  const replies = comment.replies as Record<string, unknown>[] | undefined;
  return {
    ...comment,
    status: (comment.status as CommentStatus) ?? "APPROVED",
    author: author
      ? { ...author, image: (author.image as string | null) ?? null }
      : (undefined as unknown as Comment["author"]),
    replies: replies ? replies.map(mapComment) : undefined,
  } as Comment;
}

export async function getCommentsByPostSlug(postSlug: string) {
  const post = await prisma.post.findUnique({
    where: { slug: postSlug },
    select: { id: true },
  });

  if (!post) throw new Error("NOT_FOUND");

  const comments = await prisma.comment.findMany({
    where: {
      postId: post.id,
      status: "APPROVED",
    },
    include: {
      ...commentInclude,
      replies: {
        include: commentInclude,
        orderBy: { createdAt: "asc" },
      },
    },
    orderBy: { createdAt: "desc" },
  });

  return comments.map(mapComment);
}

export async function createComment(data: {
  content: string;
  authorId: string;
  postSlug: string;
  parentId?: string;
}) {
  const post = await prisma.post.findUnique({
    where: { slug: data.postSlug },
    select: { id: true, published: true },
  });

  if (!post || !post.published) {
    throw new Error("POST_NOT_FOUND");
  }

  if (data.parentId) {
    const parent = await prisma.comment.findUnique({
      where: { id: data.parentId },
    });
    if (!parent || parent.postId !== post.id) {
      throw new Error("PARENT_NOT_FOUND");
    }
  }

  const status: CommentStatus = detectSpam(data.content) ? "PENDING" : "APPROVED";

  const comment = await prisma.comment.create({
    data: {
      content: data.content,
      authorId: data.authorId,
      postId: post.id,
      parentId: data.parentId ?? null,
      status,
    },
    include: commentInclude,
  });

  return mapComment(comment);
}

export async function moderateComment(commentId: string, status: CommentStatus) {
  const comment = await prisma.comment.update({
    where: { id: commentId },
    data: { status },
    include: commentInclude,
  });
  return mapComment(comment);
}

export async function getCommentById(commentId: string) {
  return prisma.comment.findUnique({
    where: { id: commentId },
    select: { id: true, authorId: true, postId: true, content: true, status: true },
  });
}

export async function deleteComment(commentId: string) {
  await prisma.comment.delete({ where: { id: commentId } });
}

export async function listAllComments(params: {
  page?: number;
  pageSize?: number;
  status?: CommentStatus;
}) {
  const { page = 1, pageSize = 20, status } = params;
  const where = status !== undefined ? { status } : {};

  const [comments, total] = await Promise.all([
    prisma.comment.findMany({
      where,
      include: {
        ...commentInclude,
        post: { select: { id: true, title: true, slug: true } },
      },
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * pageSize,
      take: pageSize,
    }),
    prisma.comment.count({ where }),
  ]);

  return {
    comments: comments.map((c) => ({
      ...c,
      author: { ...c.author, image: c.author.image ?? null },
    })),
    total,
    page,
    pageSize,
    totalPages: Math.ceil(total / pageSize),
  };
}

function detectSpam(content: string): boolean {
  const spamPatterns = [
    /(https?:\/\/[^\s]+){3,}/i,
    /(?:buy|click|cheap|free|earn money|subscribe|promotion)/i,
    /(?:\[.*?\]\(.*?\)){3,}/,
  ];
  return spamPatterns.some((pattern) => pattern.test(content));
}
