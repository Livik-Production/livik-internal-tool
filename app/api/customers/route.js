// app/api/customers/route.js
import { NextResponse } from 'next/server';
import {
  createCustomer,
  getAllCustomers,
} from '../../../lib/customerService.js';

export async function GET(req) {
  try {
    const url = new URL(req.url);

    const name = url.searchParams.get('name') ?? undefined;
    const mobile = url.searchParams.get('mobile') ?? undefined;
    const gstnNumber = url.searchParams.get('gstnNumber') ?? undefined;

    const customers = await getAllCustomers({ name, mobile, gstnNumber });
    return NextResponse.json(JSON.parse(JSON.stringify(customers)));
  } catch (error) {
    console.error('GET /api/customers error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch customers' },
      { status: 500 }
    );
  }
}

export async function POST(req) {
  try {
    const body = await req.json();
    const created = await createCustomer(body);

    return NextResponse.json(JSON.parse(JSON.stringify(created)), {
      status: 201,
    });
  } catch (error) {
    console.error('POST /api/customers error:', error);
    return NextResponse.json(
      { error: error.message ?? 'Failed to create customer' },
      { status: 400 }
    );
  }
}
