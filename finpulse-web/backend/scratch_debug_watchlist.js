// Debug script: check all users and their watchlists in the DB
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  // 1. List all users
  const users = await prisma.user.findMany({
    select: { id: true, email: true, name: true }
  });
  console.log('\n=== USERS IN DB ===');
  users.forEach(u => console.log(`  id=${u.id}  email=${u.email}  name=${u.name}`));

  // 2. List all watchlists with item counts
  const watchlists = await prisma.watchlist.findMany({
    include: { items: true }
  });
  console.log('\n=== WATCHLISTS IN DB ===');
  if (watchlists.length === 0) {
    console.log('  (none)');
  }
  watchlists.forEach(w => {
    console.log(`  watchlist id=${w.id}  name="${w.name}"  userId=${w.userId}  items=${w.items.length}`);
    w.items.forEach(item => {
      console.log(`    -> symbol=${item.symbol}  name=${item.name || '(no name)'}`);
    });
  });

  // 3. Test the getOrCreateDefaultUser logic manually
  console.log('\n=== FIRST USER (fallback) ===');
  const first = await prisma.user.findFirst();
  console.log(first ? `  id=${first.id}  email=${first.email}` : '  (no users)');
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
