import { prisma } from "./src/lib/db";

async function main() {
  try {
    const userCount = await prisma.user.count();
    console.log("SUCCESS: Client works, User count:", userCount);
  } catch (e: unknown) {
    if (e instanceof Error) {
      const maybeCode = (e as { code?: string }).code;
      console.error("DB Error Name:", e.name);
      console.error("DB Error Code:", maybeCode || "No Code");
      console.error("Message:", e.message);
    } else {
      console.error("DB Error:", e);
    }
  } finally {
    await prisma.$disconnect();
  }
}

main();
