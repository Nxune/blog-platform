import { prisma } from "@/lib/prisma";
import { slugify } from "@/lib/utils";

const postInclude = {
  author: {
    select: { id: true, name: true, email: true, image: true },
  },
  tags: {
    include: { tag: true },
  },
  _count: {
    select: { comments: true },
  },
} as const;

export interface ListPostsParams {
  page?: number;
  pageSize?: number;
  published?: boolean;
  tag?: string;
  search?: string;
  authorId?: string;
}

export async function listPosts(params: ListPostsParams) {
  const { page = 1, pageSize = 10, published, tag, search, authorId } = params;

  const where: Record<string, unknown> = {};

  if (published !== undefined) {
    where.published = published;
  }

  if (authorId) {
    where.authorId = authorId;
  }

  if (tag) {
    where.tags = { some: { tag: { slug: tag } } };
  }

  if (search) {
    where.OR = [
      { title: { contains: search, mode: "insensitive" } },
      { content: { contains: search, mode: "insensitive" } },
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
    posts,
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
  return post;
}

export async function getPostById(id: string) {
  const post = await prisma.post.findUnique({
    where: { id },
    include: postInclude,
  });
  return post;
}

export async function createPost(data: {
  title: string;
  content: string;
  excerpt?: string;
  coverImage?: string;
  published?: boolean;
  featured?: boolean;
  tags?: string[];
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
      published: data.published ?? false,
      featured: data.featured ?? false,
      publishedAt: data.published ? new Date() : null,
      authorId: data.authorId,
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

  return post;
}

export async function updatePost(
  id: string,
  data: {
    title?: string;
    content?: string;
    excerpt?: string;
    coverImage?: string;
    published?: boolean;
    featured?: boolean;
    tags?: string[];
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
  if (data.published !== undefined) {
    updateData.published = data.published;
    updateData.publishedAt = data.published ? new Date() : null;
  }
  if (data.featured !== undefined) updateData.featured = data.featured;

  if (data.tags !== undefined) {
    await prisma.tagOnPost.deleteMany({ where: { postId: id } });
    if (data.tags.length > 0) {
      await prisma.tagOnPost.createMany({
        data: data.tags.map((tagId) => ({ postId: id, tagId })),
      });
    }
  }

  const post = await prisma.post.update({
    where: { id },
    data: updateData,
    include: postInclude,
  });

  return post;
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
