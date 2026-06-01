'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import SkillEditor from '@/components/SkillEditor';
import ModelSelector, { Model } from '@/components/ModelSelector';
import type { Skill, GeminiModel } from '@/lib/types';

export default function AdminPage() {
    const [skills, setSkills] = useState<Skill[]>([]);
    const [loading, setLoading] = useState(true);
    const [editingSkill, setEditingSkill] = useState<Skill | null>(null);
    const [showNewSkill, setShowNewSkill] = useState(false);

    useEffect(() => {
        loadSkills();
        const savedConfig = localStorage.getItem('deepResearchConfig');
        if (savedConfig) {
            setResearchConfig(JSON.parse(savedConfig));
        }
    }, []);

    const [researchConfig, setResearchConfig] = useState({
        researchModel: 'gemini-2.0-pro-exp-02-05',
        synthesisModel: 'gemini-1.5-pro'
    });

    const handleConfigChange = (key: string, value: string) => {
        const newConfig = { ...researchConfig, [key]: value };
        setResearchConfig(newConfig);
        localStorage.setItem('deepResearchConfig', JSON.stringify(newConfig));
    };

    const loadSkills = async () => {
        try {
            const response = await fetch('/api/skills');
            const data = await response.json();
            setSkills(data);
        } catch (error) {
            console.error('Error loading skills:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleSaveSkill = async (skill: Skill) => {
        try {
            if (skill.id && !skill.id.startsWith('new_')) {
                // Update existing skill
                const response = await fetch(`/api/skills/${skill.id}`, {
                    method: 'PUT',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(skill),
                });

                if (response.ok) {
                    await loadSkills();
                    setEditingSkill(null);
                }
            } else {
                // Create new skill
                const response = await fetch('/api/skills', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(skill),
                });

                if (response.ok) {
                    await loadSkills();
                    setShowNewSkill(false);
                }
            }
        } catch (error) {
            console.error('Error saving skill:', error);
        }
    };

    const handleDeleteSkill = async (skillId: string) => {
        if (!confirm('Are you sure you want to delete this skill?')) {
            return;
        }

        try {
            const response = await fetch(`/api/skills/${skillId}`, {
                method: 'DELETE',
            });

            if (response.ok) {
                await loadSkills();
                setEditingSkill(null);
            }
        } catch (error) {
            console.error('Error deleting skill:', error);
        }
    };

    const handleCreateNew = () => {
        setShowNewSkill(true);
        setEditingSkill(null);
    };

    const newSkillTemplate: Skill = {
        id: 'new_skill',
        name: '',
        description: '',
        systemPrompt: '',
        processSteps: [],
        outputFormat: '',
        strictMode: false,
    };

    return (
        <div className="min-h-screen bg-gray-50">
            <div className="container mx-auto px-4 py-6">
                {/* Header */}
                <div className="flex items-center justify-between mb-6">
                    <div>
                        <h1 className="text-2xl font-bold text-gray-900">Admin Panel</h1>
                        <p className="text-sm text-gray-600 mt-0.5">Manage Researcher Skills</p>
                    </div>
                    <Link
                        href="/"
                        className="px-3 py-2 bg-gray-200 text-gray-700 rounded text-sm hover:bg-gray-300 transition-colors"
                    >
                        ← Back to Chat
                    </Link>
                </div>

                {/* Research Configuration */}
                <div className="bg-white p-4 rounded-lg border border-gray-200 mb-6 shadow-sm">
                    <h2 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
                        <svg className="w-5 h-5 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19.428 15.428a2 2 0 00-1.022-.547l-2.384-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" />
                        </svg>
                        Deep Research Configuration
                    </h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                            <ModelSelector
                                selectedModel={researchConfig.researchModel as GeminiModel}
                                onModelChange={(model) => handleConfigChange('researchModel', model)}
                                label="Research Model (Extraction)"
                                className="w-full"
                                selectClassName="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500 text-sm bg-white"
                                filter={(m) => m.name !== 'deep-research-pro-preview'}
                            />
                            <p className="text-xs text-gray-500 mt-1">Model used for structured fact gathering and search.</p>
                        </div>
                        <div>
                            <ModelSelector
                                selectedModel={researchConfig.synthesisModel as GeminiModel}
                                onModelChange={(model) => handleConfigChange('synthesisModel', model)}
                                label="Synthesis Model (Reporting)"
                                className="w-full"
                                selectClassName="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500 text-sm bg-white"
                                filter={(m) => m.name !== 'deep-research-pro-preview'}
                            />
                            <p className="text-xs text-gray-500 mt-1">Model used for final report generation and fact checking.</p>
                        </div>
                    </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                    {/* Skills List */}
                    <div>
                        <div className="flex items-center justify-between mb-3">
                            <h2 className="text-lg font-bold text-gray-900">Skills ({skills.length})</h2>
                            <button
                                onClick={handleCreateNew}
                                className="px-3 py-1.5 bg-blue-500 text-white text-sm rounded hover:bg-blue-600 transition-colors"
                            >
                                + New Skill
                            </button>
                        </div>

                        {loading ? (
                            <div className="text-sm text-gray-500">Loading skills...</div>
                        ) : (
                            <div className="space-y-2">
                                {skills.map((skill) => (
                                    <div
                                        key={skill.id}
                                        onClick={() => {
                                            setEditingSkill(skill);
                                            setShowNewSkill(false);
                                        }}
                                        className={`bg-white border rounded-lg p-3 cursor-pointer hover:border-blue-400 transition-colors ${editingSkill?.id === skill.id ? 'border-blue-500 shadow-sm' : 'border-gray-200'
                                            }`}
                                    >
                                        <div className="font-semibold text-gray-900 text-sm mb-1">{skill.name}</div>
                                        <div className="text-xs text-gray-600 mb-2 line-clamp-2">{skill.description}</div>
                                        <div className="flex items-center gap-2 text-xs text-gray-500">
                                            <span>{skill.processSteps.length} steps</span>
                                            {skill.strictMode && (
                                                <span className="px-1.5 py-0.5 bg-orange-100 text-orange-700 rounded">
                                                    Strict
                                                </span>
                                            )}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>

                    {/* Skill Editor */}
                    <div>
                        <h2 className="text-lg font-bold text-gray-900 mb-3">
                            {showNewSkill ? 'Create New Skill' : editingSkill ? 'Edit Skill' : 'Select a Skill'}
                        </h2>

                        {showNewSkill ? (
                            <SkillEditor
                                skill={newSkillTemplate}
                                onSave={handleSaveSkill}
                                onCancel={() => setShowNewSkill(false)}
                            />
                        ) : editingSkill ? (
                            <SkillEditor
                                skill={editingSkill}
                                onSave={handleSaveSkill}
                                onCancel={() => setEditingSkill(null)}
                                onDelete={handleDeleteSkill}
                            />
                        ) : (
                            <div className="bg-white border border-gray-200 rounded-lg p-6 text-center text-sm text-gray-500">
                                Select a skill from the list to edit, or create a new one
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
