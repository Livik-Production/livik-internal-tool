export const dynamic = 'force-dynamic';
import { NextResponse } from 'next/server';
import { assetAssignmentService } from '../../../lib/assetAssignmentService';

export async function POST(req) {
  try {
    let { assetId, employeeId, assignedDate, notes } = await req.json();
    
    // If employeeId is the display ID (e.g. LK-2026-001) instead of CUID, look it up
    if (employeeId && !employeeId.startsWith('c')) {
      const { prisma } = require('../../../lib/prisma');
      const emp = await prisma.employee.findFirst({ where: { id: employeeId } });
      if (emp) {
        employeeId = emp.id; // It happened to be a CUID
      } else {
        const empByEmpId = await prisma.employee.findFirst({ where: { empId: employeeId } });
        if (empByEmpId) {
          employeeId = empByEmpId.id;
        } else {
          throw new Error('Employee not found with ID: ' + employeeId);
        }
      }
    }

    const assigned = await assetAssignmentService.assignAsset(
      assetId,
      employeeId,
      assignedDate,
      notes
    );
    return NextResponse.json({ message: 'Assigned', assigned });
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function GET() {
  const data = await assetAssignmentService.listAssigned();
  return NextResponse.json({ data });
}
