import { NextResponse } from 'next/server';
import { prisma } from '../../../../../lib/prisma';

export async function PUT(req, { params }) {
  try {
    const { id } = await params;
    const body = await req.json();

    if (!id) {
      return NextResponse.json(
        { error: 'Cycle ID is required' },
        { status: 400 }
      );
    }

    const updatedCycle = await prisma.payrollCycle.update({
      where: { id },
      data: {
        status: body.status,
        submittedDate: body.submittedDate,
        approvedDate: body.approvedDate,
        approver: body.approver,
        processedBy: body.processedBy,
        processedDate: body.processedDate,
        paymentDate: body.paymentDate,
        payslipsGenerated: body.payslipsGenerated,
        complianceSubmitted: body.complianceSubmitted,
        bankFile: body.bankFile,
      },
    });

    return NextResponse.json(updatedCycle);
  } catch (error) {
    console.error('PUT payroll cycle error:', error);
    return NextResponse.json(
      { error: 'Failed to update payroll cycle' },
      { status: 500 }
    );
  }
}

export async function DELETE(req, { params }) {
  try {
    const { id } = await params;

    if (!id) {
      return NextResponse.json(
        { error: 'Cycle ID is required' },
        { status: 400 }
      );
    }

    // Use a transaction to ensure both cycle and associated payrolls are deleted
    await prisma.$transaction(async (tx) => {
      // 1. Delete associated Payroll records first (due to SetNull or potential constraints)
      // Even though schema is SetNull, user wants to "delete the payroll cycle"
      // which usually implies the individual records for that cycle should go too.
      await tx.payroll.deleteMany({
        where: { payrollCycleId: id },
      });

      // 2. Delete the PayrollCycle record
      await tx.payrollCycle.delete({
        where: { id: id },
      });
    });

    return NextResponse.json({
      success: true,
      message: 'Payroll cycle deleted successfully',
    });
  } catch (error) {
    console.error('DELETE payroll cycle error:', error);
    return NextResponse.json(
      { error: 'Failed to delete payroll cycle' },
      { status: 500 }
    );
  }
}
