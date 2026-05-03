import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function GET() {
  const session = await auth();

  if (!session?.user) {
    return NextResponse.json({ error: "未登录" }, { status: 401 });
  }

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: {
      id: true,
      name: true,
      email: true,
      avatar: true,
      role: true,
      bio: true,
      createdAt: true,
    },
  });

  if (!user) {
    return NextResponse.json({ error: "用户不存在" }, { status: 404 });
  }

  return NextResponse.json({
    ...user,
    image: user.avatar,
    avatar: undefined,
  });
}

export async function PATCH(request: Request) {
  const session = await auth();

  if (!session?.user) {
    return NextResponse.json({ error: "未登录" }, { status: 401 });
  }

  const body = await request.json();
  const { name, bio } = body;

  const user = await prisma.user.update({
    where: { id: session.user.id },
    data: { name, bio },
    select: {
      id: true,
      name: true,
      email: true,
      avatar: true,
      role: true,
      bio: true,
      createdAt: true,
    },
  });

  return NextResponse.json({
    ...user,
    image: user.avatar,
    avatar: undefined,
  });
}
