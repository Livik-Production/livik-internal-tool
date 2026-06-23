// app/api/customers/[id]/route.js
import { NextResponse } from 'next/server';
import {
  getCustomerById,
  updateCustomer,
  deleteCustomer,
} from '../../../../lib/customerService.js';

export async function GET(req, context) {
  try {
    const params = await context.params;
    const customer = await getCustomerById(params.id);

    if (!customer) {
      return NextResponse.json(
        { error: 'Customer not found' },
        { status: 404 }
      );
    }

    return NextResponse.json(JSON.parse(JSON.stringify(customer)));
  } catch (error) {
    console.error('GET /api/customers/[id] error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch customer' },
      { status: 500 }
    );
  }
}

export async function PUT(req, context) {
  try {
    const params = await context.params;
    const body = await req.json();

    const updated = await updateCustomer(params.id, body);
    return NextResponse.json(JSON.parse(JSON.stringify(updated)));
  } catch (error) {
    console.error('PUT /api/customers/[id] error:', error);
    return NextResponse.json(
      { error: error.message ?? 'Failed to update customer' },
      { status: 400 }
    );
  }
}

export async function DELETE(req, context) {
  try {
    const params = await context.params;
    const deleted = await deleteCustomer(params.id);

    return NextResponse.json(JSON.parse(JSON.stringify(deleted)));
  } catch (error) {
    console.error('DELETE /api/customers/[id] error:', error);
    return NextResponse.json(
      { error: 'Failed to delete customer' },
      { status: 500 }
    );
  }
}
