import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireSuperAdmin, getUserId } from "@/lib/auth-helpers";
import bcrypt from "bcryptjs";

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await requireSuperAdmin();
    const adminId = getUserId(session);
    const { id } = await params;

    const { role, password } = await request.json();

    // Cannot modify self
    if (adminId === id) {
      return NextResponse.json(
        { error: "不能修改自己的角色" },
        { status: 400 }
      );
    }

    // Validate role
    if (!role || !["USER", "ADMIN"].includes(role)) {
      return NextResponse.json(
        { error: "无效的角色值，仅支持 USER 或 ADMIN" },
        { status: 400 }
      );
    }

    // Verify current password
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

    // Cannot modify SUPER_ADMIN
    if (target.role === "SUPER_ADMIN") {
      return NextResponse.json(
        { error: "不能修改超级管理员的角色" },
        { status: 400 }
      );
    }

    const updated = await prisma.user.update({
      where: { id },
      data: { role },
      select: { id: true, name: true, email: true, role: true },
    });

    console.log(
      `[SuperAdmin] ${adminId} 修改了用户 ${id} 角色: ${target.role} -> ${role}`
    );

    return NextResponse.json(updated);
  } catch (error) {
    if (error instanceof Error && error.message === "FORBIDDEN") {
      return NextResponse.json({ error: "无权限" }, { status: 403 });
    }
    return NextResponse.json({ error: "请先登录" }, { status: 401 });
  }
}
