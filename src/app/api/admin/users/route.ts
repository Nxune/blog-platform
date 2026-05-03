import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireSuperAdmin } from "@/lib/auth-helpers";

export async function GET(request: Request) {
  try {
    const session = await requireSuperAdmin();
    const adminId = (session.user as Record<string, unknown>).id as string;

    const { searchParams } = new URL(request.url);
    const page = Math.max(1, Number(searchParams.get("page")) || 1);
    const pageSize = Math.min(
      100,
      Math.max(1, Number(searchParams.get("pageSize")) || 20)
    );

    const [users, total] = await Promise.all([
      prisma.user.findMany({
        select: {
          id: true,
          name: true,
          email: true,
          role: true,
          createdAt: true,
          _count: { select: { posts: true, comments: true } },
        },
        orderBy: { createdAt: "desc" },
        skip: (page - 1) * pageSize,
        take: pageSize,
      }),
      prisma.user.count(),
    ]);

    console.log(
      `[SuperAdmin] ${adminId} 查询用户列表 (page=${page}, pageSize=${pageSize})`
    );

    return NextResponse.json({ users, total, page, pageSize, totalPages: Math.ceil(total / pageSize) });
  } catch (error) {
    if (error instanceof Error && error.message === "FORBIDDEN") {
      return NextResponse.json({ error: "无权限" }, { status: 403 });
    }
    return NextResponse.json({ error: "请先登录" }, { status: 401 });
  }
}
