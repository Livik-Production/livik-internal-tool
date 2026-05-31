export const dynamic = 'force-dynamic';
import { NextResponse } from 'next/server';
import { getAllEmployees, createEmployee } from '../../../lib/employeeService';

export async function GET() {
  try {
    const employees = await getAllEmployees();
    return NextResponse.json(employees);
  } catch (error) {
    console.error('GET employees error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch employees' },
      { status: 500 }
    );
  }
}

export async function POST(req) {
  try {
    const body = await req.json();
    const employee = await createEmployee(body);
    return NextResponse.json(employee, { status: 201 });
  } catch (error) {
    console.error('POST employee error:', error);
    return NextResponse.json(
      { error: 'Failed to create employee' },
      { status: 500 }
    );
  }
}
