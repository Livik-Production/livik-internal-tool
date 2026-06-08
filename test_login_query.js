import { safeExecute } from './lib/dbHelpers.js';

async function main() {
  try {
    console.log('Querying employee via safeExecute...');
    const employee = await safeExecute((prisma) =>
      prisma.employee.findFirst({
        where: { phoneNumber: '6381986147' },
        select: {
          id: true,
          firstName: true,
          lastName: true,
          role: {
            include: {
              rights: {
                include: {
                  right: true,
                },
              },
            },
          },
        },
      })
    );
    console.log('Query success:', employee ? `${employee.firstName} ${employee.lastName}` : 'Not found');
    if (employee?.role) {
      console.log('Role:', employee.role.roleName);
      console.log('Rights count:', employee.role.rights?.length || 0);
    }
  } catch (error) {
    console.error('Query failed:', error);
  }
}

main();
