import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();

// Delete test posts created by E2E tests
const testPosts = await prisma.post.findMany({
  where: {
    OR: [
      { title: { startsWith: "E2E" } },
      { title: { startsWith: "e2e" } },
    ],
  },
  select: { id: true, title: true },
});

console.log(`Found ${testPosts.length} test posts to delete`);
for (const post of testPosts) {
  await prisma.comment.deleteMany({ where: { postId: post.id } });
  await prisma.postTag.deleteMany({ where: { postId: post.id } });
  await prisma.post.delete({ where: { id: post.id } });
  console.log(`Deleted post: ${post.title}`);
}

// Delete test users created by E2E tests
const testUsers = await prisma.user.findMany({
  where: {
    email: { contains: "e2e" },
  },
  select: { id: true, email: true },
});

for (const user of testUsers) {
  // Cascade delete
  const userPosts = await prisma.post.findMany({ where: { authorId: user.id }, select: { id: true } });
  for (const p of userPosts) {
    await prisma.comment.deleteMany({ where: { postId: p.id } });
    await prisma.postTag.deleteMany({ where: { postId: p.id } });
  }
  await prisma.post.deleteMany({ where: { authorId: user.id } });
  await prisma.comment.deleteMany({ where: { authorId: user.id } });
  await prisma.user.delete({ where: { id: user.id } });
  console.log(`Deleted user: ${user.email}`);
}

const remainingPosts = await prisma.post.count();
const remainingUsers = await prisma.user.count();
console.log(`Remaining: ${remainingPosts} posts, ${remainingUsers} users`);

await prisma.$disconnect();
