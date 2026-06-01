import db from './database';
import type { Message } from './types';

/**
 * Create a new conversation
 */
export function createConversation(id: string, title: string = 'New Chat') {
    const stmt = db.prepare(`
    INSERT INTO conversations (id, title, created_at, updated_at)
    VALUES (?, ?, ?, ?)
  `);

    const now = Date.now();
    stmt.run(id, title, now, now);

    return { id, title, created_at: now, updated_at: now };
}

/**
 * Get all conversations
 */
export function getAllConversations() {
    const stmt = db.prepare(`
    SELECT * FROM conversations 
    ORDER BY updated_at DESC
  `);

    return stmt.all();
}

/**
 * Get conversation by ID
 */
export function getConversation(id: string) {
    const stmt = db.prepare('SELECT * FROM conversations WHERE id = ?');
    return stmt.get(id);
}

/**
 * Update conversation title
 */
export function updateConversationTitle(id: string, title: string) {
    const stmt = db.prepare(`
    UPDATE conversations 
    SET title = ?, updated_at = ?
    WHERE id = ?
  `);

    stmt.run(title, Date.now(), id);
}

/**
 * Update conversation timestamp
 */
export function touchConversation(id: string) {
    const stmt = db.prepare(`
    UPDATE conversations 
    SET updated_at = ?
    WHERE id = ?
  `);

    stmt.run(Date.now(), id);
}

/**
 * Delete conversation and all messages
 */
export function deleteConversation(id: string) {
    const stmt = db.prepare('DELETE FROM conversations WHERE id = ?');
    stmt.run(id);
}

/**
 * Save message to conversation
 */
export function saveMessage(conversationId: string, message: Message) {
    const stmt = db.prepare(`
    INSERT INTO messages (conversation_id, role, content, timestamp)
    VALUES (?, ?, ?, ?)
  `);

    stmt.run(conversationId, message.role, message.content, message.timestamp);
    touchConversation(conversationId);
}

/**
 * Get all messages for a conversation
 */
export function getMessages(conversationId: string): Message[] {
    const stmt = db.prepare(`
    SELECT role, content, timestamp
    FROM messages
    WHERE conversation_id = ?
    ORDER BY timestamp ASC
  `);

    return stmt.all(conversationId) as Message[];
}

/**
 * Clear all messages from a conversation
 */
export function clearMessages(conversationId: string) {
    const stmt = db.prepare('DELETE FROM messages WHERE conversation_id = ?');
    stmt.run(conversationId);
    touchConversation(conversationId);
}

/**
 * Add file to conversation
 */
export function addFileToConversation(conversationId: string, fileId: string, filename: string) {
    // Check if exists
    const existing = db.prepare('SELECT 1 FROM conversation_files WHERE conversation_id = ? AND file_id = ?').get(conversationId, fileId);
    if (existing) return;

    const stmt = db.prepare('INSERT INTO conversation_files (conversation_id, file_id, filename, created_at) VALUES (?, ?, ?, ?)');
    stmt.run(conversationId, fileId, filename, Date.now());
    touchConversation(conversationId);
}

/**
 * Remove file from conversation
 */
export function removeFileFromConversation(conversationId: string, fileId: string) {
    const stmt = db.prepare('DELETE FROM conversation_files WHERE conversation_id = ? AND file_id = ?');
    stmt.run(conversationId, fileId);
    touchConversation(conversationId);
}

/**
 * Get files for a conversation
 */
export function getConversationFiles(conversationId: string): { fileId: string; filename: string }[] {
    const stmt = db.prepare('SELECT file_id as fileId, filename FROM conversation_files WHERE conversation_id = ? ORDER BY created_at ASC');
    return stmt.all(conversationId) as { fileId: string; filename: string }[];
}


/**
 * Generate conversation title from first message
 */
export function generateTitle(firstMessage: string): string {
    // Take first 50 chars and clean it up
    let title = firstMessage.substring(0, 50).trim();

    // Remove newlines
    title = title.replace(/\n/g, ' ');

    // Add ellipsis if truncated
    if (firstMessage.length > 50) {
        title += '...';
    }

    return title || 'New Chat';
}
