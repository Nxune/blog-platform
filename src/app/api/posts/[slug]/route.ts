import { NextResponse } from "next/server";
import { getPostBySlug, updatePost, deletePost, updateViewCount } from "@/services/post.service";
import { requireOwner } from "@/lib/auth-helpers";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ slug: string }> }
) {
  const { slug } = await params;
  const post = await getPostBySlug(slug);

  if (!post) {
    return NextResponse.json({ error: "文章不存在" }, { status: 404 });
  }

  updateViewCount(slug).catch(() => {});

  const session = await auth();
  const likeCount = await prisma.like.count({ where: { postId: post.id } });
  let liked = false;
  if (session?.user?.id) {
    const existing = await prisma.like.findUnique({
      where: { userId_postId: { userId: session.user.id, postId: post.id } },
    });
    liked = !!existing;
  }

  return NextResponse.json({ ...post, likeCount, liked });
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ slug: string }> }
) {
  const { slug } = await params;
  const post = await getPostBySlug(slug);

  if (!post) {
    return NextResponse.json({ error: "文章不存在" }, { status: 404 });
  }

  try {
    await requireOwner(post.authorId, "文章");
  } catch (error) {
    if (error instanceof Error && error.message === "UNAUTHORIZED") {
      return NextResponse.json({ error: "请先登录" }, { status: 401 });
    }
    return NextResponse.json({ error: "无权限" }, { status: 403 });
  }

  const body = await request.json();
  const updated = await updatePost(post.id, body);

  return NextResponse.json(updated);
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await params;
    const post = await getPostBySlug(slug);

    if (!post) {
      return NextResponse.json({ error: "文章不存在" }, { status: 404 });
    }

    await requireOwner(post.authorId, "文章");

    await deletePost(post.id);
    return NextResponse.json({ success: true });
  } catch (error) {
    if (error instanceof Error && error.message === "FORBIDDEN") {
      return NextResponse.json({ error: "无权限" }, { status: 403 });
    }
    if (error instanceof Error && error.message === "UNAUTHORIZED") {
      return NextResponse.json({ error: "请先登录" }, { status: 401 });
    }
    return NextResponse.json({ error: "操作失败" }, { status: 500 });
  }
}
