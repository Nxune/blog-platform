import { PrismaClient } from "@prisma/client";
import { hash } from "bcryptjs";

const prisma = new PrismaClient();

const SEED_USERS = [
  {
    name: "Admin",
    email: "admin@example.com",
    password: "AdminPass123!",
    role: "ADMIN",
  },
  {
    name: "Test User",
    email: "testuser@example.com",
    password: "TestPass123!",
    role: "USER",
  },
  {
    name: "Other User",
    email: "other@example.com",
    password: "OtherPass123!",
    role: "USER",
  },
  {
    name: "Super Admin",
    email: "admin@blog.com",
    password: "SuperAdmin123!",
    role: "SUPER_ADMIN",
  },
] as const;

async function main() {
  // Check if we should seed (skip if users already exist to avoid duplicates)
  const existingCount = await prisma.user.count();
  if (existingCount > 0) {
    console.log(`Database already has ${existingCount} users, skipping seed creation.`);
    console.log("Running upgrade check for admin@blog.com...");
  }

  for (const u of SEED_USERS) {
    const existing = await prisma.user.findUnique({ where: { email: u.email } });
    if (existing) {
      if (existing.role !== u.role) {
        await prisma.user.update({
          where: { email: u.email },
          data: { role: u.role },
        });
        console.log(`Upgraded ${u.email} to ${u.role}`);
      } else {
        console.log(`${u.email} already exists with role ${u.role}`);
      }
    } else {
      const hashedPassword = await hash(u.password, 12);
      await prisma.user.create({
        data: {
          name: u.name,
          email: u.email,
          password: hashedPassword,
          role: u.role,
        },
      });
      console.log(`Created ${u.email} with role ${u.role}`);
    }
  }

  const total = await prisma.user.count();
  console.log(`Seed complete. Total users: ${total}`);
}

main()
  .catch((e) => {
    console.error("Seed failed:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
