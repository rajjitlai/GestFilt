import { NextResponse } from 'next/server';
import { getAllConversations, createConversation } from '@/lib/chatHistory';

export async function GET() {
    try {
        const conversations = getAllConversations();
        return NextResponse.json(conversations);
    } catch (error) {
        console.error('Error getting conversations:', error);
        return NextResponse.json(
            { error: 'Failed to load conversations' },
            { status: 500 }
        );
    }
}

export async function POST(request: Request) {
    try {
        const { id, title } = await request.json();
        const conversation = createConversation(id, title);
        return NextResponse.json(conversation);
    } catch (error) {
        console.error('Error creating conversation:', error);
        return NextResponse.json(
            { error: 'Failed to create conversation' },
            { status: 500 }
        );
    }
}
