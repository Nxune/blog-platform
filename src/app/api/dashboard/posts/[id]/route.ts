import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireSuperAdmin, getUserId } from "@/lib/auth-helpers";
import { logAuditAction } from "@/services/audit.service";

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await requireSuperAdmin();
    const adminId = getUserId(session);
    const { id } = await params;

    const post = await prisma.post.findUnique({
      where: { id },
      select: { id: true, title: true, slug: true },
    });

    if (!post) {
      return NextResponse.json({ error: "文章不存在" }, { status: 404 });
    }

    await prisma.post.delete({ where: { id } });

    await logAuditAction({
      action: "POST_DELETE",
      userId: adminId,
      targetId: id,
      details: `title="${post.title}" slug=${post.slug}`,
    });

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
