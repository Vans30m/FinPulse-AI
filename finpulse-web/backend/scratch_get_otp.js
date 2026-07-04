import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function main() {
  const records = await prisma.otpVerification.findMany();
  console.log("Active OTP Records:", JSON.stringify(records, null, 2));
}

main().catch(console.error).finally(() => prisma.$disconnect());
