/**
 * 超级管理员重置脚本
 * 用法: npx tsx scripts/set-super-admin.ts <email>
 * 示例: npx tsx scripts/set-super-admin.ts admin@example.com
 */
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  const email = process.argv[2];

  if (!email) {
    console.log("用法: npx tsx scripts/set-super-admin.ts <email>");
    console.log("示例: npx tsx scripts/set-super-admin.ts admin@example.com");
    console.log("\n说明:");
    console.log("  - 将指定用户提升为 SUPER_ADMIN");
    console.log("  - 保留该用户的所有数据和密码");
    console.log("  - 不影响其他任何用户");
    process.exit(1);
  }

  const user = await prisma.user.findUnique({ where: { email } });

  if (!user) {
    console.error(`错误: 未找到邮箱为 "${email}" 的用户`);
    console.log("\n已注册用户:");
    const users = await prisma.user.findMany({ select: { email: true, role: true } });
    users.forEach((u) => console.log(`  ${u.email} (${u.role})`));
    process.exit(1);
  }

  await prisma.user.update({
    where: { email },
    data: { role: "SUPER_ADMIN" },
  });

  console.log(`✅ 已将 "${email}" 提升为 SUPER_ADMIN`);
  console.log(`   原角色: ${user.role}`);
  console.log(`   新角色: SUPER_ADMIN`);
  console.log("   密码和其他数据保持不变");

  await prisma.$disconnect();
}

main().catch((e) => {
  console.error("执行失败:", e.message);
  process.exit(1);
});
