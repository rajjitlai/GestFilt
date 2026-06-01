import { GoogleGenerativeAI } from '@google/generative-ai';
import type { GeminiModel } from './types';

// Initialize Gemini API
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '');

export interface GeminiConfig {
    model: GeminiModel;
    temperature?: number;
    maxOutputTokens?: number;
    enableSearch?: boolean;
    responseMimeType?: string;
}

/**
 * Generate streaming response from Gemini
 */
export async function* streamGeminiResponse(
    prompt: string,
    config: GeminiConfig
): AsyncGenerator<string> {
    const modelParams: any = {
        model: config.model,
    };

    if (config.enableSearch) {
        modelParams.tools = [{ googleSearch: {} }];
    }

    const model = genAI.getGenerativeModel(modelParams);

    const generationConfig: any = {
        temperature: config.temperature ?? 0.7,
        maxOutputTokens: config.maxOutputTokens ?? 8192,
    };

    if (config.responseMimeType) {
        generationConfig.responseMimeType = config.responseMimeType;
    }

    const result = await model.generateContentStream({
        contents: [{ role: 'user', parts: [{ text: prompt }] }],
        generationConfig,
    });

    let groundingMetadata: any;

    for await (const chunk of result.stream) {
        const chunkText = chunk.text();
        yield chunkText;

        // Capture metadata if present
        if (chunk.candidates?.[0]?.groundingMetadata) {
            groundingMetadata = chunk.candidates[0].groundingMetadata;
        }
    }

    // Append sources if available
    if (groundingMetadata?.groundingChunks) {
        const uniqueSources = new Map<string, string>(); // url -> title

        groundingMetadata.groundingChunks.forEach((chunk: any) => {
            if (chunk.web?.uri && chunk.web?.title) {
                uniqueSources.set(chunk.web.uri, chunk.web.title);
            }
        });

        if (uniqueSources.size > 0) {
            // Add extra space before sources section
            let sourcesText = '\n\n---\n**Sources:**\n';
            let index = 1;
            for (const [uri, title] of Array.from(uniqueSources.entries())) {
                sourcesText += `${index++}. [${title}](${uri})\n`;
            }
            yield sourcesText;
        }
    }
}

/**
 * Generate non-streaming response from Gemini (for memory extraction)
 */
export async function generateGeminiResponse(
    prompt: string,
    config: GeminiConfig
): Promise<string> {
    const modelParams: any = {
        model: config.model,
    };

    if (config.enableSearch) {
        modelParams.tools = [{ googleSearch: {} }];
    }

    const model = genAI.getGenerativeModel(modelParams);

    const generationConfig: any = {
        temperature: config.temperature ?? 0.7,
        maxOutputTokens: config.maxOutputTokens ?? 8192,
    };

    if (config.responseMimeType) {
        generationConfig.responseMimeType = config.responseMimeType;
    }

    const result = await model.generateContent({
        contents: [{ role: 'user', parts: [{ text: prompt }] }],
        generationConfig,
    });

    const response = await result.response;
    return response.text();
}

/**
 * Check if API key is configured
 */
export function isGeminiConfigured(): boolean {
    return !!process.env.GEMINI_API_KEY;
}
