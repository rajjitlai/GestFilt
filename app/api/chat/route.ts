import { NextRequest } from 'next/server';
import { streamGeminiResponse } from '@/lib/gemini';
import { buildPrompt, getSkillsByIds } from '@/lib/skillEngine';
import {
    loadSessionMemory,
    saveSessionMemory,
    trimShortTermMemory,
    extractMemory,
    mergeMemory,
} from '@/lib/memory';
import { getFileTexts } from '@/lib/fileProcessor';
import { saveMessage, addFileToConversation } from '@/lib/chatHistory';
import type { ChatRequest, Message, GeminiModel } from '@/lib/types';
import { orchestrateDeepResearch } from '@/lib/researcher';

export async function POST(request: NextRequest) {
    const encoder = new TextEncoder();

    // Parse body immediately to determine mode
    const body: ChatRequest = await request.json();
    let { message, selectedSkills, model, attachedFileIds, sessionId, history, enableSearch } = body;

    // Check for Deep Research mode
    const isDeepResearch = model === 'deep-research-pro-preview';

    if (isDeepResearch) {
        const stream = new ReadableStream({
            async start(controller) {
                try {
                    // Save user message
                    const userMessage: Message = {
                        role: 'user',
                        content: message,
                        timestamp: Date.now(),
                    };
                    saveMessage(sessionId, userMessage);

                    // Also explicitly associate files with conversation? 
                    // Standard flow does it after loading texts.
                    // We should probably do it here too if we want research to know about files.
                    // But current researcher implementation only takes 'query'.
                    // It doesn't read files yet. 
                    // To keep it simple, we skip file association in deep research execution for now, 
                    // or we add it quickly.
                    if (attachedFileIds && attachedFileIds.length > 0) {
                        const documentTexts = await getFileTexts(attachedFileIds);
                        for (const [fileId, { filename }] of Array.from(documentTexts)) {
                            addFileToConversation(sessionId, fileId, filename);
                        }
                        // Appending files to query is a simple way to include them
                        // But for now, let's assume Deep Research is purely Web Research as per prompt.
                        // "Uses Gemini Deep Research ... for structured source collection"
                    }

                    // Configure models with sanitization to avoid restricted 'deep-research' model IDs
                    let rModel = (body.researchConfig?.researchModel || 'gemini-2.0-pro-exp-02-05') as GeminiModel;
                    let sModel = (body.researchConfig?.synthesisModel || 'gemini-1.5-pro') as GeminiModel;

                    // Force fallback if restricted model ID is detected
                    if (rModel.startsWith('deep-research')) rModel = 'gemini-2.0-pro-exp-02-05' as GeminiModel;
                    if (sModel.startsWith('deep-research')) sModel = 'gemini-1.5-pro' as GeminiModel;

                    const researchConfig = {
                        researchModel: rModel,
                        synthesisModel: sModel
                    };

                    let skillInstructions = '';
                    if (selectedSkills && selectedSkills.length > 0) {
                        try {
                            const skills = await getSkillsByIds(selectedSkills);
                            if (skills.length > 0) {
                                skillInstructions = skills.map(s =>
                                    `[SKILL: ${s.name}]\n${s.systemPrompt}\n${s.strictMode ? 'STRICT MODE ENABLED' : ''}`
                                ).join('\n\n');
                            }
                        } catch (err) {
                            console.error("Error loading skills:", err);
                        }
                    }

                    let fullResponse = '';

                    for await (const chunk of orchestrateDeepResearch(sessionId, message, researchConfig, skillInstructions)) {
                        fullResponse += chunk;
                        controller.enqueue(encoder.encode(`data: ${JSON.stringify({ chunk })}\n\n`));
                    }

                    // Save assistant message (the report)
                    const assistantMessage: Message = {
                        role: 'assistant',
                        content: fullResponse,
                        timestamp: Date.now(),
                    };
                    saveMessage(sessionId, assistantMessage);

                    controller.enqueue(encoder.encode('data: [DONE]\n\n'));
                    controller.close();
                } catch (error) {
                    console.error('Deep Research error:', error);
                    controller.enqueue(encoder.encode(`data: ${JSON.stringify({ error: (error as Error).message || 'Research failed' })}\n\n`));
                    controller.close();
                }
            }
        });

        return new Response(stream, {
            headers: {
                'Content-Type': 'text/event-stream',
                'Cache-Control': 'no-cache',
                'Connection': 'keep-alive',
            },
        });
    }

    // --- Standard Chat Flow ---

    const stream = new ReadableStream({
        async start(controller) {
            try {
                // Handle model mapping for standard flow (if deep research falls back, but usually handled above)
                // Also handle search enablement
                if (model === 'deep-research-pro-preview') {
                    model = 'gemini-2.0-pro-exp-02-05';
                    enableSearch = true;
                }

                // 1. Load session memory
                const sessionMemory = await loadSessionMemory(sessionId);

                // 2. Trim short-term history
                const shortTermHistory = trimShortTermMemory(history);

                // 3. Load document texts
                const documentTexts = await getFileTexts(attachedFileIds);

                // Save file associations
                for (const [fileId, { filename }] of Array.from(documentTexts)) {
                    addFileToConversation(sessionId, fileId, filename);
                }

                // 4. Build complete prompt
                const fullPrompt = await buildPrompt({
                    userMessage: message,
                    selectedSkillIds: selectedSkills,
                    sessionMemory,
                    shortTermHistory,
                    documentTexts,
                });

                // 5. Save user message to database
                const userMessage: Message = {
                    role: 'user',
                    content: message,
                    timestamp: Date.now(),
                };
                saveMessage(sessionId, userMessage);

                // 6. Stream Gemini response
                let fullResponse = '';

                for await (const chunk of streamGeminiResponse(fullPrompt, {
                    model: model as GeminiModel,
                    temperature: 0.7,
                    enableSearch: !!enableSearch,
                })) {
                    fullResponse += chunk;
                    controller.enqueue(encoder.encode(`data: ${JSON.stringify({ chunk })}\n\n`));
                }

                // 7. Save assistant message to database
                const assistantMessage: Message = {
                    role: 'assistant',
                    content: fullResponse,
                    timestamp: Date.now(),
                };
                saveMessage(sessionId, assistantMessage);

                // 8. Create complete message history for memory extraction
                const updatedHistory: Message[] = [
                    ...shortTermHistory,
                    userMessage,
                    assistantMessage,
                ];

                // 9. Extract and update memory (background operation, don't block response)
                extractMemory(updatedHistory, model as GeminiModel)
                    .then((extracted) => {
                        const mergedMemory = mergeMemory(sessionMemory, extracted);
                        return saveSessionMemory(sessionId, mergedMemory);
                    })
                    .catch((error) => {
                        console.error('Memory extraction error:', error);
                    });

                // 10. Send completion signal
                controller.enqueue(encoder.encode('data: [DONE]\n\n'));
                controller.close();
            } catch (error: any) {
                console.error('Chat API error:', error);
                controller.enqueue(
                    encoder.encode(
                        `data: ${JSON.stringify({ error: error.message || 'An error occurred' })}\n\n`
                    )
                );
                controller.close();
            }
        },
    });

    return new Response(stream, {
        headers: {
            'Content-Type': 'text/event-stream',
            'Cache-Control': 'no-cache',
            'Connection': 'keep-alive',
        },
    });
}
