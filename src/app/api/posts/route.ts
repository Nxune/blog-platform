import { NextResponse } from "next/server";
import { listPosts, createPost } from "@/services/post.service";
import { requireAuth, requireAdmin } from "@/lib/auth-helpers";
import { postSchema } from "@/lib/validations";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const params: Parameters<typeof listPosts>[0] = {
    page: Number(searchParams.get("page")) || 1,
    pageSize: Number(searchParams.get("pageSize")) || 10,
    published: searchParams.get("published") === "true" ? true : undefined,
    tag: searchParams.get("tag") || undefined,
    search: searchParams.get("search") || undefined,
  };

  const result = await listPosts(params);
  return NextResponse.json(result);
}

export async function POST(request: Request) {
  try {
    await requireAdmin();
  } catch {
    return NextResponse.json({ error: "无权限" }, { status: 403 });
  }

  try {
    const body = await request.json();
    const parsed = postSchema.parse(body);
    const session = await requireAuth();

    const uid = (session.user as { id: string }).id;
    const post = await createPost({
      ...parsed,
      authorId: uid,
    });

    return NextResponse.json(post, { status: 201 });
  } catch (error) {
    if (error instanceof Error && "issues" in error) {
      return NextResponse.json({ error: "验证失败", details: error }, { status: 400 });
    }
    throw error;
  }
}
