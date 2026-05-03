import { NextResponse } from "next/server";
import { moderateComment } from "@/services/comment.service";
import { requireAdmin } from "@/lib/auth-helpers";
import type { CommentStatus } from "@prisma/client";

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await requireAdmin();
  } catch {
    return NextResponse.json({ error: "无权限" }, { status: 403 });
  }

  const { id } = await params;
  const body = await request.json();
  const { status } = body;

  const validStatuses: CommentStatus[] = ["PENDING", "APPROVED", "SPAM", "DELETED"];
  if (!validStatuses.includes(status)) {
    return NextResponse.json({ error: "无效的状态" }, { status: 400 });
  }

  const comment = await moderateComment(id, status);
  return NextResponse.json(comment);
}
