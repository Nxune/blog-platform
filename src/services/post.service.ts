import { prisma } from "@/lib/prisma";
import { slugify } from "@/lib/utils";
import type { PostStatus } from "@prisma/client";

const postInclude = {
  author: {
    select: { id: true, name: true, email: true, avatar: true },
  },
  tags: {
    include: { tag: true },
  },
  category: true,
  _count: {
    select: { comments: true },
  },
} as const;

export interface ListPostsParams {
  page?: number;
  pageSize?: number;
  status?: PostStatus;
  tag?: string;
  search?: string;
  authorId?: string;
}

export async function listPosts(params: ListPostsParams) {
  const { page = 1, pageSize = 10, status, tag, search, authorId } = params;

  const where: Record<string, unknown> = {};

  if (status) where.status = status;
  if (authorId) where.authorId = authorId;

  if (tag) {
    where.tags = { some: { tag: { slug: tag } } };
  }

  if (search) {
    where.OR = [
      { title: { contains: search } },
      { content: { contains: search } },
    ];
  }

  const [posts, total] = await Promise.all([
    prisma.post.findMany({
      where,
      include: postInclude,
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * pageSize,
      take: pageSize,
    }),
    prisma.post.count({ where }),
  ]);

  return {
    posts: posts.map(mapPost),
    total,
    page,
    pageSize,
    totalPages: Math.ceil(total / pageSize),
  };
}

export async function getPostBySlug(slug: string) {
  const post = await prisma.post.findUnique({
    where: { slug },
    include: postInclude,
  });
  return post ? mapPost(post) : null;
}

export async function getPostById(id: string) {
  const post = await prisma.post.findUnique({
    where: { id },
    include: postInclude,
  });
  return post ? mapPost(post) : null;
}

export async function createPost(data: {
  title: string;
  content: string;
  excerpt?: string;
  coverImage?: string;
  status?: PostStatus;
  tags?: string[];
  categoryId?: string;
  authorId: string;
}) {
  const slug = slugify(data.title);
  const existing = await prisma.post.findUnique({ where: { slug } });
  const uniqueSlug = existing ? `${slug}-${Date.now()}` : slug;

  const post = await prisma.post.create({
    data: {
      title: data.title,
      slug: uniqueSlug,
      content: data.content,
      excerpt: data.excerpt,
      coverImage: data.coverImage,
      status: data.status ?? "DRAFT",
      publishedAt: data.status === "PUBLISHED" ? new Date() : null,
      authorId: data.authorId,
      categoryId: data.categoryId,
      tags: data.tags
        ? {
            create: data.tags.map((tagId) => ({
              tag: { connect: { id: tagId } },
            })),
          }
        : undefined,
    },
    include: postInclude,
  });

  return mapPost(post);
}

export async function updatePost(
  id: string,
  data: {
    title?: string;
    content?: string;
    excerpt?: string;
    coverImage?: string;
    status?: PostStatus;
    tags?: string[];
    categoryId?: string | null;
  }
) {
  const updateData: Record<string, unknown> = {};

  if (data.title !== undefined) {
    updateData.title = data.title;
    updateData.slug = slugify(data.title);
  }
  if (data.content !== undefined) updateData.content = data.content;
  if (data.excerpt !== undefined) updateData.excerpt = data.excerpt;
  if (data.coverImage !== undefined) updateData.coverImage = data.coverImage;
  if (data.status !== undefined) {
    updateData.status = data.status;
    updateData.publishedAt = data.status === "PUBLISHED" ? new Date() : null;
  }
  if (data.categoryId !== undefined) updateData.categoryId = data.categoryId;

  if (data.tags !== undefined) {
    await prisma.postTag.deleteMany({ where: { postId: id } });
    if (data.tags.length > 0) {
      await prisma.postTag.createMany({
        data: data.tags.map((tagId) => ({ postId: id, tagId })),
      });
    }
  }

  const post = await prisma.post.update({
    where: { id },
    data: updateData,
    include: postInclude,
  });

  return mapPost(post);
}

export async function deletePost(id: string) {
  await prisma.post.delete({ where: { id } });
}

export async function updateViewCount(slug: string) {
  const post = await prisma.post.update({
    where: { slug },
    data: { viewCount: { increment: 1 } },
  });
  return post.viewCount;
}

import type { Post } from "@/types/post";

function mapPost(post: Record<string, unknown>): Post {
  const author = post.author as Record<string, unknown> | undefined;
  return {
    ...post,
    author: author
      ? { ...author, image: author.avatar ?? null }
      : undefined,
  } as Post;
}
