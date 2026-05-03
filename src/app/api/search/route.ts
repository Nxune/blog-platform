import { NextResponse } from "next/server";
import { listPosts } from "@/services/post.service";

const MAX_QUERY_LENGTH = 100;

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const q = searchParams.get("q") || "";
  const page = Number(searchParams.get("page")) || 1;

  if (!q.trim()) {
    return NextResponse.json({ posts: [], total: 0, page, pageSize: 10, totalPages: 0 });
  }

  if (q.length > MAX_QUERY_LENGTH) {
    return NextResponse.json({ error: "搜索词过长" }, { status: 400 });
  }

  const result = await listPosts({
    page,
    pageSize: 10,
    search: q,
    published: true,
  });

  return NextResponse.json(result);
}
