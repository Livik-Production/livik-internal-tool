import { prisma } from './lib/prisma.js';

async function main() {
  try {
    console.log('Attempting to connect to database...');
    await prisma.$connect();
    console.log('Database connected successfully!');
    
    console.log('Querying first employee...');
    const employee = await prisma.employee.findFirst({
      select: { id: true, firstName: true }
    });
    console.log('Query success:', employee);
  } catch (error) {
    console.error('Error during database operation:', error);
  } finally {
    await prisma.$disconnect();
  }
}

main();
