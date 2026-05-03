import Link from "next/link";
import { RegisterForm } from "@/components/auth/RegisterForm";

export default function RegisterPage() {
  return (
    <div className="mx-auto flex min-h-[60vh] max-w-sm items-center px-4">
      <div className="w-full space-y-6">
        <div className="text-center">
          <h1 className="text-2xl font-bold">注册</h1>
          <p className="mt-2 text-sm text-muted-foreground">创建你的账号</p>
        </div>

        <RegisterForm />

        <p className="text-center text-sm text-muted-foreground">
          已有账号？{" "}
          <Link href="/login" className="text-primary hover:underline">
            登录
          </Link>
        </p>
      </div>
    </div>
  );
}
