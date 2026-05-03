import { NextResponse } from "next/server";
import { listTags, createTag, deleteTag } from "@/services/tag.service";
import { requireAdmin } from "@/lib/auth-helpers";

export async function GET() {
  const tags = await listTags();
  return NextResponse.json(tags);
}

export async function POST(request: Request) {
  try {
    await requireAdmin();
  } catch {
    return NextResponse.json({ error: "无权限" }, { status: 403 });
  }

  const body = await request.json();
  const { name } = body;

  if (!name || typeof name !== "string") {
    return NextResponse.json({ error: "标签名不能为空" }, { status: 400 });
  }

  try {
    const tag = await createTag(name);
    return NextResponse.json(tag, { status: 201 });
  } catch (error) {
    if (error instanceof Error && error.message === "标签已存在") {
      return NextResponse.json({ error: "标签已存在" }, { status: 409 });
    }
    throw error;
  }
}

export async function DELETE(request: Request) {
  try {
    await requireAdmin();
  } catch {
    return NextResponse.json({ error: "无权限" }, { status: 403 });
  }

  const { searchParams } = new URL(request.url);
  const id = searchParams.get("id");

  if (!id) {
    return NextResponse.json({ error: "缺少标签 ID" }, { status: 400 });
  }

  await deleteTag(id);
  return NextResponse.json({ success: true });
}
