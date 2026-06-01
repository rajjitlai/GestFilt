'use client';

import { useState, useEffect } from 'react';

interface Conversation {
    id: string;
    title: string;
    created_at: number;
    updated_at: number;
}

interface ChatHistoryProps {
    currentConversationId: string;
    onSelectConversation: (id: string) => void;
    onNewChat: () => void;
    onDeleteConversation: (id: string) => void;
}

export default function ChatHistory({
    currentConversationId,
    onSelectConversation,
    onNewChat,
    onDeleteConversation,
}: ChatHistoryProps) {
    const [conversations, setConversations] = useState<Conversation[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        loadConversations();
    }, []);

    const loadConversations = async () => {
        try {
            const response = await fetch('/api/conversations');
            const data = await response.json();
            setConversations(data);
        } catch (error) {
            console.error('Error loading conversations:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = async (id: string, e: React.MouseEvent) => {
        e.stopPropagation();

        if (!confirm('Delete this conversation?')) {
            return;
        }

        try {
            await fetch(`/api/conversations/${id}`, { method: 'DELETE' });
            setConversations(prev => prev.filter(c => c.id !== id));
            onDeleteConversation(id);
        } catch (error) {
            console.error('Error deleting conversation:', error);
        }
    };

    useEffect(() => {
        loadConversations();
    }, [currentConversationId]);

    return (
        <div className="flex flex-col flex-1">
            <button
                onClick={onNewChat}
                className="mb-2 px-2 py-1.5 bg-blue-500 hover:bg-blue-600 text-white rounded text-xs font-medium"
            >
                + New Chat
            </button>

            <div className="flex-1 overflow-y-auto">
                <div className="text-xs font-semibold text-gray-500 mb-1.5 px-1">
                    HISTORY
                </div>

                {loading ? (
                    <div className="text-xs text-gray-500 px-1">Loading...</div>
                ) : conversations.length === 0 ? (
                    <div className="text-xs text-gray-500 px-1">No chats yet</div>
                ) : (
                    <div className="space-y-0.5">
                        {conversations.map((conv) => (
                            <div
                                key={conv.id}
                                onClick={() => onSelectConversation(conv.id)}
                                className={`group flex items-center justify-between px-2 py-1.5 rounded cursor-pointer ${conv.id === currentConversationId
                                        ? 'bg-blue-50 text-blue-900 border border-blue-200'
                                        : 'hover:bg-gray-100 text-gray-700'
                                    }`}
                            >
                                <div className="flex-1 min-w-0">
                                    <div className="text-xs font-medium truncate">
                                        {conv.title}
                                    </div>
                                    <div className="text-xs text-gray-500">
                                        {new Date(conv.updated_at).toLocaleDateString()}
                                    </div>
                                </div>
                                <button
                                    onClick={(e) => handleDelete(conv.id, e)}
                                    className="ml-1 p-0.5 opacity-0 group-hover:opacity-100 hover:bg-red-100 text-red-600 rounded"
                                    title="Delete"
                                >
                                    <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                    </svg>
                                </button>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}
