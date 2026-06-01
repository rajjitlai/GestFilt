import { NextRequest, NextResponse } from 'next/server';
import { updateConversationTitle } from '@/lib/chatHistory';

export async function PUT(
    request: NextRequest,
    { params }: { params: { id: string } }
) {
    try {
        const { title } = await request.json();
        updateConversationTitle(params.id, title);
        return NextResponse.json({ success: true });
    } catch (error) {
        console.error('Error updating title:', error);
        return NextResponse.json(
            { error: 'Failed to update title' },
            { status: 500 }
        );
    }
}
