import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin, getUserId } from "@/lib/auth-helpers";
import { logAuditAction } from "@/services/audit.service";
import type { CommentStatus } from "@prisma/client";

const validStatuses: CommentStatus[] = ["PENDING", "APPROVED", "SPAM", "DELETED"];

export async function POST(request: Request) {
  try {
    const session = await requireAdmin();
    const adminId = getUserId(session);

    const { action, commentIds, status } = await request.json();

    if (!Array.isArray(commentIds) || commentIds.length === 0) {
      return NextResponse.json({ error: "请选择评论" }, { status: 400 });
    }

    if (action === "moderate") {
      if (!status || !validStatuses.includes(status)) {
        return NextResponse.json({ error: "无效的状态" }, { status: 400 });
      }

      await prisma.comment.updateMany({
        where: { id: { in: commentIds } },
        data: { status },
      });

      logAuditAction({
        action: "COMMENT_BATCH_MODERATE",
        userId: adminId,
        details: `commentIds=[${commentIds.join(",")}] status=${status}`,
      }).catch(() => {});

      return NextResponse.json({ success: true, updatedCount: commentIds.length });
    }

    if (action === "delete") {
      await prisma.comment.deleteMany({
        where: { id: { in: commentIds } },
      });

      logAuditAction({
        action: "COMMENT_DELETE",
        userId: adminId,
        details: `commentIds=[${commentIds.join(",")}]`,
      }).catch(() => {});

      return NextResponse.json({ success: true, deletedCount: commentIds.length });
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
