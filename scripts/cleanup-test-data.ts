/**
 * 清理所有测试数据，保留超级管理员
 * 用法: npx tsx scripts/cleanup-test-data.ts [保留的邮箱]
 */
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  const keepEmail = process.argv[2] || "Nxune@foxmail.com";

  const user = await prisma.user.findUnique({ where: { email: keepEmail } });
  if (!user) {
    console.error(`错误: 未找到保留用户 "${keepEmail}"，操作取消`);
    process.exit(1);
  }

  await prisma.comment.deleteMany();
  await prisma.tagOnPost.deleteMany();
  await prisma.post.deleteMany();
  await prisma.tag.deleteMany();
  await prisma.auditLog.deleteMany();
  await prisma.passwordResetToken.deleteMany();
  const deleted = await prisma.user.deleteMany({
    where: { email: { not: keepEmail } },
  });

  console.log(`✅ 已清理 ${deleted.count} 个测试用户及所有内容`);
  console.log(`   保留: ${keepEmail} (${user.role})`);

  await prisma.$disconnect();
}

main().catch((e) => {
  console.error("执行失败:", e.message);
  process.exit(1);
});
