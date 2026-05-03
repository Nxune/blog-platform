import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import crypto from "crypto";

export async function POST(request: Request) {
  try {
    const { email } = await request.json();

    if (!email || typeof email !== "string") {
      return NextResponse.json({ error: "请输入邮箱地址" }, { status: 400 });
    }

    // Always return success to prevent email enumeration
    const token = crypto.randomBytes(32).toString("hex");
    const expires = new Date(Date.now() + 24 * 60 * 60 * 1000);

    // Only create token if user exists
    const user = await prisma.user.findUnique({ where: { email } });
    if (user) {
      await prisma.passwordResetToken.create({
        data: { email, token, expires },
      });

      const resetUrl = `${process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"}/reset-password?token=${token}`;
      console.log(`\n[Password Reset] Reset URL for ${email}:`);
      console.log(resetUrl);
      console.log("(In production, this would be sent via email)\n");
    }

    return NextResponse.json({
      success: true,
      message: "重置链接已发送到您的邮箱",
    });
  } catch {
    return NextResponse.json(
      { error: "发送失败，请稍后重试" },
      { status: 500 }
    );
  }
}
