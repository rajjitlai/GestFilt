'use client';

import { useState, useEffect } from 'react';
import { v4 as uuidv4 } from 'uuid';
import ChatWindow from '@/components/ChatWindow';
import ChatInput from '@/components/ChatInput';
import ModelSelector from '@/components/ModelSelector';
import FileUploader from '@/components/FileUploader';
import UploadedFilesList from '@/components/UploadedFilesList';
import SkillGrid from '@/components/SkillGrid';
import ChatHistory from '@/components/ChatHistory';
import type { Message, GeminiModel } from '@/lib/types';
import Link from 'next/link';

interface UploadedFile {
    fileId: string;
    filename: string;
    preview?: string;
}

export default function Home() {
    const [conversationId, setConversationId] = useState('');
    const [messages, setMessages] = useState<Message[]>([]);
    const [selectedModel, setSelectedModel] = useState<GeminiModel>('deep-research-pro-preview');
    const [selectedSkills, setSelectedSkills] = useState<string[]>([]);
    const [uploadedFiles, setUploadedFiles] = useState<UploadedFile[]>([]);
    const [enableSearch, setEnableSearch] = useState(true);
    const [isStreaming, setIsStreaming] = useState(false);
    const [streamingMessage, setStreamingMessage] = useState('');
    const [showSkillSelection, setShowSkillSelection] = useState(true);
    const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
    const [initialized, setInitialized] = useState(false);
    const [isUploading, setIsUploading] = useState(false);

    useEffect(() => {
        // Only initialize once on mount if no conversation exists
        if (!initialized && !conversationId) {
            startNewConversation();
            setInitialized(true);
        }
    }, [initialized, conversationId]);

    const startNewConversation = async () => {
        const newId = uuidv4();
        setConversationId(newId);
        setMessages([]);
        setUploadedFiles([]);
        setSelectedSkills([]);
        setShowSkillSelection(true);
        // Note: We don't create the conversation on the server yet.
        // It will be created when the first message is sent (Lazy Creation)
        // This prevents duplicate empty chats on reload.
    };

    const loadConversation = async (id: string) => {
        try {
            const response = await fetch(`/api/conversations/${id}`);
            const data = await response.json();

            setConversationId(id);
            setMessages(data.messages || []);
            setUploadedFiles(data.files || []); // Restore files
            setShowSkillSelection(false);
        } catch (error) {
            console.error('Error loading conversation:', error);
        }
    };

    const handleSendMessage = async (message: string) => {
        if (!message.trim() || isStreaming) return;

        if (showSkillSelection) {
            setShowSkillSelection(false);
        }

        const userMessage: Message = {
            role: 'user',
            content: message,
            timestamp: Date.now(),
        };

        setMessages((prev) => [...prev, userMessage]);
        setIsStreaming(true);
        setStreamingMessage('');

        try {
            // Lazy Creation: If this is the first message, create the conversation first
            if (messages.length === 0) {
                await fetch('/api/conversations', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ id: conversationId, title: 'New Research' }),
                });
            }

            const response = await fetch('/api/chat', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    message,
                    selectedSkills,

                    model: selectedModel,
                    attachedFileIds: uploadedFiles.map((f) => f.fileId),
                    sessionId: conversationId,
                    history: messages,
                    enableSearch,
                    researchConfig: typeof window !== 'undefined' && localStorage.getItem('deepResearchConfig')
                        ? JSON.parse(localStorage.getItem('deepResearchConfig')!)
                        : undefined,
                }),
            });

            if (!response.ok) {
                throw new Error('Failed to get response');
            }

            const reader = response.body?.getReader();
            const decoder = new TextDecoder();
            let fullResponse = '';

            if (reader) {
                while (true) {
                    const { done, value } = await reader.read();
                    if (done) break;

                    const chunk = decoder.decode(value);
                    const lines = chunk.split('\n');

                    for (const line of lines) {
                        if (line.startsWith('data: ')) {
                            const data = line.slice(6);

                            if (data === '[DONE]') {
                                break;
                            }

                            try {
                                const parsed = JSON.parse(data);

                                if (parsed.error) {
                                    throw new Error(parsed.error);
                                }

                                if (parsed.chunk) {
                                    fullResponse += parsed.chunk;
                                    setStreamingMessage(fullResponse);
                                }
                            } catch (e) {
                                // Skip invalid JSON
                            }
                        }
                    }
                }
            }

            const assistantMessage: Message = {
                role: 'assistant',
                content: fullResponse,
                timestamp: Date.now(),
            };

            setMessages((prev) => [...prev, assistantMessage]);

            if (messages.length === 0) {
                try {
                    await fetch(`/api/conversations/${conversationId}/title`, {
                        method: 'PUT',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ title: message.substring(0, 50) + (message.length > 50 ? '...' : '') }),
                    });
                } catch (error) {
                    console.error('Error updating title:', error);
                }
            }
        } catch (error: any) {
            console.error('Chat error:', error);

            const errorMessage: Message = {
                role: 'assistant',
                content: `Error: ${error.message}`,
                timestamp: Date.now(),
            };

            setMessages((prev) => [...prev, errorMessage]);
        } finally {
            setIsStreaming(false);
            setStreamingMessage('');
        }
    };

    const handleClear = () => {
        setMessages([]);
        setShowSkillSelection(true);
    };

    const handleFileUploaded = (file: UploadedFile) => {
        setUploadedFiles((prev) => [...prev, file]);
    };

    const handleRemoveFile = (fileId: string) => {
        setUploadedFiles((prev) => prev.filter((f) => f.fileId !== fileId));
    };

    const handleFileSelect = async (file: File) => {
        setIsUploading(true);
        try {
            const formData = new FormData();
            formData.append('file', file);

            const response = await fetch('/api/upload', {
                method: 'POST',
                body: formData,
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.error || 'Upload failed');
            }

            const result = await response.json();
            handleFileUploaded({
                fileId: result.fileId,
                filename: result.filename,
                preview: result.extractedTextPreview,
            });
        } catch (error) {
            console.error('File upload error:', error);
            // Ideally show a toast or error message to user
            alert('Failed to upload file: ' + (error as Error).message);
        } finally {
            setIsUploading(false);
        }
    };

    const handleSelectConversation = (id: string) => {
        if (id !== conversationId) {
            loadConversation(id);
        }
    };

    const handleDeleteConversation = (id: string) => {
        if (id === conversationId) {
            startNewConversation();
        }
    };

    return (
        <div className="flex h-screen bg-gray-50">
            {/* Collapsible Sidebar */}
            <div
                className={`bg-white border-r border-gray-200 overflow-y-auto flex flex-col transition-all duration-300 ${sidebarCollapsed ? 'w-0' : 'w-56'
                    }`}
                style={{ minWidth: sidebarCollapsed ? '0' : '14rem' }}
            >
                {!sidebarCollapsed && (
                    <div className="p-2.5">
                        <div className="mb-2 pb-2 border-b border-gray-200 flex items-center justify-between">
                            <h1 className="text-sm font-bold text-gray-800 px-1.5 py-1">Researcher</h1>
                        </div>

                        <ChatHistory
                            currentConversationId={conversationId}
                            onSelectConversation={handleSelectConversation}
                            onNewChat={startNewConversation}
                            onDeleteConversation={handleDeleteConversation}
                        />

                        <div className="mt-auto pt-2 border-t border-gray-200">
                            <Link
                                href="/settings"
                                className="block w-full px-2 py-1.5 bg-gray-100 text-gray-700 rounded text-xs font-medium text-center hover:bg-gray-200"
                            >
                                ⚙️ Settings
                            </Link>
                        </div>
                    </div>
                )}
            </div>

            {/* Toggle Sidebar Button */}
            <button
                onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
                className="absolute top-3 left-2 z-10 p-1.5 bg-white border border-gray-300 rounded shadow-sm hover:bg-gray-50 transition-all"
                style={{ left: sidebarCollapsed ? '8px' : 'calc(14rem + 8px)' }}
            >
                <svg
                    className={`w-4 h-4 text-gray-600 transition-transform ${sidebarCollapsed ? '' : 'rotate-180'}`}
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
            </button>

            {/* Main Content Area */}
            <div className="flex-1 flex flex-col">
                {/* Compact Header */}
                {!showSkillSelection && (
                    <div className="bg-white border-b border-gray-200 px-3 py-2">
                        <div className="flex items-center justify-end">
                            <div className="flex-shrink-0" style={{ width: '180px' }}>
                                <ModelSelector
                                    selectedModel={selectedModel}
                                    onModelChange={setSelectedModel}
                                />
                            </div>
                        </div>
                    </div>
                )}

                {/* Skill Selection or Chat Window */}
                {showSkillSelection ? (
                    <div className="flex-1 overflow-y-auto p-4">
                        <div className="max-w-6xl mx-auto">
                            <div className="mb-4">
                                <div className="flex items-center justify-between mb-3">
                                    <div>
                                        <h1 className="text-2xl font-bold text-gray-800 mb-1">
                                            Researcher
                                        </h1>
                                        <p className="text-sm text-gray-600">
                                            Select skills to guide your research assistant
                                        </p>
                                    </div>
                                    <div className="flex items-center gap-3">
                                        <ModelSelector
                                            selectedModel={selectedModel}
                                            onModelChange={setSelectedModel}
                                        />
                                    </div>
                                </div>
                            </div>
                            {/* Files are now shown in ChatInput */}

                            <SkillGrid selectedSkills={selectedSkills} onSkillsChange={setSelectedSkills} />

                            {selectedSkills.length > 0 && (
                                <div className="mt-3 p-2.5 bg-blue-50 border border-blue-200 rounded text-sm text-blue-800">
                                    ✓ {selectedSkills.length} skill{selectedSkills.length > 1 ? 's' : ''} selected. Type below to begin.
                                </div>
                            )}
                        </div>
                    </div>
                ) : (
                    <ChatWindow
                        messages={messages}
                        isStreaming={isStreaming}
                        streamingMessage={streamingMessage}
                    />
                )}

                {/* Compact Chat Input */}
                <ChatInput
                    onSend={handleSendMessage}
                    onClear={handleClear}
                    onFileSelect={handleFileSelect}
                    files={uploadedFiles}
                    onRemoveFile={handleRemoveFile}
                    enableSearch={enableSearch}
                    onToggleSearch={() => setEnableSearch(!enableSearch)}
                    disabled={isStreaming}
                    isUploading={isUploading}
                />
            </div>
        </div >
    );
}
