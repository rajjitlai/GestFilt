'use client';

import { useState, useEffect } from 'react';
import type { Skill } from '@/lib/types';

interface SkillEditorProps {
    skill: Skill;
    onSave: (skill: Skill) => void;
    onCancel: () => void;
    onDelete?: (skillId: string) => void;
}

export default function SkillEditor({ skill, onSave, onCancel, onDelete }: SkillEditorProps) {
    const [formData, setFormData] = useState<Skill>(skill);
    const [newStep, setNewStep] = useState('');

    // Update form data when skill prop changes
    useEffect(() => {
        setFormData(skill);
    }, [skill]);

    const handleAddStep = () => {
        if (newStep.trim()) {
            setFormData({
                ...formData,
                processSteps: [...formData.processSteps, newStep.trim()],
            });
            setNewStep('');
        }
    };

    const handleRemoveStep = (index: number) => {
        setFormData({
            ...formData,
            processSteps: formData.processSteps.filter((_, i) => i !== index),
        });
    };

    return (
        <div className="bg-white border border-gray-200 rounded-lg p-6 shadow-sm">
            <h3 className="text-xl font-bold text-gray-900 mb-6 pb-2 border-b border-gray-100">
                {skill.id && !skill.id.startsWith('new_') ? 'Edit Skill' : 'Create New Skill'}
            </h3>

            <div className="space-y-5">
                <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-1.5">
                        Skill Name
                    </label>
                    <input
                        type="text"
                        value={formData.name}
                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                        placeholder="e.g. Code Reviewer"
                        className="w-full bg-white border border-gray-300 rounded-md px-3 py-2 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                </div>

                <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-1.5">
                        Description
                    </label>
                    <input
                        type="text"
                        value={formData.description}
                        onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                        placeholder="Briefly describe what this skill does..."
                        className="w-full bg-white border border-gray-300 rounded-md px-3 py-2 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                </div>

                <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-1.5">
                        System Prompt
                    </label>
                    <textarea
                        value={formData.systemPrompt}
                        onChange={(e) => setFormData({ ...formData, systemPrompt: e.target.value })}
                        rows={4}
                        placeholder="Instructions for the AI..."
                        className="w-full bg-white border border-gray-300 rounded-md px-3 py-2 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 resize-y"
                    />
                </div>

                <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-1.5">
                        Process Steps
                    </label>
                    <div className="space-y-2 mb-3">
                        {formData.processSteps.map((step, index) => (
                            <div key={index} className="flex items-center gap-2 group">
                                <span className="w-6 h-6 flex items-center justify-center bg-gray-100 text-gray-500 rounded-full text-xs font-medium">
                                    {index + 1}
                                </span>
                                <div className="flex-1 bg-gray-50 border border-gray-200 rounded px-3 py-2 text-sm text-gray-800">
                                    {step}
                                </div>
                                <button
                                    onClick={() => handleRemoveStep(index)}
                                    className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded transition-colors"
                                    title="Remove step"
                                >
                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                    </svg>
                                </button>
                            </div>
                        ))}
                        {formData.processSteps.length === 0 && (
                            <div className="text-sm text-gray-400 italic py-2">No steps defined yet.</div>
                        )}
                    </div>

                    <div className="flex gap-2">
                        <input
                            type="text"
                            value={newStep}
                            onChange={(e) => setNewStep(e.target.value)}
                            onKeyPress={(e) => e.key === 'Enter' && handleAddStep()}
                            placeholder="Add a new process step..."
                            className="flex-1 bg-white border border-gray-300 rounded-md px-3 py-2 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        />
                        <button
                            onClick={handleAddStep}
                            disabled={!newStep.trim()}
                            className="px-4 py-2 bg-gray-100 text-gray-700 text-sm font-medium rounded-md hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                        >
                            Add Step
                        </button>
                    </div>
                </div>

                <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-1.5">
                        Output Format
                    </label>
                    <textarea
                        value={formData.outputFormat}
                        onChange={(e) => setFormData({ ...formData, outputFormat: e.target.value })}
                        rows={3}
                        placeholder="Describe the expected output format..."
                        className="w-full bg-white border border-gray-300 rounded-md px-3 py-2 text-sm font-mono text-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 resize-y"
                    />
                </div>

                <div className="flex items-center">
                    <input
                        id="strictMode"
                        type="checkbox"
                        checked={formData.strictMode}
                        onChange={(e) => setFormData({ ...formData, strictMode: e.target.checked })}
                        className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                    />
                    <label htmlFor="strictMode" className="ml-2 block text-sm text-gray-700 cursor-pointer">
                        Strict Mode <span className="text-gray-500 font-normal">(Force AI to follow steps exactly)</span>
                    </label>
                </div>

                <div className="flex gap-3 pt-4 border-t border-gray-100 mt-6">
                    <button
                        onClick={() => onSave(formData)}
                        className="flex-1 px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-md hover:bg-blue-700 shadow-sm transition-colors"
                    >
                        Save Skill
                    </button>

                    {onDelete && skill.id && !skill.id.startsWith('new_') && (
                        <button
                            onClick={() => onDelete(skill.id)}
                            className="px-4 py-2 bg-white border border-red-200 text-red-600 text-sm font-medium rounded-md hover:bg-red-50 hover:border-red-300 transition-colors"
                        >
                            Delete
                        </button>
                    )}

                    <button
                        onClick={onCancel}
                        className="px-4 py-2 bg-white border border-gray-300 text-gray-700 text-sm font-medium rounded-md hover:bg-gray-50 hover:text-gray-900 transition-colors"
                    >
                        Cancel
                    </button>
                </div>
            </div>
        </div>
    );
}
