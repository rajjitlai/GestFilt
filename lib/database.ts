import Database from 'better-sqlite3';
import path from 'path';
import fs from 'fs';

const DB_PATH = path.join(process.cwd(), 'data', 'app.db');

// Ensure data directory exists
const dataDir = path.dirname(DB_PATH);
if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true });
}

// Initialize database
const db = new Database(DB_PATH);

// Enable foreign keys
db.pragma('foreign_keys = ON');

// Create tables
db.exec(`
  CREATE TABLE IF NOT EXISTS conversations (
    id TEXT PRIMARY KEY,
    title TEXT,
    created_at INTEGER NOT NULL,
    updated_at INTEGER NOT NULL
  );

  CREATE TABLE IF NOT EXISTS messages (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    conversation_id TEXT NOT NULL,
    role TEXT NOT NULL,
    content TEXT NOT NULL,
    timestamp INTEGER NOT NULL,
    FOREIGN KEY (conversation_id) REFERENCES conversations(id) ON DELETE CASCADE
  );

  CREATE TABLE IF NOT EXISTS session_memory (
    session_id TEXT PRIMARY KEY,
    goals TEXT,
    constraints TEXT,
    decisions TEXT,
    preferences TEXT,
    important_facts TEXT,
    updated_at INTEGER NOT NULL
  );

  CREATE INDEX IF NOT EXISTS idx_messages_conversation 
    ON messages(conversation_id, timestamp);
  
  CREATE INDEX IF NOT EXISTS idx_conversations_updated 
    ON conversations(updated_at DESC);

  CREATE TABLE IF NOT EXISTS conversation_files (
    conversation_id TEXT NOT NULL,
    file_id TEXT NOT NULL,
    filename TEXT NOT NULL,
    created_at INTEGER NOT NULL,
    FOREIGN KEY (conversation_id) REFERENCES conversations(id) ON DELETE CASCADE,
    PRIMARY KEY (conversation_id, file_id)
  );

  CREATE TABLE IF NOT EXISTS research_data (
    id TEXT PRIMARY KEY,
    conversation_id TEXT NOT NULL,
    query TEXT NOT NULL,
    data TEXT NOT NULL,
    created_at INTEGER NOT NULL,
    FOREIGN KEY (conversation_id) REFERENCES conversations(id) ON DELETE CASCADE
  );
`);

export default db;

// Helper types
export interface ConversationRow {
  id: string;
  title: string | null;
  created_at: number;
  updated_at: number;
}

export interface MessageRow {
  id: number;
  conversation_id: string;
  role: string;
  content: string;
  timestamp: number;
}

export interface SessionMemoryRow {
  session_id: string;
  goals: string;
  constraints: string;
  decisions: string;
  preferences: string;
  important_facts: string;
  updated_at: number;
}
