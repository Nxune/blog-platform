import { NextResponse } from "next/server";
import { getCommentsByPostSlug, createComment } from "@/services/comment.service";
import { requireAuth } from "@/lib/auth-helpers";
import { commentSchema } from "@/lib/validations";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ slug: string }> }
) {
  const { slug } = await params;

  try {
    const comments = await getCommentsByPostSlug(slug);
    return NextResponse.json({ comments });
  } catch (error) {
    if (error instanceof Error && error.message === "NOT_FOUND") {
      return NextResponse.json({ error: "文章不存在" }, { status: 404 });
    }
    throw error;
  }
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ slug: string }> }
) {
  let session;
  try {
    session = await requireAuth();
  } catch {
    return NextResponse.json({ error: "请先登录" }, { status: 401 });
  }

  const userId = (session.user as { id: string }).id;

  const { slug } = await params;
  const body = await request.json();

  const parsed = commentSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "评论内容不能为空" }, { status: 400 });
  }

  try {
    const comment = await createComment({
      content: parsed.data.content,
      authorId: userId,
      postSlug: slug,
      parentId: parsed.data.parentId,
    });
    return NextResponse.json(comment, { status: 201 });
  } catch (error) {
    if (error instanceof Error) {
      if (error.message === "POST_NOT_FOUND") {
        return NextResponse.json({ error: "文章不存在或未发布" }, { status: 404 });
      }
      if (error.message === "PARENT_NOT_FOUND") {
        return NextResponse.json({ error: "父评论不存在" }, { status: 400 });
      }
    }
    throw error;
  }
}
