'use client';

import { useState, useEffect } from 'react';
import type { Skill } from '@/lib/types';

interface SkillGridProps {
    selectedSkills: string[];
    onSkillsChange: (skillIds: string[]) => void;
}

export default function SkillGrid({ selectedSkills, onSkillsChange }: SkillGridProps) {
    const [skills, setSkills] = useState<Skill[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        loadSkills();
    }, []);

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

    const toggleSkill = (skillId: string) => {
        if (selectedSkills.includes(skillId)) {
            onSkillsChange(selectedSkills.filter((id) => id !== skillId));
        } else {
            onSkillsChange([...selectedSkills, skillId]);
        }
    };

    if (loading) {
        return (
            <div className="text-center py-6 text-sm text-gray-500">
                Loading skills...
            </div>
        );
    }

    return (
        <div>
            <div className="mb-3">
                <h2 className="text-base font-bold text-gray-800">
                    Select Skills ({selectedSkills.length}/12)
                </h2>
                <p className="text-xs text-gray-600 mt-0.5">
                    Choose one or more skills to guide the AI's analysis
                </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-2">
                {skills.map((skill) => {
                    const isSelected = selectedSkills.includes(skill.id);

                    return (
                        <button
                            key={skill.id}
                            onClick={() => toggleSkill(skill.id)}
                            className={`p-2.5 rounded border text-left transition-all hover:scale-[1.02] ${isSelected
                                    ? 'border-blue-400 bg-blue-50 shadow-sm'
                                    : 'border-gray-200 bg-white hover:border-blue-300'
                                }`}
                        >
                            <div className="flex items-start justify-between mb-1">
                                <div className="flex-1">
                                    <h3 className={`font-semibold text-xs mb-0.5 ${isSelected ? 'text-blue-700' : 'text-gray-800'
                                        }`}>
                                        {skill.name}
                                    </h3>
                                </div>
                                <div className={`ml-1.5 w-4 h-4 rounded-full border flex items-center justify-center flex-shrink-0 ${isSelected
                                        ? 'border-blue-500 bg-blue-500'
                                        : 'border-gray-300'
                                    }`}>
                                    {isSelected && (
                                        <svg className="w-2.5 h-2.5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                                        </svg>
                                    )}
                                </div>
                            </div>

                            <p className={`text-xs leading-snug ${isSelected ? 'text-blue-600' : 'text-gray-600'
                                }`}>
                                {skill.description}
                            </p>

                            {skill.strictMode && (
                                <div className="mt-1.5">
                                    <span className="inline-block px-1.5 py-0.5 bg-orange-100 text-orange-700 text-xs rounded">
                                        Strict
                                    </span>
                                </div>
                            )}
                        </button>
                    );
                })}
            </div>
        </div>
    );
}
