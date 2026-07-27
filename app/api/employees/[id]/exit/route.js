import { NextResponse } from 'next/server';
import { prisma } from '../../../../../lib/prisma';

export async function POST(req, context) {
  try {
    const params = await context.params;
    const { id } = params;
    
    // Resolve employee id if empId was passed
    let employeeId = id;
    const resolved = await prisma.employee.findFirst({
      where: { OR: [{ id }, { empId: id }] },
      select: { id: true }
    });
    if (resolved) {
      employeeId = resolved.id;
    } else {
      return NextResponse.json({ error: 'Employee not found' }, { status: 404 });
    }

    const body = await req.json();

    // Prepare data, parsing dates
    const data = {
      exitType: body.exitType,
      reason: body.reason,
      employeeFeedback: body.employeeFeedback || null,
      hrRemarks: body.hrRemarks || null,
      isAssetsReturned: Boolean(body.isAssetsReturned),
      isHandoverCompleted: Boolean(body.isHandoverCompleted),
      lastWorkingDay: new Date(body.lastWorkingDay),
    };
    
    if (body.resignationDate) {
      data.resignationDate = new Date(body.resignationDate);
    }

    // Upsert employee exit record
    const exitData = await prisma.employeeExit.upsert({
      where: { employeeId },
      update: data,
      create: {
        employeeId,
        ...data
      }
    });

    // Update employee status to Inactive
    await prisma.employee.update({
      where: { id: employeeId },
      data: { status: 'INACTIVE', isActive: false }
    });

    return NextResponse.json(exitData);
  } catch (error) {
    console.error('Exit processing error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
