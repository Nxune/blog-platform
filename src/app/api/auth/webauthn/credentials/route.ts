import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "未登录" }, { status: 401 });
    }

    const credentials = await prisma.credential.findMany({
      where: { userId: session.user.id },
      select: {
        id: true,
        backedUp: true,
        transports: true,
        createdAt: true,
        lastUsed: true,
      },
      orderBy: { lastUsed: "desc" },
    });

    return NextResponse.json({ credentials });
  } catch (error) {
    console.error("credentials list error:", error);
    return NextResponse.json(
      { error: "获取凭证列表失败" },
      { status: 500 }
    );
  }
}
