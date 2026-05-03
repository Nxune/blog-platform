import { NextResponse } from "next/server";
import { deleteComment } from "@/services/comment.service";
import { requireAdmin } from "@/lib/auth-helpers";

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await requireAdmin();
  } catch {
    return NextResponse.json({ error: "无权限" }, { status: 403 });
  }

  const { id } = await params;
  await deleteComment(id);
  return NextResponse.json({ success: true });
}
