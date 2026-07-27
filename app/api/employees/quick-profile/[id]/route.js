// app/api/employees/quick-profile/[id]/route.js
import { NextResponse } from 'next/server';
import { getEmployeeQuickProfile } from '../../../../../lib/employeeService';

export async function GET(req, context) {
  try {
    const params = await context.params;
    const id = params.id;

    if (!id) {
      return NextResponse.json({ error: 'ID is required' }, { status: 400 });
    }

    const employee = await getEmployeeQuickProfile(id);

    if (!employee) {
      return NextResponse.json(
        { error: 'Employee not found' },
        { status: 404 }
      );
    }

    return NextResponse.json(employee);
  } catch (error) {
    console.error('GET quick-profile error:', error);
    return NextResponse.json(
      { error: error.message ?? 'Server error' },
      { status: 500 }
    );
  }
}
