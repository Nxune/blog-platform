import { NextResponse } from "next/server";
import { getPostBySlug, updatePost, deletePost, updateViewCount } from "@/services/post.service";
import { requireAdmin } from "@/lib/auth-helpers";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ slug: string }> }
) {
  const { slug } = await params;
  const post = await getPostBySlug(slug);

  if (!post) {
    return NextResponse.json({ error: "文章不存在" }, { status: 404 });
  }

  // Increment view count asynchronously
  updateViewCount(slug).catch(() => {});

  return NextResponse.json(post);
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    await requireAdmin();
  } catch {
    return NextResponse.json({ error: "无权限" }, { status: 403 });
  }

  const { slug } = await params;
  const post = await getPostBySlug(slug);

  if (!post) {
    return NextResponse.json({ error: "文章不存在" }, { status: 404 });
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
    await requireAdmin();
  } catch {
    return NextResponse.json({ error: "无权限" }, { status: 403 });
  }

  const { slug } = await params;
  const post = await getPostBySlug(slug);

  if (!post) {
    return NextResponse.json({ error: "文章不存在" }, { status: 404 });
  }

  await deletePost(post.id);
  return NextResponse.json({ success: true });
}
