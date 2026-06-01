'use client';

import { useEffect, useRef } from 'react';
import type { Message } from '@/lib/types';
import { marked } from 'marked';

interface ChatWindowProps {
    messages: Message[];
    isStreaming: boolean;
    streamingMessage: string;
}

export default function ChatWindow({ messages, isStreaming, streamingMessage }: ChatWindowProps) {
    const scrollRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (scrollRef.current) {
            scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
        }
    }, [messages, streamingMessage]);

    const formatMessage = (content: string) => {
        try {
            return { __html: marked(content) };
        } catch {
            return { __html: content.replace(/\n/g, '<br>') };
        }
    };

    const formatTime = (timestamp: number) => {
        return new Date(timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    };

    return (
        <div
            ref={scrollRef}
            className="flex-1 overflow-y-auto bg-white relative scroll-smooth"
        >
            {messages.length === 0 && !isStreaming && (
                <div className="flex flex-col items-center justify-center h-full p-8 text-center text-gray-500 animate-fade-in">
                    <div className="w-16 h-16 bg-blue-50 rounded-2xl flex items-center justify-center mb-6 shadow-sm">
                        <svg className="w-8 h-8 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" />
                        </svg>
                    </div>
                    <h2 className="text-2xl font-semibold text-gray-900 mb-2">Researcher</h2>
                    <p className="max-w-md text-gray-500 mb-8">
                        Select a skill or model above to begin your research session with deep reasoning capabilities.
                    </p>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 w-full max-w-2xl">
                        {['Analyze this document', 'Summarize key findings', 'Explain complex topic', 'Draft a report'].map((suggestion) => (
                            <div key={suggestion} className="p-3 border border-gray-200 rounded-lg text-sm text-gray-600 hover:bg-gray-50 hover:border-gray-300 transition-colors cursor-pointer text-left">
                                {suggestion}
                            </div>
                        ))}
                    </div>
                </div>
            )}

            <div className="flex flex-col pb-4">
                {messages.map((message, index) => (
                    <div
                        key={index}
                        className={`w-full py-6 px-4 ${message.role === 'assistant' ? 'bg-white' : 'bg-gray-100' // Distinct backgrounds
                            }`}
                    >
                        <div className="max-w-3xl mx-auto flex gap-4 sm:gap-6 animate-fade-in">
                            {/* Avatar */}
                            <div className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center mt-0.5 ${message.role === 'user'
                                ? 'bg-gray-200 text-gray-600'
                                : 'bg-blue-600 text-white shadow-sm'
                                }`}>
                                {message.role === 'user' ? (
                                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                                    </svg>
                                ) : (
                                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                                    </svg>
                                )}
                            </div>

                            {/* Message Content */}
                            <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2 mb-1">
                                    <span className="font-semibold text-gray-900 text-sm">
                                        {message.role === 'user' ? 'You' : 'Deep Research'}
                                    </span>
                                    <span className="text-xs text-gray-400">
                                        {formatTime(message.timestamp)}
                                    </span>
                                </div>

                                <div
                                    className="prose prose-sm max-w-none text-gray-800 leading-relaxed"
                                    dangerouslySetInnerHTML={formatMessage(message.content)}
                                />
                            </div>
                        </div>
                    </div>
                ))}

                {isStreaming && (
                    <div className="w-full py-6 px-4 bg-gray-50/50">
                        <div className="max-w-3xl mx-auto flex gap-4 sm:gap-6 animate-fade-in">
                            {/* AI Avatar */}
                            <div className="flex-shrink-0 w-8 h-8 rounded-full bg-blue-600 text-white flex items-center justify-center mt-0.5 shadow-sm">
                                <svg className="w-5 h-5 animate-pulse" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                                </svg>
                            </div>

                            {/* Streaming Content */}
                            <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2 mb-1">
                                    <span className="font-semibold text-gray-900 text-sm">Deep Research</span>
                                    <div className="flex gap-1 items-center h-4">
                                        <span className="w-1 h-1 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></span>
                                        <span className="w-1 h-1 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></span>
                                        <span className="w-1 h-1 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></span>
                                    </div>
                                </div>

                                <div
                                    className="prose prose-sm max-w-none text-gray-800 leading-relaxed"
                                    dangerouslySetInnerHTML={formatMessage(streamingMessage || '')}
                                />
                                {!streamingMessage && (
                                    <span className="inline-block w-1.5 h-4 bg-gray-400 animate-pulse ml-0.5 align-middle"></span>
                                )}
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
