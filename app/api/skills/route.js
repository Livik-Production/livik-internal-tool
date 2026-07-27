import { NextResponse } from 'next/server';
import { createSkill, getAllSkills, getSkillsByEmployee } from '../../../lib/skillService.js';

export async function GET(req) {
  try {
    const { searchParams } = new URL(req.url);
    const employeeId = searchParams.get('employeeId');

    if (employeeId) {
      const skills = await getSkillsByEmployee(employeeId);
      return NextResponse.json(skills);
    }

    const skills = await getAllSkills();
    return NextResponse.json(skills);
  } catch (error) {
    console.error('GET skills error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch skills' },
      { status: 500 }
    );
  }
}

export async function POST(req) {
  try {
    const body = await req.json();
    
    if (!body.employeeId || !body.name || !body.proficiency) {
      return NextResponse.json(
        { error: 'Missing required fields: employeeId, name, proficiency' },
        { status: 400 }
      );
    }

    const newSkill = await createSkill(body);
    return NextResponse.json(newSkill, { status: 201 });
  } catch (error) {
    console.error('POST skill error:', error);
    return NextResponse.json(
      { error: 'Failed to create skill' },
      { status: 500 }
    );
  }
}
