import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth, getUserId } from "@/lib/auth-helpers";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  try {
    const session = await requireAuth();
    const userId = getUserId(session);
    const role = (session.user as Record<string, unknown>).role as string;
    const isSuperAdmin = role === "SUPER_ADMIN";
    const isAdmin = role === "ADMIN" || isSuperAdmin;

    const { searchParams } = new URL(request.url);
    const search = searchParams.get("search") || "";

    const where: Record<string, unknown> = {};

    // Non-admin users only see their own posts
    if (!isAdmin) {
      where.authorId = userId;
    }

    // Search filter
    if (search) {
      if (isSuperAdmin) {
        where.OR = [
          { title: { contains: search } },
          { author: { email: { contains: search } } },
        ];
      } else {
        where.title = { contains: search };
      }
    }

    const posts = await prisma.post.findMany({
      where,
      select: {
        id: true,
        title: true,
        slug: true,
        published: true,
        createdAt: true,
        updatedAt: true,
        author: { select: { id: true, name: true, email: true } },
        _count: { select: { comments: true } },
      },
      orderBy: { updatedAt: "desc" },
      take: 100,
    });

    return NextResponse.json({ posts });
  } catch (error) {
    if (error instanceof Error && error.message === "UNAUTHORIZED") {
      return NextResponse.json({ error: "请先登录" }, { status: 401 });
    }
    return NextResponse.json({ error: "获取失败" }, { status: 500 });
  }
}
