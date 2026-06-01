// Core Types

export interface Message {
    role: 'user' | 'assistant';
    content: string;
    timestamp: number;
}

export interface Skill {
    id: string;
    name: string;
    description: string;
    systemPrompt: string;
    processSteps: string[];
    outputFormat: string;
    strictMode: boolean;
}

export interface UploadedFile {
    fileId: string;
    filename: string;
    extractedText: string;
    uploadTime: number;
}

export interface SessionMemory {
    goals: string[];
    constraints: string[];
    decisions: string[];
    preferences: string[];
    importantFacts: string[];
}

export interface ChatRequest {
    message: string;
    selectedSkills: string[];
    model: string;
    attachedFileIds: string[];
    sessionId: string;
    history: Message[];
    enableSearch?: boolean;
    researchConfig?: {
        researchModel: string;
        synthesisModel: string;
    };
}

export interface ResearchConfig {
    researchModel: string;
    synthesisModel: string;
}

export interface ChatResponse {
    response: string;
    sessionId: string;
}

export type GeminiModel = 'deep-research-pro-preview' | 'gemini-2.0-pro-exp-02-05' | 'gemini-2.0-flash-exp' | 'gemini-1.5-pro' | 'gemini-1.5-flash' | 'gemini-1.5-flash-8b';


export interface FileUploadResult {
    fileId: string;
    filename: string;
    extractedTextPreview: string;
}

export interface ResearchData {
    facts: { claim: string; source: string; confidence: number }[];
    conflicts: string[];
    sources: { title: string; uri: string }[];
}
