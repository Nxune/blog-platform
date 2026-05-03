import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireSuperAdmin, getUserId } from "@/lib/auth-helpers";
import { logAuditAction } from "@/services/audit.service";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await requireSuperAdmin();
    const { id } = await params;

    const user = await prisma.user.findUnique({
      where: { id },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        bio: true,
        createdAt: true,
        _count: { select: { posts: true, comments: true } },
      },
    });

    if (!user) {
      return NextResponse.json({ error: "用户不存在" }, { status: 404 });
    }

    return NextResponse.json(user);
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

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await requireSuperAdmin();
    const adminId = getUserId(session);
    const { id } = await params;

    // Cannot delete self
    if (adminId === id) {
      return NextResponse.json(
        { error: "不能删除自己的账户" },
        { status: 400 }
      );
    }

    const target= await prisma.user.findUnique({ where: { id } });
    if (!target) {
      return NextResponse.json({ error: "用户不存在" }, { status: 404 });
    }

    // Cannot delete SUPER_ADMIN
    if (target.role === "SUPER_ADMIN") {
      return NextResponse.json(
        { error: "不能删除超级管理员" },
        { status: 400 }
      );
    }

    // Cascade delete user's content
    await prisma.comment.deleteMany({ where: { authorId: id } });
    await prisma.comment.deleteMany({ where: { post: { authorId: id } } });
    await prisma.post.deleteMany({ where: { authorId: id } });
    await prisma.user.delete({ where: { id } });

    logAuditAction({
      action: "USER_DELETE",
      userId: adminId,
      targetId: id,
      details: `email=${target.email}, role=${target.role}`,
    }).catch(() => {});

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
