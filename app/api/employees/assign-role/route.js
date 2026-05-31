export const dynamic = 'force-dynamic';
import { NextResponse } from 'next/server';
import { safeExecute } from '../../../../lib/dbHelpers';

export async function POST(req) {
  try {
    const { employeeId, roleId } = await req.json();

    if (!employeeId) {
      return NextResponse.json(
        { error: 'Employee ID is required' },
        { status: 400 }
      );
    }

    // employeeId should be the UUID (cuid)
    const updated = await safeExecute((prisma) =>
      prisma.employee.update({
        where: { id: employeeId },
        data: { roleId: roleId || null }, // null clears the role
        include: {
          role: true,
        },
      })
    );

    return NextResponse.json(JSON.parse(JSON.stringify(updated)));
  } catch (error) {
    console.error('POST assign-role error:', error);
    return NextResponse.json(
      { error: 'Failed to assign role', details: error.message },
      { status: 500 }
    );
  }
}
