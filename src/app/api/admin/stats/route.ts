import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/auth-helpers";

export async function GET() {
  try {
    await requireAdmin();
  } catch {
    return NextResponse.json({ error: "无权限" }, { status: 403 });
  }

  const [
    totalPosts,
    publishedPosts,
    draftPosts,
    totalComments,
    pendingComments,
    totalUsers,
    totalTags,
  ] = await Promise.all([
    prisma.post.count(),
    prisma.post.count({ where: { published: true } }),
    prisma.post.count({ where: { published: false } }),
    prisma.comment.count(),
    prisma.comment.count({ where: { status: "PENDING" } }),
    prisma.user.count(),
    prisma.tag.count(),
  ]);

  return NextResponse.json({
    posts: { total: totalPosts, published: publishedPosts, draft: draftPosts },
    comments: { total: totalComments, pending: pendingComments },
    users: { total: totalUsers },
    tags: { total: totalTags },
  });
}
