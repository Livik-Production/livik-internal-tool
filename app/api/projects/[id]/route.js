import { NextResponse } from 'next/server';
import { updateProject, deleteProject } from '../../../../lib/projectService';

export async function PUT(req, { params }) {
  try {
    const { id } = await params;
    const body = await req.json();
    const updatedProject = await updateProject(id, body);
    return NextResponse.json(updatedProject);
  } catch (error) {
    console.error('PUT project error:', error);
    return NextResponse.json(
      { error: 'Failed to update project' },
      { status: 500 }
    );
  }
}

export async function DELETE(req, { params }) {
  try {
    const { id } = await params;
    await deleteProject(id);
    return NextResponse.json({ message: 'Project deleted successfully' });
  } catch (error) {
    console.error('DELETE project error:', error);
    return NextResponse.json(
      { error: 'Failed to delete project' },
      { status: 500 }
    );
  }
}
