'use client';

import { useState, useEffect } from 'react';
import type { Skill } from '@/lib/types';

interface SkillSelectorProps {
    selectedSkills: string[];
    onSkillsChange: (skillIds: string[]) => void;
}

export default function SkillSelector({ selectedSkills, onSkillsChange }: SkillSelectorProps) {
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
            onSkillsChange(selectedSkills.filter(id => id !== skillId));
        } else {
            onSkillsChange([...selectedSkills, skillId]);
        }
    };

    if (loading) {
        return (
            <div className="mb-6">
                <div className="text-sm text-gray-400">Loading skills...</div>
            </div>
        );
    }

    return (
        <div className="mb-6">
            <label className="block text-sm font-medium text-gray-300 mb-2">
                Active Skills ({selectedSkills.length})
            </label>
            <div className="max-h-96 overflow-y-auto bg-gray-800 border border-gray-700 rounded-lg p-3">
                {skills.map((skill) => (
                    <div key={skill.id} className="mb-2">
                        <label className="flex items-start cursor-pointer group">
                            <input
                                type="checkbox"
                                checked={selectedSkills.includes(skill.id)}
                                onChange={() => toggleSkill(skill.id)}
                                className="mt-1 mr-3 h-4 w-4 rounded border-gray-600 bg-gray-700 text-blue-500 focus:ring-2 focus:ring-blue-500"
                            />
                            <div className="flex-1">
                                <div className="text-sm font-medium text-white group-hover:text-blue-400">
                                    {skill.name}
                                </div>
                                <div className="text-xs text-gray-400 mt-0.5">
                                    {skill.description}
                                </div>
                            </div>
                        </label>
                    </div>
                ))}
            </div>
        </div>
    );
}
