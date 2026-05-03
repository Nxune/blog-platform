import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "未登录" }, { status: 401 });
    }

    const { id } = await params;

    const credential = await prisma.credential.findUnique({
      where: { id },
    });

    if (!credential || credential.userId !== session.user.id) {
      return NextResponse.json(
        { error: "凭证未找到" },
        { status: 404 }
      );
    }

    const body = await request.json();

    // Currently only name/alias can be updated; extend as needed
    // Credential model has no name field yet, so this is a placeholder
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("credentials update error:", error);
    return NextResponse.json(
      { error: "更新凭证失败" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "未登录" }, { status: 401 });
    }

    const { id } = await params;

    const credential = await prisma.credential.findUnique({
      where: { id },
    });

    if (!credential || credential.userId !== session.user.id) {
      return NextResponse.json(
        { error: "凭证未找到" },
        { status: 404 }
      );
    }

    await prisma.credential.delete({ where: { id } });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("credentials delete error:", error);
    return NextResponse.json(
      { error: "删除凭证失败" },
      { status: 500 }
    );
  }
}
