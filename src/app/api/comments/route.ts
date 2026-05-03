import { NextResponse } from "next/server";
import { listAllComments } from "@/services/comment.service";
import { requireAdmin } from "@/lib/auth-helpers";

export async function GET(request: Request) {
  try {
    await requireAdmin();
  } catch {
    return NextResponse.json({ error: "无权限" }, { status: 403 });
  }

  const { searchParams } = new URL(request.url);
  const approvedParam = searchParams.get("approved");
  const params: Parameters<typeof listAllComments>[0] = {
    page: Number(searchParams.get("page")) || 1,
    pageSize: Number(searchParams.get("pageSize")) || 20,
    isApproved: approvedParam === "true" ? true : approvedParam === "false" ? false : undefined,
  };

  const result = await listAllComments(params);
  return NextResponse.json(result);
}
