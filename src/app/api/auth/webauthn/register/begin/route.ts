import { NextResponse } from "next/server";
import { generateRegistrationOptions } from "@simplewebauthn/server";
import { prisma } from "@/lib/prisma";
import { rateLimit } from "@/lib/rate-limit";
import { RP_NAME, getRPID } from "@/lib/webauthn";
import { createChallenge } from "@/lib/webauthn-challenge-store";

export async function POST(request: Request) {
  try {
    const ip =
      request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ??
      request.headers.get("x-real-ip") ??
      "unknown";

    const rl = rateLimit(`webauthn-register-begin:${ip}`, {
      windowMs: 60_000,
      max: 10,
    });
    if (!rl.success) {
      return NextResponse.json(
        { error: "请求过于频繁，请稍后再试" },
        { status: 429 }
      );
    }

    const body = await request.json();
    const { email, name } = body;

    if (!email || typeof email !== "string") {
      return NextResponse.json({ error: "请提供邮箱地址" }, { status: 400 });
    }

    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) {
      return NextResponse.json(
        { error: "该邮箱已被注册" },
        { status: 409 }
      );
    }

    const rpID = getRPID(request);

    const options = await generateRegistrationOptions({
      rpName: RP_NAME,
      rpID,
      userName: email,
      userDisplayName: name || email,
      userID: Buffer.from(email),
      timeout: 60_000,
    });

    const challengeRecord = await createChallenge(options.challenge);

    return NextResponse.json({
      ...options,
      _challengeId: challengeRecord.id,
    });
  } catch (error) {
    console.error("register/begin error:", error);
    return NextResponse.json(
      { error: "生成注册选项失败" },
      { status: 500 }
    );
  }
}
