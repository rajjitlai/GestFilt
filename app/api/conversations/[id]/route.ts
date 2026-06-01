import { NextRequest, NextResponse } from 'next/server';
import { getConversation, deleteConversation, getMessages, getConversationFiles } from '@/lib/chatHistory';

export async function GET(
    request: NextRequest,
    { params }: { params: { id: string } }
) {
    try {
        const conversation = getConversation(params.id);

        if (!conversation) {
            return NextResponse.json(
                { error: 'Conversation not found' },
                { status: 404 }
            );
        }

        const messages = getMessages(params.id);
        const files = getConversationFiles(params.id);

        return NextResponse.json({
            conversation,
            messages,
            files,
        });
    } catch (error) {
        console.error('Error getting conversation:', error);
        return NextResponse.json(
            { error: 'Failed to load conversation' },
            { status: 500 }
        );
    }
}

export async function DELETE(
    request: NextRequest,
    { params }: { params: { id: string } }
) {
    try {
        deleteConversation(params.id);
        return NextResponse.json({ success: true });
    } catch (error) {
        console.error('Error deleting conversation:', error);
        return NextResponse.json(
            { error: 'Failed to delete conversation' },
            { status: 500 }
        );
    }
}
