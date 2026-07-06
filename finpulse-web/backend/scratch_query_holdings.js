import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function main() {
  const user = await prisma.user.findFirst();
  console.log("DEFAULT USER:", user);
  if (user) {
    const holdings = await prisma.holding.findMany({
      where: { userId: user.id }
    });
    console.log("HOLDINGS:", holdings);
  }
}

main().finally(() => prisma.$disconnect());
