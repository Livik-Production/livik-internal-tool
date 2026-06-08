import { NextResponse } from 'next/server';
import { prisma } from '../../../../lib/prisma';

export async function GET(req) {
  try {
    const { searchParams } = new URL(req.url);
    const all = searchParams.get('all') === 'true';

    if (all) {
      const history = await prisma.payrollSettings.findMany({
        orderBy: { effectiveDate: 'desc' },
      });
      return NextResponse.json(
        history.map((s) => ({
          ...s,
          effectiveDate: s.effectiveDate.toISOString().split('T')[0],
        }))
      );
    }

    const settings = await prisma.payrollSettings.findFirst({
      orderBy: { effectiveDate: 'desc' },
    });

    if (!settings) {
      // Default settings if none exist
      return NextResponse.json({
        sunday: 'Leave',
        saturday: 'Leave',
        effectiveDate: new Date().toISOString().split('T')[0],
        basicPayPercent: 40.0,
        hraPercent: 50.0,
      });
    }

    return NextResponse.json({
      ...settings,
      effectiveDate: settings.effectiveDate.toISOString().split('T')[0],
    });
  } catch (error) {
    console.error('GET payroll settings error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch payroll settings' },
      { status: 500 }
    );
  }
}

export async function POST(req) {
  try {
    const { sunday, saturday, effectiveDate, basicPayPercent, hraPercent } = await req.json();

    const settings = await prisma.payrollSettings.create({
      data: {
        sunday: sunday || 'Leave',
        saturday: saturday || 'Leave',
        effectiveDate: new Date(effectiveDate || new Date()),
        basicPayPercent: basicPayPercent !== undefined ? parseFloat(basicPayPercent) : 40.0,
        hraPercent: hraPercent !== undefined ? parseFloat(hraPercent) : 50.0,
      },
    });

    return NextResponse.json({
      ...settings,
      effectiveDate: settings.effectiveDate.toISOString().split('T')[0],
    });
  } catch (error) {
    console.error('POST payroll settings error:', error);
    return NextResponse.json(
      { error: 'Failed to save payroll settings' },
      { status: 500 }
    );
  }
}
