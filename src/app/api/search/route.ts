import { NextResponse } from "next/server";
import { listPosts } from "@/services/post.service";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const q = searchParams.get("q") || "";
  const page = Number(searchParams.get("page")) || 1;

  if (!q.trim()) {
    return NextResponse.json({ posts: [], total: 0, page, pageSize: 10, totalPages: 0 });
  }

  const result = await listPosts({
    page,
    pageSize: 10,
    search: q,
    status: "PUBLISHED",
  });

  return NextResponse.json(result);
}
