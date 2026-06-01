'use client';

// import { UploadedFile } from '@/lib/types'; // Using local definition to match prop usage if needed, or import if consistent

interface UploadedFile {
    fileId: string; // The backend returns fileId
    filename: string;
    preview: string; // We keep this in interface but won't render it
}

interface UploadedFilesListProps {
    files: UploadedFile[];
    onRemove: (fileId: string) => void;
}

export default function UploadedFilesList({ files, onRemove }: UploadedFilesListProps) {
    if (files.length === 0) {
        return null;
    }

    return (
        <div className="mb-4">
            <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">
                Attached Files ({files.length})
            </label>
            <div className="grid grid-cols-1 gap-2">
                {files.map((file) => (
                    <div
                        key={file.fileId}
                        className="flex items-center justify-between bg-white border border-gray-200 rounded-lg p-3 shadow-sm hover:shadow-md transition-shadow"
                    >
                        <div className="flex items-center gap-3 min-w-0">
                            <div className="w-8 h-8 flex-shrink-0 bg-blue-100 text-blue-600 rounded-lg flex items-center justify-center">
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                </svg>
                            </div>
                            <div className="flex-1 min-w-0">
                                <div className="text-sm font-medium text-gray-900 truncate" title={file.filename}>
                                    {file.filename}
                                </div>
                            </div>
                        </div>
                        <button
                            onClick={() => onRemove(file.fileId)}
                            className="ml-2 p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-full transition-colors"
                            title="Remove file"
                        >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                            </svg>
                        </button>
                    </div>
                ))}
            </div>
        </div>
    );
}
