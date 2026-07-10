import { NextResponse } from 'next/server';


// GET /api/locations
// Retrieves all locations
export async function GET(req) {
  try {
    const locations = await prisma.location.findMany({
      orderBy: { createdAt: 'desc' }
    });
    return NextResponse.json(locations, { status: 200 });
  } catch (error) {
    console.error('Error fetching locations:', error);
    return NextResponse.json({ error: 'Failed to fetch locations' }, { status: 500 });
  }
}

// POST /api/locations
// Creates a new location
export async function POST(req) {
  try {
    const data = await req.json();

    // Validate required fields
    if (!data.locationName || !data.locationType) {
      return NextResponse.json({ error: 'Location Name and Type are required' }, { status: 400 });
    }

    // Check for duplicate names
    const existing = await prisma.location.findUnique({
      where: { locationName: data.locationName }
    });

    if (existing) {
      return NextResponse.json({ error: 'A location with this name already exists' }, { status: 409 });
    }

    const location = await prisma.location.create({
      data: {
        locationName: data.locationName,
        locationCode: data.locationCode || null,
        locationType: data.locationType,
        description: data.description || null,
        status: data.status || 'Active'
      }
    });

    return NextResponse.json(location, { status: 201 });
  } catch (error) {
    console.error('Error creating location:', error);
    return NextResponse.json({ error: 'Failed to create location' }, { status: 500 });
  }
}
