import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";

export default async function DashboardTagsPage() {
  const session = await auth();
  if (!session?.user) {
    redirect("/login");
  }
  const role = (session.user as Record<string, unknown>).role as string;
  if (role !== "ADMIN" && role !== "SUPER_ADMIN") {
    redirect("/dashboard");
  }

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">标签管理</h1>
      <p className="text-center py-12 text-muted-foreground">暂无标签</p>
    </div>
  );
}
