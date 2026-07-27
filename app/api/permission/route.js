// app/api/permission/route.js
import { NextResponse } from 'next/server';
import {
  getAllPermissionRequests,
  createPermissionRequest,
} from '../../../lib/permissionService.js';

export async function GET(req) {
  try {
    const url = new URL(req.url);
    const employeeId = url.searchParams.get('employeeId') ?? undefined;
    const status = url.searchParams.get('status') ?? undefined;
    const date = url.searchParams.get('date') ?? undefined;
    const excludeEmployeeId =
      url.searchParams.get('excludeEmployeeId') ?? undefined;

    const filters = { employeeId, status, date, excludeEmployeeId };
    const res = await getAllPermissionRequests(filters);
    return NextResponse.json(JSON.parse(JSON.stringify(res)));
  } catch (error) {
    console.error('GET /api/permission error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch permission requests' },
      { status: 500 }
    );
  }
}

export async function POST(req) {
  try {
    const body = await req.json();
    const created = await createPermissionRequest(body);
    return NextResponse.json(JSON.parse(JSON.stringify(created)), {
      status: 201,
    });
  } catch (error) {
    console.error('POST /api/permission error:', error);
    return NextResponse.json(
      { error: error.message ?? 'Failed to create permission request' },
      { status: 400 }
    );
  }
}
