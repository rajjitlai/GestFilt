import { NextResponse } from 'next/server';
import { loadSkills, createSkill } from '@/lib/skillEngine';
import type { Skill } from '@/lib/types';

export async function GET() {
    try {
        const skills = await loadSkills();
        return NextResponse.json(skills);
    } catch (error) {
        console.error('Error loading skills:', error);
        return NextResponse.json(
            { error: 'Failed to load skills' },
            { status: 500 }
        );
    }
}

export async function POST(request: Request) {
    try {
        const body = await request.json();

        const newSkill = await createSkill({
            name: body.name,
            description: body.description,
            systemPrompt: body.systemPrompt,
            processSteps: body.processSteps || [],
            outputFormat: body.outputFormat || '',
            strictMode: body.strictMode || false,
        });

        return NextResponse.json(newSkill);
    } catch (error) {
        console.error('Error creating skill:', error);
        return NextResponse.json(
            { error: 'Failed to create skill' },
            { status: 500 }
        );
    }
}
