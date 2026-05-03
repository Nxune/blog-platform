import { NextResponse } from "next/server";
import { generateAuthenticationOptions } from "@simplewebauthn/server";
import type { AuthenticatorTransportFuture } from "@simplewebauthn/server";
import { prisma } from "@/lib/prisma";
import { rateLimit } from "@/lib/rate-limit";
import { getRPID } from "@/lib/webauthn";
import { createChallenge } from "@/lib/webauthn-challenge-store";

export async function GET(request: Request) {
  try {
    const ip =
      request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ??
      request.headers.get("x-real-ip") ??
      "unknown";

    const rl = rateLimit(`webauthn-login-begin:${ip}`, {
      windowMs: 60_000,
      max: 10,
    });
    if (!rl.success) {
      return NextResponse.json(
        { error: "请求过于频繁，请稍后再试" },
        { status: 429 }
      );
    }

    const { searchParams } = new URL(request.url);
    const email = searchParams.get("email");

    if (!email) {
      return NextResponse.json(
        { error: "请提供邮箱地址" },
        { status: 400 }
      );
    }

    const user = await prisma.user.findUnique({
      where: { email },
      include: { credentials: true },
    });

    if (!user || user.credentials.length === 0) {
      return NextResponse.json(
        { error: "该邮箱未注册或未设置 Passkey" },
        { status: 404 }
      );
    }

    const rpID = getRPID(request);

    const allowCredentials = user.credentials.map((cred) => ({
      id: cred.id,
      transports: cred.transports
        ? (JSON.parse(cred.transports) as AuthenticatorTransportFuture[])
        : undefined,
    }));

    const options = await generateAuthenticationOptions({
      rpID,
      allowCredentials,
      userVerification: "preferred",
      timeout: 60_000,
    });

    const challengeRecord = await createChallenge(options.challenge, user.id);

    return NextResponse.json({
      ...options,
      _challengeId: challengeRecord.id,
    });
  } catch (error) {
    console.error("login/begin error:", error);
    return NextResponse.json(
      { error: "生成登录选项失败" },
      { status: 500 }
    );
  }
}
