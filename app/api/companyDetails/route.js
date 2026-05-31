import { NextResponse } from 'next/server';
import { prisma } from '../../../lib/prisma';

export async function GET() {
  try {
    const companyDetail = await prisma.companyDetails.findFirst();
    return NextResponse.json(companyDetail || {});
  } catch (error) {
    console.error('Failed to fetch company details:', error);
    return NextResponse.json(
      { error: 'Failed to fetch company details' },
      { status: 500 }
    );
  }
}

export async function PUT(request) {
  try {
    const body = await request.json();
    const {
      companyName,
      companyEmail,
      companyPhone,
      city,
      state,
      country,
      address,
      startedDate,
      bankName,
      gstnNumber,
      panNumber,
      accountHolderName,
      accountNumber,
      ifscCode,
      swiftCode,
    } = body;

    // Validate required fields
    if (!companyName || !companyEmail || !companyPhone || !city || !state || !country || !address || !startedDate) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Check if a record already exists
    const existingDetail = await prisma.companyDetails.findFirst();

    let updatedDetail;

    const data = {
      companyName,
      companyEmail,
      companyPhone,
      city,
      state,
      country,
      address,
      startedDate: new Date(startedDate),
      bankName: bankName || null,
      gstnNumber: gstnNumber || null,
      panNumber: panNumber || null,
      accountHolderName: accountHolderName || null,
      accountNumber: accountNumber || null,
      ifscCode: ifscCode || null,
      swiftCode: swiftCode || null,
    };

    if (existingDetail) {
      updatedDetail = await prisma.companyDetails.update({
        where: { id: existingDetail.id },
        data,
      });
    } else {
      updatedDetail = await prisma.companyDetails.create({
        data,
      });
    }

    return NextResponse.json(updatedDetail);
  } catch (error) {
    console.error('Failed to update company details:', error);
    return NextResponse.json(
      { error: 'Failed to update company details' },
      { status: 500 }
    );
  }
}
