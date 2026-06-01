import { NextRequest, NextResponse } from 'next/server';
import { getSkillById, updateSkill, deleteSkill } from '@/lib/skillEngine';

export async function GET(
    request: NextRequest,
    { params }: { params: { id: string } }
) {
    try {
        const skill = await getSkillById(params.id);

        if (!skill) {
            return NextResponse.json(
                { error: 'Skill not found' },
                { status: 404 }
            );
        }

        return NextResponse.json(skill);
    } catch (error) {
        console.error('Error loading skill:', error);
        return NextResponse.json(
            { error: 'Failed to load skill' },
            { status: 500 }
        );
    }
}

export async function PUT(
    request: NextRequest,
    { params }: { params: { id: string } }
) {
    try {
        const body = await request.json();

        const updatedSkill = await updateSkill(params.id, body);

        if (!updatedSkill) {
            return NextResponse.json(
                { error: 'Skill not found' },
                { status: 404 }
            );
        }

        return NextResponse.json(updatedSkill);
    } catch (error) {
        console.error('Error updating skill:', error);
        return NextResponse.json(
            { error: 'Failed to update skill' },
            { status: 500 }
        );
    }
}

export async function DELETE(
    request: NextRequest,
    { params }: { params: { id: string } }
) {
    try {
        const deleted = await deleteSkill(params.id);

        if (!deleted) {
            return NextResponse.json(
                { error: 'Skill not found' },
                { status: 404 }
            );
        }

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error('Error deleting skill:', error);
        return NextResponse.json(
            { error: 'Failed to delete skill' },
            { status: 500 }
        );
    }
}
