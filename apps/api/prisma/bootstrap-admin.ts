import { hash } from "bcryptjs";
import prisma from "../src/config/prisma";

async function main() {
  const dbUrl = process.env.DATABASE_URL ?? "";

  if (!dbUrl.includes("ep-purple-night-b1dnioci")) {
    throw new Error("DATABASE_URL is not the production database. Stopping.");
  }

  const email = process.env.BOOTSTRAP_EMAIL;
  const password = process.env.BOOTSTRAP_PASSWORD;

  if (!email || !password) {
    throw new Error("BOOTSTRAP_EMAIL and BOOTSTRAP_PASSWORD are required.");
  }

  if (password.length < 12) {
    throw new Error("Password must be at least 12 characters.");
  }

  const existing = await prisma.user.findUnique({ where: { email } });

  if (existing) {
    console.log("A user with this email already exists. Nothing changed.");
    return;
  }

  const passwordHash = await hash(password, 10);

  const user = await prisma.user.create({
    data: { email, passwordHash, role: "PLATFORM_SUPER_ADMIN" },
  });

  console.log(`Created platform admin: ${user.email}`);
}

main()
  .catch((err) => {
    console.error(err.message ?? err);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());