import { prisma } from "./src/lib/db";

async function main() {
  try {
    const users = await prisma.user.findMany({ take: 1 });
    console.log("User table exists. Count:", users.length);
    const accounts = await prisma.account.findMany({ take: 1 });
    console.log("Account table exists. Count:", accounts.length);
  } catch (e: unknown) {
    if (e instanceof Error) {
      console.error("DB Error:", e.message);
    } else {
      console.error("DB Error:", e);
    }
  } finally {
    await prisma.$disconnect();
  }
}

main();
