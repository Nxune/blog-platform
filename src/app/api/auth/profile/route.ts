import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { compare, hash } from "bcryptjs";
import { NextResponse } from "next/server";
import { rateLimit } from "@/lib/rate-limit";

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
      username: true,
      email: true,
      image: true,
      role: true,
      bio: true,
      website: true,
      location: true,
      createdAt: true,
    },
  });

  if (!user) {
    return NextResponse.json({ error: "用户不存在" }, { status: 404 });
  }

  return NextResponse.json(user);
}

export async function PATCH(request: Request) {
  const session = await auth();

  if (!session?.user) {
    return NextResponse.json({ error: "未登录" }, { status: 401 });
  }

  const body = await request.json();
  const { type, ...data } = body;

  if (type === "password") {
    const rl = rateLimit(`password-change:${session.user.id}`, { windowMs: 60_000, max: 3 });
    if (!rl.success) {
      return NextResponse.json({ error: "请求过于频繁，请稍后再试" }, { status: 429 });
    }

    const { currentPassword, newPassword } = data;
    if (!currentPassword || !newPassword) {
      return NextResponse.json({ error: "请填写当前密码和新密码" }, { status: 400 });
    }
    if (newPassword.length < 8) {
      return NextResponse.json({ error: "新密码至少需要 8 个字符" }, { status: 400 });
    }

    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { password: true },
    });

    if (!user?.password) {
      return NextResponse.json({ error: "该账号未设置密码" }, { status: 400 });
    }

    const isValid = await compare(currentPassword, user.password);
    if (!isValid) {
      return NextResponse.json({ error: "当前密码不正确" }, { status: 400 });
    }

    const hashed = await hash(newPassword, 12);
    await prisma.user.update({
      where: { id: session.user.id },
      data: { password: hashed },
    });

    return NextResponse.json({ success: true, message: "密码已更新" });
  }

  if (type === "email") {
    const { email, password } = data;
    if (!email || !password) {
      return NextResponse.json({ error: "请填写新邮箱和当前密码" }, { status: 400 });
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return NextResponse.json({ error: "请输入有效的邮箱地址" }, { status: 400 });
    }

    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { password: true },
    });

    if (!user?.password) {
      return NextResponse.json({ error: "该账号未设置密码" }, { status: 400 });
    }

    const isValid = await compare(password, user.password);
    if (!isValid) {
      return NextResponse.json({ error: "密码不正确" }, { status: 400 });
    }

    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing && existing.id !== session.user.id) {
      return NextResponse.json({ error: "该邮箱已被其他账号使用" }, { status: 409 });
    }

    await prisma.user.update({
      where: { id: session.user.id },
      data: { email },
    });

    return NextResponse.json({ success: true, message: "邮箱已更新" });
  }

  // Default: update profile (name, bio, website, location, username)
  const { name, bio, website, location, username } = data;
  if (name !== undefined && (typeof name !== "string" || name.trim().length < 1 || name.length > 50)) {
    return NextResponse.json({ error: "用户名长度需在 1-50 字符之间" }, { status: 400 });
  }
  if (bio !== undefined && (typeof bio !== "string" || bio.length > 500)) {
    return NextResponse.json({ error: "个人简介不能超过 500 字符" }, { status: 400 });
  }
  if (website !== undefined && typeof website !== "string") {
    return NextResponse.json({ error: "个人网站格式无效" }, { status: 400 });
  }
  if (location !== undefined && typeof location !== "string") {
    return NextResponse.json({ error: "所在地格式无效" }, { status: 400 });
  }
  if (username !== undefined) {
    if (typeof username !== "string" || username.length < 2 || username.length > 30 || !/^[a-zA-Z0-9_-]+$/.test(username)) {
      return NextResponse.json({ error: "用户名仅允许 2-30 个字母/数字/下划线/连字符" }, { status: 400 });
    }
    const existing = await prisma.user.findUnique({ where: { username } });
    if (existing && existing.id !== session.user.id) {
      return NextResponse.json({ error: "该用户名已被使用" }, { status: 409 });
    }
  }

  const user = await prisma.user.update({
    where: { id: session.user.id },
    data: { name, bio, website, location, username },
    select: {
      id: true,
      name: true,
      username: true,
      email: true,
      image: true,
      role: true,
      bio: true,
      website: true,
      location: true,
      createdAt: true,
    },
  });

  return NextResponse.json(user);
}
