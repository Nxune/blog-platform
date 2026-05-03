import { NextResponse } from "next/server";
import { getCommentById, deleteComment } from "@/services/comment.service";
import { requireOwner } from "@/lib/auth-helpers";

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const comment = await getCommentById(id);

  if (!comment) {
    return NextResponse.json({ error: "评论不存在" }, { status: 404 });
  }

  try {
    await requireOwner(comment.authorId, "评论");
  } catch {
    return NextResponse.json({ error: "无权限" }, { status: 403 });
  }

  await deleteComment(id);
  return NextResponse.json({ success: true });
}
