import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireSuperAdmin, getUserId } from "@/lib/auth-helpers";
import bcrypt from "bcryptjs";
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
    return NextResponse.json({ error: "请先登录" }, { status: 401 });
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

    // Verify current password
    const { password } = await request.json();
    if (!password || typeof password !== "string") {
      return NextResponse.json(
        { error: "需要当前密码验证" },
        { status: 400 }
      );
    }

    const admin = await prisma.user.findUnique({
      where: { id: adminId },
      select: { password: true },
    });
    if (!admin?.password) {
      return NextResponse.json({ error: "验证失败" }, { status: 400 });
    }
    const valid = await bcrypt.compare(password, admin.password);
    if (!valid) {
      return NextResponse.json({ error: "密码错误" }, { status: 400 });
    }

    const target = await prisma.user.findUnique({ where: { id } });
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

    await prisma.user.delete({ where: { id } });

    await logAuditAction({
      action: "USER_DELETE",
      userId: adminId,
      targetId: id,
      details: `email=${target.email}, role=${target.role}`,
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    if (error instanceof Error && error.message === "FORBIDDEN") {
      return NextResponse.json({ error: "无权限" }, { status: 403 });
    }
    return NextResponse.json({ error: "请先登录" }, { status: 401 });
  }
}
