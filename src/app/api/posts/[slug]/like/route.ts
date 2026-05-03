import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function POST(
  _request: Request,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "请先登录" }, { status: 401 });
    }

    const { slug } = await params;

    const post = await prisma.post.findUnique({ where: { slug } });
    if (!post) {
      return NextResponse.json({ error: "文章不存在" }, { status: 404 });
    }

    const existing = await prisma.like.findUnique({
      where: { userId_postId: { userId: session.user.id, postId: post.id } },
    });

    if (existing) {
      await prisma.like.delete({ where: { id: existing.id } });
      const count = await prisma.like.count({ where: { postId: post.id } });
      return NextResponse.json({ liked: false, count });
    } else {
      await prisma.like.create({
        data: { userId: session.user.id, postId: post.id },
      });
      const count = await prisma.like.count({ where: { postId: post.id } });
      return NextResponse.json({ liked: true, count });
    }
  } catch (error) {
    console.error("like error:", error);
    return NextResponse.json({ error: "操作失败" }, { status: 500 });
  }
}
