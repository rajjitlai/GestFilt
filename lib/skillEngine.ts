import fs from 'fs/promises';
import path from 'path';
import type { Skill, Message, SessionMemory } from './types';
import { formatMemoryForPrompt } from './memory';

const SKILLS_FILE = path.join(process.cwd(), 'data', 'skills.json');

/**
 * Load all skills from JSON file
 */
export async function loadSkills(): Promise<Skill[]> {
    try {
        const data = await fs.readFile(SKILLS_FILE, 'utf-8');
        return JSON.parse(data);
    } catch (error) {
        console.error('Error loading skills:', error);
        return [];
    }
}

/**
 * Save skills to JSON file
 */
export async function saveSkills(skills: Skill[]): Promise<void> {
    await fs.writeFile(SKILLS_FILE, JSON.stringify(skills, null, 2));
}

/**
 * Get specific skills by IDs
 */
export async function getSkillsByIds(skillIds: string[]): Promise<Skill[]> {
    const allSkills = await loadSkills();
    return allSkills.filter(skill => skillIds.includes(skill.id));
}

/**
 * Build complete prompt from skills, memory, and context
 */
export async function buildPrompt(params: {
    userMessage: string;
    selectedSkillIds: string[];
    sessionMemory: SessionMemory;
    shortTermHistory: Message[];
    documentTexts: Map<string, { text: string; filename: string }>;
}): Promise<string> {
    const { userMessage, selectedSkillIds, sessionMemory, shortTermHistory, documentTexts } = params;

    const skills = await getSkillsByIds(selectedSkillIds);

    const sections: string[] = [];

    // System section
    sections.push('SYSTEM:\\nYou are a Researcher, an AI assistant designed to help users with deep research, analysis, and strategic decisions.');

    // Active skills section
    if (skills.length > 0) {
        const skillsList = skills
            .map(s => `- ${s.name}: ${s.description}`)
            .join('\n');
        sections.push(`ACTIVE SKILLS:\n${skillsList}`);
    }

    // Skill instructions
    if (skills.length > 0) {
        const instructions: string[] = [];

        for (const skill of skills) {
            instructions.push(`[${skill.name.toUpperCase()}]`);
            instructions.push(skill.systemPrompt);

            if (skill.processSteps.length > 0) {
                instructions.push('\nPROCESS STEPS:');
                skill.processSteps.forEach((step, idx) => {
                    instructions.push(`${idx + 1}. ${step}`);
                });
            }

            if (skill.outputFormat) {
                instructions.push(`\nOUTPUT FORMAT:\n${skill.outputFormat}`);
            }

            if (skill.strictMode) {
                instructions.push('\n⚠️ STRICT MODE: You MUST follow all steps sequentially and produce structured output.');
            }

            instructions.push('');
        }

        sections.push(`SKILL INSTRUCTIONS:\n${instructions.join('\n')}`);
    }

    // Session memory
    const memoryText = formatMemoryForPrompt(sessionMemory);
    if (memoryText) {
        sections.push(`SESSION MEMORY:\n${memoryText}`);
    }

    // Document context
    if (documentTexts.size > 0) {
        const docSections: string[] = [];
        let docIndex = 1;
        for (const [fileId, { text, filename }] of Array.from(documentTexts)) {
            docSections.push(`[DOCUMENT ${docIndex}: ${filename}]`); // Include filename
            docSections.push(text.substring(0, 15000)); // Increased limit slightly
            docSections.push('');
            docIndex++;
        }
        sections.push(`DOCUMENT CONTEXT:\n${docSections.join('\n')}`);
    }

    // Short-term memory (conversation history)
    if (shortTermHistory.length > 0) {
        const historyText = shortTermHistory
            .map(m => `${m.role.toUpperCase()}: ${m.content}`)
            .join('\n\n');
        sections.push(`SHORT TERM MEMORY (Recent conversation):\n${historyText}`);
    }

    // User message
    sections.push(`USER MESSAGE:\n${userMessage}`);

    return sections.join('\n\n---\n\n');
}

/**
 * Get single skill by ID
 */
export async function getSkillById(skillId: string): Promise<Skill | null> {
    const skills = await loadSkills();
    return skills.find(s => s.id === skillId) || null;
}

/**
 * Create new skill
 */
export async function createSkill(skill: Omit<Skill, 'id'>): Promise<Skill> {
    const skills = await loadSkills();
    const newSkill: Skill = {
        ...skill,
        id: `skill_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    };
    skills.push(newSkill);
    await saveSkills(skills);
    return newSkill;
}

/**
 * Update existing skill
 */
export async function updateSkill(skillId: string, updates: Partial<Skill>): Promise<Skill | null> {
    const skills = await loadSkills();
    const index = skills.findIndex(s => s.id === skillId);

    if (index === -1) {
        return null;
    }

    skills[index] = { ...skills[index], ...updates, id: skillId };
    await saveSkills(skills);
    return skills[index];
}

/**
 * Delete skill
 */
export async function deleteSkill(skillId: string): Promise<boolean> {
    const skills = await loadSkills();
    const filtered = skills.filter(s => s.id !== skillId);

    if (filtered.length === skills.length) {
        return false; // No skill was deleted
    }

    await saveSkills(filtered);
    return true;
}
