import { NextResponse } from "next/server";
import { setCommentApproval } from "@/services/comment.service";
import { requireAdmin } from "@/lib/auth-helpers";

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
  const { approved } = body;

  if (typeof approved !== "boolean") {
    return NextResponse.json({ error: "approved 必须是布尔值" }, { status: 400 });
  }

  const comment = await setCommentApproval(id, approved);
  return NextResponse.json(comment);
}
