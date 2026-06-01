'use client';

import { useState, useEffect } from 'react';
import type { GeminiModel } from '@/lib/types';

export interface Model {
    name: string;
    displayName: string;
    description: string;
}

interface ModelSelectorProps {
    selectedModel: GeminiModel;
    onModelChange: (model: GeminiModel) => void;
    label?: string;
    hideLabel?: boolean;
    className?: string;
    selectClassName?: string;
    filter?: (model: Model) => boolean;
}

export default function ModelSelector({
    selectedModel,
    onModelChange,
    label = "Model",
    hideLabel = false,
    className = "w-full",
    selectClassName = "w-full bg-white border border-gray-300 rounded px-2 py-1.5 text-xs text-gray-900 focus:outline-none focus:ring-1 focus:ring-blue-500 disabled:opacity-50",
    filter
}: ModelSelectorProps) {
    const [models, setModels] = useState<Model[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        loadModels();
    }, []);

    const loadModels = async () => {
        try {
            const response = await fetch('/api/models');
            const data = await response.json();
            setModels(data);
        } catch (error) {
            console.error('Error loading models:', error);
            setModels([
                { name: 'deep-research-pro-preview', displayName: 'Deep Research Pro Preview', description: 'Advanced deep research' },
                { name: 'gemini-1.5-pro', displayName: 'Gemini 1.5 Pro', description: 'Most capable' },
                { name: 'gemini-1.5-flash', displayName: 'Gemini 1.5 Flash', description: 'Fast and efficient' },
            ]);
        } finally {
            setLoading(false);
        }
    };

    const filteredModels = filter ? models.filter(filter) : models;

    return (
        <div className={className}>
            {!hideLabel && (
                <label className="block text-xs font-medium text-gray-600 mb-0.5">
                    {label}
                </label>
            )}
            <select
                value={selectedModel}
                onChange={(e) => onModelChange(e.target.value as GeminiModel)}
                disabled={loading}
                className={selectClassName}
            >
                {loading ? (
                    <option>Loading...</option>
                ) : (
                    filteredModels.map((model) => (
                        <option key={model.name} value={model.name} title={model.description}>
                            {model.displayName || model.name}
                        </option>
                    ))
                )}
            </select>
        </div>
    );
}
