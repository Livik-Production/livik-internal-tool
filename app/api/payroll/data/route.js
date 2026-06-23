import { NextResponse } from 'next/server';
import { prisma } from '../../../../lib/prisma';

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const employeeId = searchParams.get('employeeId');

    let targetEmployeeId = employeeId;
    if (targetEmployeeId && !targetEmployeeId.startsWith('c') && !targetEmployeeId.includes('-')) {
      const emp = await prisma.employee.findFirst({
        where: { OR: [{ id: targetEmployeeId }, { empId: targetEmployeeId }] },
      });
      if (emp) targetEmployeeId = emp.id;
    }

    const payrollCycles = await prisma.payrollCycle.findMany({
      include: {
        payrolls: targetEmployeeId
          ? {
              where: { employeeId: targetEmployeeId },
            }
          : true,
      },
      orderBy: {
        startDate: 'desc',
      },
    });

    const formattedCycles = payrollCycles.map((cycle) => {
      // If fetching as a specific employee, DO NOT return company-wide totals
      if (employeeId) {
        return {
          id: cycle.id,
          cycleId: cycle.cycleId,
          month: cycle.month,
          status: cycle.status,
          payrolls: cycle.payrolls,
        };
      }

      return {
        ...cycle,
        totalGross: Number(cycle.totalGross),
        totalTax: Number(cycle.totalTax),
        totalDeductions: Number(cycle.totalDeductions),
        totalNet: Number(cycle.totalNet),
      };
    });

    return NextResponse.json(formattedCycles);
  } catch (error) {
    console.error('GET payroll data error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch payroll data' },
      { status: 500 }
    );
  }
}
