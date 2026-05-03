import { NextResponse } from "next/server";
import { verifyAuthenticationResponse } from "@simplewebauthn/server";
import type { AuthenticatorTransportFuture } from "@simplewebauthn/server";
import { encode } from "next-auth/jwt";
import { prisma } from "@/lib/prisma";
import { rateLimit } from "@/lib/rate-limit";
import { getRPID, getOrigin } from "@/lib/webauthn";

export async function POST(request: Request) {
  try {
    const ip =
      request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ??
      request.headers.get("x-real-ip") ??
      "unknown";

    const rl = rateLimit(`webauthn-login-verify:${ip}`, {
      windowMs: 60_000,
      max: 5,
    });
    if (!rl.success) {
      return NextResponse.json(
        { error: "请求过于频繁，请稍后再试" },
        { status: 429 }
      );
    }

    const body = await request.json();
    const { response, email, challengeId } = body;

    if (!response || !email || !challengeId) {
      return NextResponse.json({ error: "缺少必要参数" }, { status: 400 });
    }

    const user = await prisma.user.findUnique({
      where: { email },
      include: { credentials: true },
    });

    if (!user) {
      return NextResponse.json({ error: "用户不存在" }, { status: 404 });
    }

    const challengeRecord = await prisma.challenge.findUnique({
      where: { id: challengeId },
    });

    if (
      !challengeRecord ||
      challengeRecord.userId !== user.id ||
      challengeRecord.expires <= new Date()
    ) {
      return NextResponse.json(
        { error: "挑战已过期或无效" },
        { status: 400 }
      );
    }

    await prisma.challenge.delete({ where: { id: challengeRecord.id } });

    const credentialRecord = user.credentials.find(
      (c) => c.id === response.id
    );

    if (!credentialRecord) {
      return NextResponse.json(
        { error: "凭证未找到" },
        { status: 404 }
      );
    }

    const rpID = getRPID(request);
    const origin = getOrigin(request);

    const verification = await verifyAuthenticationResponse({
      response,
      expectedChallenge: challengeRecord.challenge,
      expectedOrigin: origin,
      expectedRPID: rpID,
      credential: {
        id: credentialRecord.id,
        publicKey: new Uint8Array(
          Buffer.from(credentialRecord.publicKey, "base64")
        ),
        counter: credentialRecord.counter,
        transports: credentialRecord.transports
          ? (JSON.parse(credentialRecord.transports) as AuthenticatorTransportFuture[])
          : undefined,
      },
    });

    if (!verification.verified) {
      return NextResponse.json({ error: "验证失败" }, { status: 400 });
    }

    await prisma.credential.update({
      where: { id: credentialRecord.id },
      data: {
        counter: verification.authenticationInfo.newCounter,
        lastUsed: new Date(),
      },
    });

    const secret = process.env.AUTH_SECRET;
    if (!secret) {
      return NextResponse.json(
        { error: "服务端配置错误" },
        { status: 500 }
      );
    }

    const isSecure = process.env.NODE_ENV === "production";
    const cookieName = isSecure
      ? "__Secure-authjs.session-token"
      : "authjs.session-token";

    const token = await encode({
      secret,
      salt: cookieName,
      token: {
        id: user.id,
        email: user.email,
        name: user.name,
        picture: user.image,
        role: user.role,
      },
      maxAge: 30 * 24 * 60 * 60,
    });

    const jsonResponse = NextResponse.json({
      success: true,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
      },
    });

    jsonResponse.cookies.set(cookieName, token, {
      httpOnly: true,
      secure: isSecure,
      sameSite: "lax",
      path: "/",
      maxAge: 30 * 24 * 60 * 60,
    });

    return jsonResponse;
  } catch (error) {
    console.error("login-verify error:", error);
    return NextResponse.json(
      { error: "登录验证失败" },
      { status: 500 }
    );
  }
}
