import Link from "next/link";
import { LoginForm } from "@/components/auth/LoginForm";

export default function LoginPage() {
  return (
    <div className="mx-auto flex min-h-[60vh] max-w-sm items-center px-4">
      <div className="w-full space-y-6">
        <div className="text-center">
          <h1 className="text-2xl font-bold">登录</h1>
          <p className="mt-2 text-sm text-muted-foreground">欢迎回来</p>
        </div>

        <LoginForm />

        <p className="text-center text-sm text-muted-foreground">
          还没有账号？{" "}
          <Link href="/register" className="text-primary hover:underline">
            注册
          </Link>
        </p>
      </div>
    </div>
  );
}
