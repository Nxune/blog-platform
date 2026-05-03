import { NextResponse } from "next/server";
import { listAllComments } from "@/services/comment.service";
import { requireAdmin } from "@/lib/auth-helpers";

export async function GET(request: Request) {
  try {
    await requireAdmin();
  } catch (error) {
    if (error instanceof Error && error.message === "UNAUTHORIZED") {
      return NextResponse.json({ error: "请先登录" }, { status: 401 });
    }
    return NextResponse.json({ error: "无权限" }, { status: 403 });
  }

  const { searchParams } = new URL(request.url);
  const statusParam = searchParams.get("status");
  const params: Parameters<typeof listAllComments>[0] = {
    page: Number(searchParams.get("page")) || 1,
    pageSize: Number(searchParams.get("pageSize")) || 20,
    status: statusParam && ["PENDING", "APPROVED", "SPAM", "DELETED"].includes(statusParam)
      ? (statusParam as "PENDING" | "APPROVED" | "SPAM" | "DELETED")
      : undefined,
  };

  const result = await listAllComments(params);
  return NextResponse.json(result);
}
