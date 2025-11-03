// Script to create admin user with password
// Usage: npx tsx scripts/create-admin.ts <email> <password> <name>

import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  const email = process.argv[2];
  const password = process.argv[3];
  const name = process.argv[4] || email.split("@")[0];

  if (!email || !password) {
    console.error(
      "Usage: npx tsx scripts/create-admin.ts <email> <password> [name]"
    );
    process.exit(1);
  }

  try {
    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create or update doctor
    const doctor = await prisma.doctor.upsert({
      where: { email },
      update: {
        password: hashedPassword,
        name,
      },
      create: {
        email,
        name,
        password: hashedPassword,
      },
    });

    console.log(`✅ Admin user created/updated: ${doctor.email}`);
    console.log(`   ID: ${doctor.id}`);
    console.log(`   Name: ${doctor.name}`);
  } catch (error) {
    console.error("Error creating admin:", error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

main();
