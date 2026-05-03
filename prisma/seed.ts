import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  const adminEmail = "admin@blog.com";

  const admin = await prisma.user.findUnique({
    where: { email: adminEmail },
  });

  if (admin && admin.role !== "SUPER_ADMIN") {
    await prisma.user.update({
      where: { email: adminEmail },
      data: { role: "SUPER_ADMIN" },
    });
    console.log(`Upgraded ${adminEmail} to SUPER_ADMIN`);
  } else if (admin) {
    console.log(`${adminEmail} is already SUPER_ADMIN`);
  } else {
    console.log(`${adminEmail} not found, skipping seed`);
  }
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
