'use client';

import { useState } from 'react';

interface FileUploaderProps {
    onFileUploaded: (file: { fileId: string; filename: string; preview: string }) => void;
}

export default function FileUploader({ onFileUploaded }: FileUploaderProps) {
    const [uploading, setUploading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        setUploading(true);
        setError(null);

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
            onFileUploaded({
                fileId: result.fileId,
                filename: result.filename,
                preview: result.extractedTextPreview,
            });

            // Reset input
            e.target.value = '';
        } catch (err: any) {
            setError(err.message);
        } finally {
            setUploading(false);
        }
    };

    return (
        <div className="mb-6">
            <label className="block text-sm font-medium text-gray-300 mb-2">
                Upload Document
            </label>
            <div className="relative">
                <input
                    type="file"
                    onChange={handleFileChange}
                    accept=".pdf,.txt,.md,.docx"
                    disabled={uploading}
                    className="block w-full text-sm text-gray-400
            file:mr-4 file:py-2 file:px-4
            file:rounded-lg file:border-0
            file:text-sm file:font-semibold
            file:bg-blue-600 file:text-white
            hover:file:bg-blue-700
            file:cursor-pointer
            disabled:opacity-50 disabled:cursor-not-allowed"
                />
            </div>
            {uploading && (
                <div className="mt-2 text-xs text-blue-400">
                    Uploading and processing...
                </div>
            )}
            {error && (
                <div className="mt-2 text-xs text-red-400">
                    {error}
                </div>
            )}
            <div className="mt-1 text-xs text-gray-500">
                Supported: PDF, TXT, MD, DOCX (max 10MB)
            </div>
        </div>
    );
}
