import { NextRequest, NextResponse } from 'next/server';
import { saveUploadedFile } from '@/lib/fileProcessor';

export async function POST(request: NextRequest) {
    try {
        const formData = await request.formData();
        const file = formData.get('file') as File;

        if (!file) {
            return NextResponse.json(
                { error: 'No file provided' },
                { status: 400 }
            );
        }

        const result = await saveUploadedFile(file);

        return NextResponse.json({
            fileId: result.fileId,
            filename: result.filename,
            extractedTextPreview: result.extractedText.substring(0, 500) + '...',
        });
    } catch (error: any) {
        console.error('Upload error:', error);
        return NextResponse.json(
            { error: error.message || 'Failed to upload file' },
            { status: 500 }
        );
    }
}
