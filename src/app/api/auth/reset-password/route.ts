import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";

export async function POST(request: Request) {
  try {
    const { token, password } = await request.json();

    if (!token || typeof token !== "string") {
      return NextResponse.json({ error: "无效的重置令牌" }, { status: 400 });
    }

    if (!password || typeof password !== "string" || password.length < 6) {
      return NextResponse.json(
        { error: "密码至少需要 6 个字符" },
        { status: 400 }
      );
    }

    const resetToken = await prisma.passwordResetToken.findUnique({
      where: { token },
    });

    if (!resetToken) {
      return NextResponse.json({ error: "重置令牌无效" }, { status: 400 });
    }

    if (resetToken.used) {
      return NextResponse.json(
        { error: "该重置链接已被使用" },
        { status: 400 }
      );
    }

    if (resetToken.expires < new Date()) {
      return NextResponse.json(
        { error: "重置链接已过期，请重新申请" },
        { status: 400 }
      );
    }

    const hashedPassword = await bcrypt.hash(password, 12);

    await prisma.$transaction([
      prisma.user.update({
        where: { email: resetToken.email },
        data: { password: hashedPassword },
      }),
      prisma.passwordResetToken.update({
        where: { id: resetToken.id },
        data: { used: true },
      }),
    ]);

    return NextResponse.json({
      success: true,
      message: "密码已重置成功",
    });
  } catch {
    return NextResponse.json(
      { error: "重置失败，请稍后重试" },
      { status: 500 }
    );
  }
}
