import { prisma } from "@/lib/prisma";
import type { CommentStatus } from "@prisma/client";

const commentInclude = {
  author: {
    select: { id: true, name: true, email: true, image: true },
  },
} as const;

export async function getCommentsByPostSlug(postSlug: string) {
  // Verify post exists
  const post = await prisma.post.findUnique({
    where: { slug: postSlug },
    select: { id: true },
  });

  if (!post) {
    throw new Error("NOT_FOUND");
  }

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

  return comments;
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

  // Basic spam detection
  const status = detectSpam(data.content) ? "SPAM" : "APPROVED";

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

  return comment;
}

export async function moderateComment(commentId: string, status: CommentStatus) {
  const comment = await prisma.comment.update({
    where: { id: commentId },
    data: { status },
    include: commentInclude,
  });
  return comment;
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
  const where = status ? { status } : {};

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

  return { comments, total, page, pageSize, totalPages: Math.ceil(total / pageSize) };
}

function detectSpam(content: string): boolean {
  const spamPatterns = [
    /(https?:\/\/[^\s]+){3,}/i,
    /(?:buy|click|cheap|free|earn money|subscribe|promotion)/i,
    /(?:\[.*?\]\(.*?\)){3,}/,
  ];

  return spamPatterns.some((pattern) => pattern.test(content));
}
