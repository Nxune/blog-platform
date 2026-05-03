"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { signIn } from "@/lib/auth-client";
import { startRegistration, browserSupportsWebAuthn } from "@simplewebauthn/browser";

export function RegisterForm() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isPasskeyLoading, setIsPasskeyLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError("");

    try {
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, email, password }),
      });

      if (!res.ok) {
        const data = await res.json();
        setError(data.error || "注册失败");
        return;
      }

      const result = await signIn("credentials", {
        email,
        password,
        redirect: false,
      });

      if (result?.error) {
        setError("注册成功但登录失败，请直接登录");
      } else {
        router.push("/dashboard");
        router.refresh();
      }
    } catch {
      setError("注册失败，请重试");
    } finally {
      setIsLoading(false);
    }
  };

  const handlePasskeyRegister = async () => {
    if (!email || !name) {
      setError("请先填写用户名和邮箱");
      return;
    }

    setIsPasskeyLoading(true);
    setError("");

    try {
      const optionsRes = await fetch("/api/auth/webauthn/register-options", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, name }),
      });

      if (!optionsRes.ok) {
        const data = await optionsRes.json();
        setError(data.error || "获取注册选项失败");
        return;
      }

      const options = await optionsRes.json();
      const challengeId = options._challengeId;
      delete options._challengeId;

      const regResponse = await startRegistration({ optionsJSON: options });

      const verifyRes = await fetch("/api/auth/webauthn/register-verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email,
          name,
          response: regResponse,
          challengeId,
        }),
      });

      if (!verifyRes.ok) {
        const data = await verifyRes.json();
        setError(data.error || "Passkey 注册验证失败");
        return;
      }

      router.push("/dashboard");
      router.refresh();
    } catch (err) {
      if (err instanceof Error && err.name === "AbortError") {
        return;
      }
      setError("Passkey 注册失败，请重试");
    } finally {
      setIsPasskeyLoading(false);
    }
  };

  const webauthnSupported = typeof window !== "undefined" && browserSupportsWebAuthn();

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label htmlFor="register-name" className="block text-sm font-medium">
          用户名
        </label>
        <input
          id="register-name"
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          required
          className="mt-1 w-full rounded-lg border px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-primary"
        />
      </div>

      <div>
        <label htmlFor="register-email" className="block text-sm font-medium">
          邮箱
        </label>
        <input
          id="register-email"
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
          className="mt-1 w-full rounded-lg border px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-primary"
        />
      </div>

      <div>
        <label htmlFor="register-password" className="block text-sm font-medium">
          密码
        </label>
        <input
          id="register-password"
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
          minLength={8}
          className="mt-1 w-full rounded-lg border px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-primary"
        />
      </div>

      {error && <p className="text-sm text-destructive">{error}</p>}

      <button
        type="submit"
        disabled={isLoading}
        className="w-full rounded-lg bg-primary py-2 text-sm text-primary-foreground hover:opacity-90 disabled:opacity-50"
      >
        {isLoading ? "注册中..." : "注册"}
      </button>

      {webauthnSupported && (
        <div className="relative">
          <div className="absolute inset-0 flex items-center">
            <span className="w-full border-t" />
          </div>
          <div className="relative flex justify-center text-xs uppercase">
            <span className="bg-background px-2 text-muted-foreground">
              或
            </span>
          </div>
        </div>
      )}

      {webauthnSupported && (
        <button
          type="button"
          onClick={handlePasskeyRegister}
          disabled={isPasskeyLoading || !email || !name}
          className="w-full rounded-lg border py-2 text-sm hover:bg-muted disabled:opacity-50"
        >
          {isPasskeyLoading ? "验证中..." : "使用 Passkey 注册"}
        </button>
      )}
    </form>
  );
}
