import fs from 'fs/promises';
import path from 'path';
import pdfParse from 'pdf-parse';
import mammoth from 'mammoth';
import { v4 as uuidv4 } from 'uuid';

const UPLOAD_DIR = path.join(process.cwd(), 'uploads');
const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
const MAX_TEXT_LENGTH = 50000;
const ALLOWED_EXTENSIONS = ['.pdf', '.txt', '.md', '.docx'];

/**
 * Ensure upload directory exists
 */
export async function ensureUploadDir() {
    try {
        await fs.access(UPLOAD_DIR);
    } catch {
        await fs.mkdir(UPLOAD_DIR, { recursive: true });
    }
}

/**
 * Sanitize filename to prevent path traversal
 */
export function sanitizeFilename(filename: string): string {
    return filename
        .replace(/[^a-zA-Z0-9._-]/g, '_')
        .replace(/\.+/g, '.')
        .substring(0, 100);
}

/**
 * Validate file
 */
export function validateFile(filename: string, size: number): { valid: boolean; error?: string } {
    const ext = path.extname(filename).toLowerCase();

    if (!ALLOWED_EXTENSIONS.includes(ext)) {
        return { valid: false, error: `File type not allowed. Accepted: ${ALLOWED_EXTENSIONS.join(', ')}` };
    }

    if (size > MAX_FILE_SIZE) {
        return { valid: false, error: `File too large. Max size: 10MB` };
    }

    return { valid: true };
}

/**
 * Extract text from PDF
 */
async function extractPdfText(filePath: string): Promise<string> {
    const dataBuffer = await fs.readFile(filePath);
    const data = await pdfParse(dataBuffer);
    return data.text;
}

/**
 * Extract text from DOCX
 */
async function extractDocxText(filePath: string): Promise<string> {
    const buffer = await fs.readFile(filePath);
    const result = await mammoth.extractRawText({ buffer });
    return result.value;
}

/**
 * Extract text from TXT/MD
 */
async function extractPlainText(filePath: string): Promise<string> {
    return await fs.readFile(filePath, 'utf-8');
}

/**
 * Extract text based on file extension
 */
export async function extractText(filePath: string): Promise<string> {
    const ext = path.extname(filePath).toLowerCase();

    let text = '';

    switch (ext) {
        case '.pdf':
            text = await extractPdfText(filePath);
            break;
        case '.docx':
            text = await extractDocxText(filePath);
            break;
        case '.txt':
        case '.md':
            text = await extractPlainText(filePath);
            break;
        default:
            throw new Error(`Unsupported file type: ${ext}`);
    }

    // Truncate to max length
    return text.substring(0, MAX_TEXT_LENGTH);
}

/**
 * Save uploaded file
 */
export async function saveUploadedFile(
    file: File
): Promise<{ fileId: string; filename: string; extractedText: string }> {
    await ensureUploadDir();

    const validation = validateFile(file.name, file.size);
    if (!validation.valid) {
        throw new Error(validation.error);
    }

    const fileId = uuidv4();
    const sanitized = sanitizeFilename(file.name);
    const filename = `${fileId}_${sanitized}`;
    const filePath = path.join(UPLOAD_DIR, filename);

    // Save file
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    await fs.writeFile(filePath, buffer);

    // Extract text
    const extractedText = await extractText(filePath);

    return {
        fileId,
        filename: sanitized,
        extractedText,
    };
}

/**
 * Get extracted text for file IDs
 */
export async function getFileTexts(fileIds: string[]): Promise<Map<string, { text: string; filename: string }>> {
    const fileTexts = new Map<string, { text: string; filename: string }>();

    const files = await fs.readdir(UPLOAD_DIR);

    for (const fileId of fileIds) {
        const matchingFile = files.find(f => f.startsWith(fileId));

        if (matchingFile) {
            const filePath = path.join(UPLOAD_DIR, matchingFile);
            try {
                const text = await extractText(filePath);
                // Extract original filename (remove uuid prefix)
                const parts = matchingFile.split('_');
                const originalFilename = parts.slice(1).join('_') || matchingFile;

                fileTexts.set(fileId, { text, filename: originalFilename });
            } catch (error) {
                console.error(`Error extracting text for ${fileId}:`, error);
            }
        }
    }

    return fileTexts;
}
