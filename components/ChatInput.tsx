'use client';

import { useState, KeyboardEvent, useRef, useEffect } from 'react';

interface UploadedFile {
    fileId: string;
    filename: string;
    preview?: string;
}

interface ChatInputProps {
    onSend: (message: string) => void;
    onClear: () => void;
    onFileSelect?: (file: File) => void;
    files?: UploadedFile[];
    onRemoveFile?: (fileId: string) => void;
    disabled: boolean;
    isUploading?: boolean;
    enableSearch?: boolean;
    onToggleSearch?: () => void;
}

export default function ChatInput({
    onSend,
    onClear,
    onFileSelect,
    files = [],
    onRemoveFile,
    disabled,
    isUploading,
    enableSearch,
    onToggleSearch
}: ChatInputProps) {
    const [input, setInput] = useState('');
    const textareaRef = useRef<HTMLTextAreaElement>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    // Auto-resize textarea
    useEffect(() => {
        if (textareaRef.current) {
            textareaRef.current.style.height = 'auto';
            textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 160)}px`;
        }
    }, [input]);

    const handleSend = () => {
        if (input.trim() && !disabled) {
            onSend(input.trim());
            setInput('');
            // Reset height
            if (textareaRef.current) {
                textareaRef.current.style.height = 'auto';
                textareaRef.current.style.height = '24px';
            }
        }
    };

    const handleKeyPress = (e: KeyboardEvent<HTMLTextAreaElement>) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            handleSend();
        }
    };

    const handleFileClick = () => {
        fileInputRef.current?.click();
    };

    const onFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file && onFileSelect) {
            onFileSelect(file);
            e.target.value = '';
        }
    };

    return (
        <div className="border-t border-gray-100 bg-white p-4">
            <div className="max-w-3xl mx-auto flex flex-col items-center">
                <div className="w-full relative bg-gray-50 border border-gray-200 rounded-2xl shadow-sm focus-within:ring-2 focus-within:ring-blue-100 focus-within:border-blue-400 transition-all">

                    {/* Attached Files Preview */}
                    {files.length > 0 && (
                        <div className="flex flex-wrap gap-2 px-3 pt-3 pb-1 border-b border-gray-200/50">
                            {files.map((file) => (
                                <div key={file.fileId} className="flex items-center gap-2 bg-white border border-gray-200 rounded-lg px-2 py-1.5 shadow-sm">
                                    <div className="w-6 h-6 flex-shrink-0 bg-blue-50 text-blue-600 rounded flex items-center justify-center">
                                        <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                        </svg>
                                    </div>
                                    <span className="text-xs font-medium text-gray-700 max-w-[150px] truncate" title={file.filename}>
                                        {file.filename}
                                    </span>
                                    {onRemoveFile && (
                                        <button
                                            onClick={() => onRemoveFile(file.fileId)}
                                            className="text-gray-400 hover:text-red-500 rounded-full p-0.5 transition-colors"
                                            title="Remove file"
                                        >
                                            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                            </svg>
                                        </button>
                                    )}
                                </div>
                            ))}
                        </div>
                    )}

                    <div className="flex items-end">
                        {/* Attachment Button & Search Toggle */}
                        {onFileSelect && (
                            <div className="pl-2 pb-2 flex items-center">
                                {onToggleSearch && (
                                    <button
                                        onClick={onToggleSearch}
                                        disabled={disabled}
                                        className={`p-2 rounded-lg transition-colors mr-1 ${enableSearch
                                            ? 'text-blue-500 bg-blue-50'
                                            : 'text-gray-400 hover:text-gray-600 hover:bg-gray-200'
                                            }`}
                                        title={enableSearch ? "Disable Web Search" : "Enable Web Search"}
                                    >
                                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9m-9 9a9 9 0 019-9" />
                                        </svg>
                                    </button>
                                )}

                                <input
                                    type="file"
                                    ref={fileInputRef}
                                    onChange={onFileChange}
                                    className="hidden"
                                    accept=".pdf,.txt,.md,.docx"
                                />
                                <button
                                    onClick={handleFileClick}
                                    disabled={disabled || isUploading}
                                    className={`p-2 rounded-lg transition-colors ${isUploading
                                        ? 'text-blue-400 animate-pulse cursor-wait'
                                        : 'text-gray-400 hover:text-gray-600 hover:bg-gray-200'
                                        }`}
                                    title="Attach file"
                                >
                                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13" />
                                    </svg>
                                </button>
                            </div>
                        )}

                        <textarea
                            ref={textareaRef}
                            value={input}
                            onChange={(e) => setInput(e.target.value)}
                            onKeyDown={handleKeyPress}
                            placeholder="Ask anything..."
                            disabled={disabled}
                            rows={1}
                            className="flex-1 bg-transparent border-0 px-3 py-3.5 text-base text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-0 resize-none disabled:opacity-50 min-h-[52px] max-h-[200px]"
                            style={{ height: '52px' }}
                        />

                        <div className="pr-2 pb-2">
                            <button
                                onClick={handleSend}
                                disabled={disabled || (!input.trim() && files.length === 0)}
                                className={`p-2 rounded-lg transition-all duration-200 ${(input.trim() || files.length > 0) && !disabled
                                    ? 'bg-blue-600 text-white hover:bg-blue-700 shadow-sm'
                                    : 'bg-gray-200 text-gray-400 cursor-not-allowed'
                                    }`}
                            >
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 12h14M12 5l7 7-7 7" />
                                </svg>
                            </button>
                        </div>
                    </div>
                </div>

                <div className="w-full flex justify-between items-center mt-2 px-1 text-xs text-gray-400">
                    <div className="flex-1 text-center">
                        Deep Research Pro Preview can make mistakes. Check important info.
                    </div>
                    <button
                        onClick={onClear}
                        className="hover:text-red-500 transition-colors flex items-center gap-1 ml-auto shrink-0"
                        title="Clear conversation"
                        disabled={disabled}
                    >
                        <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                    </button>
                </div>
            </div>
        </div>
    );
}
