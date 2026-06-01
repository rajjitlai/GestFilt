import type { Message, SessionMemory } from './types';
import { generateGeminiResponse } from './gemini';
import db from './database';

const MAX_SHORT_TERM_MESSAGES = 15;
const MAX_SHORT_TERM_CHARS = 40000;

/**
 * Load session memory from database
 */
export async function loadSessionMemory(sessionId: string): Promise<SessionMemory> {
    const row = db.prepare('SELECT * FROM session_memory WHERE session_id = ?').get(sessionId) as any;

    if (!row) {
        return {
            goals: [],
            constraints: [],
            decisions: [],
            preferences: [],
            importantFacts: [],
        };
    }

    return {
        goals: JSON.parse(row.goals || '[]'),
        constraints: JSON.parse(row.constraints || '[]'),
        decisions: JSON.parse(row.decisions || '[]'),
        preferences: JSON.parse(row.preferences || '[]'),
        importantFacts: JSON.parse(row.important_facts || '[]'),
    };
}

/**
 * Save session memory to database
 */
export async function saveSessionMemory(sessionId: string, memory: SessionMemory) {
    const stmt = db.prepare(`
    INSERT OR REPLACE INTO session_memory 
    (session_id, goals, constraints, decisions, preferences, important_facts, updated_at)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `);

    stmt.run(
        sessionId,
        JSON.stringify(memory.goals),
        JSON.stringify(memory.constraints),
        JSON.stringify(memory.decisions),
        JSON.stringify(memory.preferences),
        JSON.stringify(memory.importantFacts),
        Date.now()
    );
}

/**
 * Trim short-term memory
 */
export function trimShortTermMemory(messages: Message[]): Message[] {
    // Keep last N messages
    let trimmed = messages.slice(-MAX_SHORT_TERM_MESSAGES);

    // Calculate total character count
    let totalChars = trimmed.reduce((sum, msg) => sum + msg.content.length, 0);

    // If still too large, trim from the beginning
    while (totalChars > MAX_SHORT_TERM_CHARS && trimmed.length > 5) {
        const removed = trimmed.shift();
        if (removed) {
            totalChars -= removed.content.length;
        }
    }

    return trimmed;
}

/**
 * Extract structured memory from conversation
 */
export async function extractMemory(
    messages: Message[],
    model: string
): Promise<Partial<SessionMemory>> {
    // Build conversation context
    const conversationText = messages
        .slice(-6) // Last 6 messages
        .map(m => `${m.role.toUpperCase()}: ${m.content}`)
        .join('\n\n');

    const extractionPrompt = `Extract structured long-term memory from this conversation.

CONVERSATION:
${conversationText}

Return STRICT JSON only with these fields (each should be an array of strings):
- goals: User's stated goals or objectives
- constraints: Limitations or requirements mentioned
- decisions: Decisions made or preferences stated
- preferences: User's preferences or style choices
- importantFacts: Key facts or information to remember

Return ONLY valid JSON. If a category has no items, use an empty array.

Example format:
{
  "goals": ["Build a web app", "Launch by Q2"],
  "constraints": ["Budget under $10k"],
  "decisions": ["Use React instead of Vue"],
  "preferences": ["Dark mode UI"],
  "importantFacts": ["User has 2 team members"]
}`;

    try {
        const response = await generateGeminiResponse(extractionPrompt, {
            model: model as any,
            temperature: 0.3,
        });

        // Extract JSON from response
        const jsonMatch = response.match(/\{[\s\S]*\}/);
        if (!jsonMatch) {
            return {};
        }

        const extracted = JSON.parse(jsonMatch[0]);
        return extracted;
    } catch (error) {
        console.error('Error extracting memory:', error);
        return {};
    }
}

/**
 * Merge extracted memory with existing session memory
 */
export function mergeMemory(
    existing: SessionMemory,
    extracted: Partial<SessionMemory>
): SessionMemory {
    const merged: SessionMemory = { ...existing };

    // Merge each category, avoiding duplicates
    for (const key of Object.keys(merged) as Array<keyof SessionMemory>) {
        if (extracted[key]) {
            const existingSet = new Set(merged[key]);
            for (const item of extracted[key]!) {
                if (item && item.trim()) {
                    existingSet.add(item);
                }
            }
            merged[key] = Array.from(existingSet);
        }
    }

    return merged;
}

/**
 * Format memory for prompt
 */
export function formatMemoryForPrompt(memory: SessionMemory): string {
    const sections: string[] = [];

    if (memory.goals.length > 0) {
        sections.push(`GOALS:\n${memory.goals.map(g => `- ${g}`).join('\n')}`);
    }

    if (memory.constraints.length > 0) {
        sections.push(`CONSTRAINTS:\n${memory.constraints.map(c => `- ${c}`).join('\n')}`);
    }

    if (memory.decisions.length > 0) {
        sections.push(`DECISIONS:\n${memory.decisions.map(d => `- ${d}`).join('\n')}`);
    }

    if (memory.preferences.length > 0) {
        sections.push(`PREFERENCES:\n${memory.preferences.map(p => `- ${p}`).join('\n')}`);
    }

    if (memory.importantFacts.length > 0) {
        sections.push(`IMPORTANT FACTS:\n${memory.importantFacts.map(f => `- ${f}`).join('\n')}`);
    }

    return sections.join('\n\n');
}
