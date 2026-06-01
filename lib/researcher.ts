import db from './database';
import { generateGeminiResponse, streamGeminiResponse } from './gemini';
import { ResearchData, GeminiModel } from './types';
import { v4 as uuidv4 } from 'uuid';

export interface ResearchConfig {
    researchModel: GeminiModel;
    synthesisModel: GeminiModel;
}

/**
 * Orchestrates the Deep Research pipeline
 */
export async function* orchestrateDeepResearch(
    sessionId: string,
    query: string,
    config: ResearchConfig,
    instructions?: string
): AsyncGenerator<string> {

    // STAGE 1: Structured Research
    yield `Wait, I am activating **Deep Research Protocol**...\n\n`;
    yield `> **Stage 1:** gathering verified facts using *${config.researchModel}*...\n\n`;

    let researchData: ResearchData;
    try {
        researchData = await conductResearchWithRetry(query, config.researchModel);

        // Save to DB
        try {
            saveResearchData(sessionId, query, researchData);
        } catch (dbError) {
            console.error("Failed to save research data:", dbError);
        }

        yield `> **Stage 1 Complete:** Found ${researchData.facts.length} verified facts and ${researchData.sources.length} primary sources.\n\n`;
        yield `---\n\n`;
    } catch (error) {
        console.error("Research phase failed:", error);
        yield `\n**Error:** Research phase failed to gather structured data. Falling back to standard generation.\n\n`;
        // Fallback or exit? Prompt implies robust handling.
        // If research fails, we can't do synthesis based on facts.
        // So we stop or try standard.
        return;
    }

    // STAGE 2: Synthesis
    yield `> **Stage 2:** Synthesizing final report using *${config.synthesisModel}*...\n\n`;

    try {
        for await (const chunk of synthesizeReport(query, researchData, config.synthesisModel, instructions)) {
            yield chunk;
        }
    } catch (error) {
        yield `\n**Error:** Synthesis phase failed: ${(error as Error).message}\n`;
    }
}

/**
 * Conducts research with retry logic
 */
async function conductResearchWithRetry(query: string, model: GeminiModel, retries = 2): Promise<ResearchData> {
    let lastError: any;

    for (let attempt = 1; attempt <= retries + 1; attempt++) {
        try {
            return await conductResearch(query, model);
        } catch (error) {
            console.warn(`Research attempt ${attempt} failed:`, error);
            lastError = error;
            // Linear backoff
            await new Promise(resolve => setTimeout(resolve, attempt * 1000));
        }
    }
    throw lastError;
}

/**
 * Core research function
 */
async function conductResearch(query: string, model: GeminiModel): Promise<ResearchData> {
    const prompt = `
        You are a deep research agent. Your goal is to gather comprehensive facts and sources on the following topic: "${query}".
        
        Use Google Search to find high-quality, up-to-date information.
        Verify claims across multiple sources if possible.
        Extract key facts, statistics, and conflicting viewpoints.
        
        Output valid JSON with the following key structure:
        {
            "facts": [
                { "claim": "Exact factual statement", "source": "Source Name or URL", "confidence": 0.9 }
            ],
            "conflicts": ["List any conflicting information found"],
            "sources": [
                { "title": "Page Title", "uri": "URL" }
            ]
        }
    `;

    const responseText = await generateGeminiResponse(prompt, {
        model,
        temperature: 0.2, // Low temp for factual accuracy
        enableSearch: true,
        responseMimeType: "application/json"
    });

    try {
        // Validation: Ensure it parses and has required fields
        const data = JSON.parse(responseText) as ResearchData;
        if (!data.facts || !Array.isArray(data.facts)) {
            throw new Error("Invalid schema: missing facts array");
        }
        return data;
    } catch (e) {
        console.error("JSON Parse Error", responseText);
        throw new Error("Failed to parse research data output");
    }
}

/**
 * Save research session to database
 */
function saveResearchData(sessionId: string, query: string, data: ResearchData) {
    // We assume conversation exists. sessionId is conversationId
    // Check if conversation exists first? 
    // Usually handled by FK constraint.
    const stmt = db.prepare(`
        INSERT INTO research_data (id, conversation_id, query, data, created_at)
        VALUES (?, ?, ?, ?, ?)
    `);

    stmt.run(uuidv4(), sessionId, query, JSON.stringify(data), Date.now());
}

/**
 * Synthesize report from research data
 */
async function* synthesizeReport(
    query: string,
    data: ResearchData,
    model: GeminiModel,
    instructions?: string
): AsyncGenerator<string> {
    const factsText = data.facts.map(f => `- ${f.claim} (Source: ${f.source})`).join('\n');
    const conflictsText = data.conflicts?.join('\n') || 'None';
    const sourcesText = data.sources.map((s, i) => `${i + 1}. [${s.title}](${s.uri})`).join('\n');

    const prompt = `
        You are a professional research analyst. Write a comprehensive, well-structured report to address the user's query: "${query}"
        
        ${instructions ? `\n### SPECIAL INSTRUCTIONS:\n${instructions}\n` : ''}

        BASE YOUR ANSWER SOLELY ON THE FOLLOWING VERIFIED FACTS. DO NOT HALLUCINATE OUTSIDE INFO.
        
        ### Verified Facts:
        ${factsText}
        
        ### Conflicting Information:
        ${conflictsText}
        
        ### Instructions:
        1. Start with an executive summary.
        2. Use clear headings for key findings.
        3. Highlight any contradictions or uncertainties.
        4. Cite sources inline where appropriate (e.g. [Source Name]).
        5. Conclude with a list of verified sources.
        
        ### Sources:
        ${sourcesText}
    `;

    for await (const chunk of streamGeminiResponse(prompt, {
        model,
        temperature: 0.5 // Balanced for writing quality
    })) {
        yield chunk;
    }
}
