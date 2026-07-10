import { NextResponse } from 'next/server';
import { updateEmployeeSkills } from '../../../../../lib/skillService.js';

export async function PUT(req, { params }) {
  try {
    const resolvedParams = await params;
    const { id } = resolvedParams;
    const body = await req.json();
    const { skills, totalExperience, projectsDone } = body;
    const result = await updateEmployeeSkills(id, skills, {
      totalExperience,
      projectsDone,
    });
    return NextResponse.json(result);
  } catch (error) {
    console.error('PUT employee skills error:', error);
    return NextResponse.json(
      { error: 'Failed to update employee skills', details: error.message },
      { status: 500 }
    );
  }
}
