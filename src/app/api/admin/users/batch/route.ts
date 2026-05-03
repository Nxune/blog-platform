import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireSuperAdmin, getUserId } from "@/lib/auth-helpers";
import { logAuditAction } from "@/services/audit.service";

export async function POST(request: Request) {
  try {
    const session = await requireSuperAdmin();
    const adminId = getUserId(session);

    const { action, userIds, role } = await request.json();

    if (!Array.isArray(userIds) || userIds.length === 0) {
      return NextResponse.json({ error: "请选择用户" }, { status: 400 });
    }

    if (action === "role") {
      if (!role || !["USER", "ADMIN"].includes(role)) {
        return NextResponse.json(
          { error: "无效的角色值，仅支持 USER 或 ADMIN" },
          { status: 400 }
        );
      }

      // Cannot modify self or SUPER_ADMIN
      const targets = await prisma.user.findMany({
        where: { id: { in: userIds } },
        select: { id: true, email: true, role: true },
      });

      const validIds = targets
        .filter((u) => u.id !== adminId && u.role !== "SUPER_ADMIN")
        .map((u) => u.id);

      if (validIds.length === 0) {
        return NextResponse.json(
          { error: "没有可操作的用户" },
          { status: 400 }
        );
      }

      await prisma.user.updateMany({
        where: { id: { in: validIds } },
        data: { role },
      });

      logAuditAction({
        action: "USER_BATCH_ROLE_CHANGE",
        userId: adminId,
        details: `targets=[${validIds.join(",")}] role=${role}`,
      }).catch(() => {});

      return NextResponse.json({
        success: true,
        updatedCount: validIds.length,
      });
    }

    if (action === "delete") {
      const targets = await prisma.user.findMany({
        where: { id: { in: userIds } },
        select: { id: true, email: true, role: true },
      });

      const validIds = targets
        .filter((u) => u.id !== adminId && u.role !== "SUPER_ADMIN")
        .map((u) => u.id);

      if (validIds.length === 0) {
        return NextResponse.json(
          { error: "没有可删除的用户" },
          { status: 400 }
        );
      }

      // Cascade delete user's content before deleting users
      await prisma.comment.deleteMany({ where: { authorId: { in: validIds } } });
      await prisma.comment.deleteMany({ where: { post: { authorId: { in: validIds } } } });
      await prisma.post.deleteMany({ where: { authorId: { in: validIds } } });
      await prisma.user.deleteMany({
        where: { id: { in: validIds } },
      });

      logAuditAction({
        action: "USER_BATCH_DELETE",
        userId: adminId,
        details: `targets=[${validIds.join(",")}]`,
      }).catch(() => {});

      return NextResponse.json({
        success: true,
        deletedCount: validIds.length,
      });
    }

    return NextResponse.json({ error: "无效的操作" }, { status: 400 });
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
