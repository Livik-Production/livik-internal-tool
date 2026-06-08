import { NextResponse } from 'next/server';
import { prisma } from '../../../../../lib/prisma';

export async function PUT(req, { params }) {
  try {
    const { id } = await params;
    const body = await req.json();
    const { sunday, saturday, effectiveDate, companyHoliday, basicPayPercent, hraPercent } = body;

    const updated = await prisma.payrollSettings.update({
      where: { id },
      data: {
        sunday,
        saturday,
        effectiveDate: new Date(effectiveDate),
        companyHoliday,
        basicPayPercent: basicPayPercent !== undefined ? parseFloat(basicPayPercent) : undefined,
        hraPercent: hraPercent !== undefined ? parseFloat(hraPercent) : undefined,
      },
    });

    return NextResponse.json({
      ...updated,
      effectiveDate: updated.effectiveDate.toISOString().split('T')[0],
    });
  } catch (error) {
    console.error('PUT payroll setting error:', error);
    return NextResponse.json(
      { error: 'Failed to update payroll setting' },
      { status: 500 }
    );
  }
}

export async function DELETE(req, { params }) {
  try {
    const { id } = await params;

    // Don't delete if it's the only record (optional, but good for safety)
    const count = await prisma.payrollSettings.count();
    if (count <= 1) {
      return NextResponse.json(
        { error: 'Cannot delete the only remaining payroll setting record' },
        { status: 400 }
      );
    }

    await prisma.payrollSettings.delete({
      where: { id },
    });

    return NextResponse.json({
      message: 'Payroll setting deleted successfully',
    });
  } catch (error) {
    console.error('DELETE payroll setting error:', error);
    return NextResponse.json(
      { error: 'Failed to delete payroll setting' },
      { status: 500 }
    );
  }
}
