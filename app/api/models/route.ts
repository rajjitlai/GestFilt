import { NextResponse } from 'next/server';
import { GoogleGenerativeAI } from '@google/generative-ai';

export async function GET() {
    try {
        const apiKey = process.env.GEMINI_API_KEY;

        if (!apiKey) {
            // Return fallback models if no API key
            return NextResponse.json(getFallbackModels());
        }

        const genAI = new GoogleGenerativeAI(apiKey);

        // Fetch models using the fetch API directly since the SDK doesn't expose listModels
        const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models?key=${apiKey}`);

        if (!response.ok) {
            console.error('Failed to fetch models from API');
            return NextResponse.json(getFallbackModels());
        }

        const data = await response.json();

        // Filter and map models that support generateContent
        const generativeModels = data.models
            .filter((model: any) =>
                model.supportedGenerationMethods?.includes('generateContent')
            )
            .map((model: any) => ({
                name: model.name.replace('models/', ''),
                displayName: model.displayName || model.name.replace('models/', ''),
                description: model.description || 'No description available',
                maxInputTokens: model.inputTokenLimit || 0,
                maxOutputTokens: model.outputTokenLimit || 0,
            }));

        // Ensure Deep Research Pro Preview is in the list
        if (!generativeModels.some((m: any) => m.name === 'deep-research-pro-preview')) {
            generativeModels.unshift({
                name: 'deep-research-pro-preview',
                displayName: 'Deep Research Pro Preview',
                description: 'Advanced deep research capabilities for complex tasks',
                maxInputTokens: 2097152,
                maxOutputTokens: 8192,
            });
        }

        generativeModels.sort((a: any, b: any) => {
            // Sort to prioritize Deep Research Preview
            if (a.name === 'deep-research-pro-preview') return -1;
            if (b.name === 'deep-research-pro-preview') return 1;
            if (a.name === 'gemini-2.0-pro-exp-02-05') return -1;
            if (b.name === 'gemini-2.0-pro-exp-02-05') return 1;
            if (a.name.includes('2.0')) return -1;
            if (b.name.includes('2.0')) return 1;
            if (a.name.includes('1.5-pro')) return -1;
            if (b.name.includes('1.5-pro')) return 1;
            return a.name.localeCompare(b.name);
        });

        return NextResponse.json(generativeModels);

    } catch (error: any) {
        console.error('Error fetching models:', error);
        return NextResponse.json(getFallbackModels());
    }
}

function getFallbackModels() {
    // Fallback models if API fails
    return [
        {
            name: 'deep-research-pro-preview',
            displayName: 'Deep Research Pro Preview',
            description: 'Advanced deep research capabilities for complex tasks',
            maxInputTokens: 2097152,
            maxOutputTokens: 8192,
        },
        {
            name: 'gemini-2.0-pro-exp-02-05',
            displayName: 'Gemini 2.0 Pro (Experimental)',
            description: 'Advanced reasoning and multidisciplinary capabilities',
            maxInputTokens: 2097152,
            maxOutputTokens: 8192,
        },
        {
            name: 'gemini-2.0-flash-exp',
            displayName: 'Gemini 2.0 Flash (Experimental)',
            description: 'Latest experimental model with multimodal capabilities',
            maxInputTokens: 1048576,
            maxOutputTokens: 8192,
        },
        {
            name: 'gemini-1.5-pro',
            displayName: 'Gemini 1.5 Pro',
            description: 'Most capable model for complex reasoning tasks',
            maxInputTokens: 2097152,
            maxOutputTokens: 8192,
        },
        {
            name: 'gemini-1.5-flash',
            displayName: 'Gemini 1.5 Flash',
            description: 'Fast and efficient model for most tasks',
            maxInputTokens: 1048576,
            maxOutputTokens: 8192,
        },
        {
            name: 'gemini-1.5-flash-8b',
            displayName: 'Gemini 1.5 Flash-8B',
            description: 'Smaller, faster variant optimized for speed',
            maxInputTokens: 1048576,
            maxOutputTokens: 8192,
        },
    ];
}
