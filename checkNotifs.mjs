import { config } from 'dotenv';
config({ path: '.env.local' });
config({ path: '.env' });
import { prisma } from './lib/prisma.js';

async function run() {
  const notifs = await prisma.notification.findMany({
    orderBy: { createdAt: 'desc' },
    take: 10
  });
  console.log(JSON.stringify(notifs, null, 2));
}

run().catch(console.error).finally(() => prisma.$disconnect());
