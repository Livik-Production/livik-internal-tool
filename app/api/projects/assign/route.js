import { NextResponse } from 'next/server';
import {
  assignMemberToProject,
  removeMemberFromProject,
} from '../../../../lib/projectService.js';
import {
  putEmployeeOnBench,
  removeEmployeeFromBench,
} from '../../../../lib/benchService.js';

export async function POST(req) {
  try {
    const { projectId, employeeId, role } = await req.json();
    const assignment = await assignMemberToProject(projectId, employeeId, role);
    // Employee is now on a project — remove from bench
    await removeEmployeeFromBench(employeeId);
    return NextResponse.json(assignment);
  } catch (error) {
    console.error('Assign member error:', error);
    return NextResponse.json(
      { error: 'Failed to assign member' },
      { status: 500 }
    );
  }
}

export async function DELETE(req) {
  try {
    const { projectId, employeeId } = await req.json();
    await removeMemberFromProject(projectId, employeeId);
    // Employee returned from project — put back on bench (resets bench clock)
    await putEmployeeOnBench(employeeId);
    return NextResponse.json({ message: 'Member removed from project' });
  } catch (error) {
    console.error('Remove member error:', error);
    return NextResponse.json(
      { error: 'Failed to remove member' },
      { status: 500 }
    );
  }
}
