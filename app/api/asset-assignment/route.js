export const dynamic = 'force-dynamic';
import { NextResponse } from 'next/server';
import { assetAssignmentService } from '../../../lib/assetAssignmentService';
import { prisma } from '../../../lib/prisma';

export async function POST(req) {
  try {
    let { assetId, employeeId, assignedDate, notes, assignmentType, locationId } = await req.json();
    
    assignmentType = assignmentType || 'EMPLOYEE';

    if (assignmentType === 'EMPLOYEE' && employeeId && !employeeId.startsWith('c')) {
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
      notes,
      assignmentType,
      locationId
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

export async function PUT(req) {
  try {
    let { assignmentId, assignedDate, notes, assignmentType, employeeId, locationId } = await req.json();
    
    if (!assignmentId) throw new Error('assignmentId is required');

    if (assignmentType === 'EMPLOYEE' && employeeId && !employeeId.startsWith('c')) {
      const emp = await prisma.employee.findFirst({ where: { id: employeeId } });
      if (emp) {
        employeeId = emp.id;
      } else {
        const empByEmpId = await prisma.employee.findFirst({ where: { empId: employeeId } });
        if (empByEmpId) {
          employeeId = empByEmpId.id;
        } else {
          throw new Error('Employee not found with ID: ' + employeeId);
        }
      }
    }

    const updated = await prisma.assetAssignment.update({
      where: { id: assignmentId },
      data: {
        assignedDate: assignedDate ? new Date(assignedDate) : undefined,
        notes: notes,
        assignmentType,
        employeeId: assignmentType === 'EMPLOYEE' ? employeeId : null,
        locationId: assignmentType === 'LOCATION' ? locationId : null,
      },
    });
    return NextResponse.json({ message: 'Updated', updated });
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
