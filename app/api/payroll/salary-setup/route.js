import { NextResponse } from 'next/server';
import { prisma } from '../../../../lib/prisma';

// GET: Fetch all employees with their latest salary setup OR history for a specific employee
export async function GET(req) {
  try {
    const { searchParams } = new URL(req.url);
    const employeeId = searchParams.get('employeeId');

    // If employeeId is provided, return FULL history for that specific employee
    if (employeeId) {
      let targetEmployeeId = employeeId;
      if (!targetEmployeeId.startsWith('c') && !targetEmployeeId.includes('-')) {
        const emp = await prisma.employee.findFirst({
          where: { OR: [{ id: targetEmployeeId }, { empId: targetEmployeeId }] },
        });
        if (emp) targetEmployeeId = emp.id;
      }

      const history = await prisma.salarySetup.findMany({
        where: { employeeId: targetEmployeeId },
        orderBy: [{ effectivedate: 'desc' }, { createdAt: 'desc' }],
      });

      const formattedHistory = history.map((h) => {
        const gross =
          Number(h.basicPay || 0) +
          Number(h.houseRentAllowance || 0) +
          Number(h.otherAllowance || 0);

        return {
          id: h.id,
          effectiveDate: h.effectivedate
            ? new Date(h.effectivedate).toISOString().split('T')[0]
            : null,
          yearId: h.effectivedate
            ? `${new Date(h.effectivedate).getFullYear()}-${String(new Date(h.effectivedate).getMonth() + 1).padStart(2, '0')}`
            : 'N/A',
          basicPay: Number(h.basicPay || 0),
          hra: Number(h.houseRentAllowance || 0),
          otherAllowances: Number(h.otherAllowance || 0),
          grossSalary: gross,
          ctc: Math.round(gross),
          createdAt: h.createdAt,
          updatedAt: h.updatedAt,
          createdBy: h.createdBy,
          updatedBy: h.updatedBy,
        };
      });

      return NextResponse.json(formattedHistory);
    }

    // Default: Fetch all employees with their latest setup
    // 1. Fetch all employees
    const employees = await prisma.employee.findMany({
      where: {
        status: 'Active',
      },
      select: {
        id: true,
        empId: true,
        firstName: true,
        lastName: true,
        designation: true,
        department: true,
        dateOfJoining: true,
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    // 2. Fetch latest salary setup for each employee
    const salarySetups = await prisma.salarySetup.findMany({
      orderBy: [{ effectivedate: 'desc' }, { createdAt: 'desc' }],
    });

    // 3. Merge data
    const employeesWithSalary = employees.map((emp) => {
      // Find the latest salary setup for this employee
      const latestSalary = salarySetups.find((s) => s.employeeId === emp.id);

      const grossSalary =
        Number(latestSalary?.basicPay || 0) +
        Number(latestSalary?.houseRentAllowance || 0) +
        Number(latestSalary?.otherAllowance || 0);

      const deduction = 0;
      const netPay = grossSalary - deduction;

      return {
        id: emp.id,
        empId: emp.empId,
        name: `${emp.firstName} ${emp.lastName}`,
        salaryMonthly: Number(latestSalary?.basicPay || 0),
        ctc: Math.round(grossSalary),
        basicPay: Number(latestSalary?.basicPay || 0),
        hra: Number(latestSalary?.houseRentAllowance || 0),
        otherAllowances: Number(latestSalary?.otherAllowance || 0),
        grossSalary: grossSalary,
        deduction: deduction,
        netPay: netPay,
        effectiveDate: latestSalary?.effectivedate || null,
        dateOfJoining: emp.dateOfJoining || null,
        latestSalaryId: latestSalary?.id || null, // ID of the current salary record
      };
    });

    return NextResponse.json(employeesWithSalary);
  } catch (error) {
    console.error('GET salary-setup error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch salary data' },
      { status: 500 }
    );
  }
}

// POST: Create or Update Salary Setup
export async function POST(req) {
  try {
    const body = await req.json();
    const {
      empId, // This might be the String ID (uuid) or the readable empId (EMP001)
      employeeId, // Use this if passed explicitly
      effectiveDate,
      basicPay,
      hra,
      otherAllowances,
      createdBy,
      updatedBy,
    } = body;

    // Determine the user UUID. The frontend might pass readable empId.
    let targetEmployeeId = employeeId;
    if (!targetEmployeeId && empId) {
      const emp = await prisma.employee.findUnique({
        where: { empId: empId },
      });
      if (!emp) {
        return NextResponse.json(
          { error: 'Employee not found' },
          { status: 404 }
        );
      }
      targetEmployeeId = emp.id;
    }

    if (!targetEmployeeId) {
      return NextResponse.json(
        { error: 'Employee ID required' },
        { status: 400 }
      );
    }

    // Update employee name if provided
    if (body.name) {
      const nameParts = body.name.trim().split(' ');
      const firstName = nameParts[0];
      const lastName = nameParts.slice(1).join(' ') || ''; // Handle "John" case

      await prisma.employee.update({
        where: { id: targetEmployeeId },
        data: {
          firstName,
          lastName,
        },
      });
    }

    const newSalary = await prisma.salarySetup.create({
      data: {
        employeeId: targetEmployeeId,
        effectivedate: new Date(effectiveDate || new Date()),
        basicPay: basicPay || 0,
        houseRentAllowance: hra || 0,
        otherAllowance: otherAllowances || 0,
        createdBy: createdBy || null,
        updatedBy: updatedBy || null,
      },
    });

    return NextResponse.json(newSalary, { status: 201 });
  } catch (error) {
    console.error('POST salary-setup error:', error);
    return NextResponse.json(
      { error: 'Failed to create salary setup' },
      { status: 500 }
    );
  }
}

// DELETE: Delete a specific salary setup record
export async function DELETE(req) {
  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json(
        { error: 'Record ID required' },
        { status: 400 }
      );
    }

    await prisma.salarySetup.delete({
      where: { id },
    });

    return NextResponse.json({ message: 'Salary record deleted successfully' });
  } catch (error) {
    console.error('DELETE salary-setup error:', error);
    return NextResponse.json(
      { error: 'Failed to delete salary record' },
      { status: 500 }
    );
  }
}
// PATCH: Update a specific salary setup record
export async function PATCH(req) {
  try {
    const body = await req.json();
    const { id, effectiveDate, basicPay, hra, otherAllowances, updatedBy } = body;

    if (!id) {
      return NextResponse.json(
        { error: 'Record ID required for update' },
        { status: 400 }
      );
    }

    // Check if record exists
    const existing = await prisma.salarySetup.findUnique({
      where: { id },
    });

    if (!existing) {
      return NextResponse.json(
        { error: 'Salary record not found' },
        { status: 404 }
      );
    }

    const updatedSalary = await prisma.salarySetup.update({
      where: { id },
      data: {
        effectivedate: new Date(effectiveDate),
        basicPay: Number(basicPay),
        houseRentAllowance: Number(hra),
        otherAllowance: Number(otherAllowances),
        updatedBy: updatedBy || null,
      },
    });

    return NextResponse.json(updatedSalary);
  } catch (error) {
    console.error('PATCH salary-setup error:', error);
    return NextResponse.json(
      { error: 'Failed to update salary record' },
      { status: 500 }
    );
  }
}
