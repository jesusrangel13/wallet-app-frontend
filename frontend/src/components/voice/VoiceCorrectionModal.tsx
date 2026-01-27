"use client";

import { Modal } from '@/components/ui/Modal';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { ParsedVoiceTransaction } from '@/lib/voiceApi';
import React, { useState, useEffect } from 'react';
import { useTranslations } from 'next-intl';
import { toast } from 'sonner';
import { useAccounts } from '@/hooks/useAccounts';
import { useMergedCategories } from '@/hooks/useCategories';
import { useTags } from '@/hooks/useTags';
import { useGroups } from '@/hooks/useGroups';

// Simple Levenshtein distance for frontend matching
const levenshtein = (a: string, b: string): number => {
    const matrix = [];

    let i;
    for (i = 0; i <= b.length; i++) {
        matrix[i] = [i];
    }

    let j;
    for (j = 0; j <= a.length; j++) {
        matrix[0][j] = j;
    }

    for (i = 1; i <= b.length; i++) {
        for (j = 1; j <= a.length; j++) {
            if (b.charAt(i - 1) === a.charAt(j - 1)) {
                matrix[i][j] = matrix[i - 1][j - 1];
            } else {
                matrix[i][j] = Math.min(
                    matrix[i - 1][j - 1] + 1, // substitution
                    Math.min(
                        matrix[i][j - 1] + 1, // insertion
                        matrix[i - 1][j] + 1 // deletion
                    )
                );
            }
        }
    }

    return matrix[b.length][a.length];
};

// Flatten categories logic
const flattenCategories = (cats: any[], prefix = ''): any[] => {
    let result: any[] = [];
    cats.forEach(cat => {
        const displayName = prefix ? `${prefix} › ${cat.name}` : cat.name;
        result.push({ ...cat, displayName });

        if (cat.subcategories && cat.subcategories.length > 0) {
            result = [...result, ...flattenCategories(cat.subcategories, displayName)];
        }
    });
    return result;
};

interface VoiceCorrectionModalProps {
    isOpen: boolean;
    onClose: () => void;
    data: ParsedVoiceTransaction | null;
    onSave: (data: ParsedVoiceTransaction) => void;
}


export const VoiceCorrectionModal = ({ isOpen, onClose, data, onSave }: VoiceCorrectionModalProps) => {
    const t = useTranslations('voice');
    const [formData, setFormData] = useState<Partial<ParsedVoiceTransaction>>({});
    const [selectedTags, setSelectedTags] = useState<string[]>([]);
    const [tagSearch, setTagSearch] = useState("");

    const { data: accountsData } = useAccounts();
    const { categories: rawCategories } = useMergedCategories();
    const { data: tagsData } = useTags();
    const { data: groupsData } = useGroups(); // Fetch available groups
    // The hook already normalizes the response to Group[], so just cast it.
    // Fallback to empty array if something goes wrong.
    const groups = React.useMemo(() => Array.isArray(groupsData) ? groupsData : [], [groupsData]);

    const accounts = (accountsData as any)?.data?.data || (accountsData as any)?.data || [];



    const flatCategories = React.useMemo(() => flattenCategories(rawCategories || []), [rawCategories]);

    const tags = (tagsData as any)?.data?.data || (tagsData as any)?.data || tagsData || [];
    const filteredTags = tags.filter((t: any) => t.name.toLowerCase().includes(tagSearch.toLowerCase()));

    useEffect(() => {
        if (data) {
            let matchedGroupId = data.resolvedGroupId;
            let matchedGroupName = data.groupName;

            // If backend didn't resolve group but we have a name, try frontend matching
            if (!matchedGroupId && data.groupName && groups.length > 0) {
                const normalizedInput = data.groupName.toLowerCase().trim();
                let bestMatch = null;
                let minDistance = Infinity;

                for (const group of groups) {
                    const dist = levenshtein(normalizedInput, group.name.toLowerCase());
                    if (dist < minDistance) {
                        minDistance = dist;
                        bestMatch = group;
                    }
                }

                // Threshold logic (similar to backend)
                if (bestMatch) {
                    const maxLength = Math.max(normalizedInput.length, bestMatch.name.length);
                    const confidence = 1 - (minDistance / maxLength);
                    if (confidence > 0.4) {
                        matchedGroupId = bestMatch.id;
                        matchedGroupName = bestMatch.name; // Use official name
                    }
                }
            }

            setFormData({
                ...data,
                date: data.date ? new Date(data.date).toISOString().split('T')[0] : new Date().toISOString().split('T')[0],
                resolvedGroupId: matchedGroupId,
                groupName: matchedGroupName
            });
            setSelectedTags(data.resolvedTagIds || []);
        }
    }, [data, groups]);

    const handleChange = (field: keyof ParsedVoiceTransaction, value: any) => {
        setFormData(prev => ({ ...prev, [field]: value }));
    };

    const toggleTag = (tagId: string) => {
        setSelectedTags(prev =>
            prev.includes(tagId) ? prev.filter(id => id !== tagId) : [...prev, tagId]
        );
    };

    const handleSave = () => {
        if (formData.amount && (formData.merchant || formData.category)) {
            const submissionData = {
                ...formData,
                resolvedCategoryId: formData.resolvedCategoryId,
                resolvedAccountId: formData.resolvedAccountId,
                tagIds: selectedTags
            };

            onSave(submissionData as any);
            onClose();
        } else {
            toast.error(t('errors.requiredFields'));
        }
    };

    if (!data) return null;

    return (
        <Modal isOpen={isOpen} onClose={onClose} title={t('title')}>
            <div className="space-y-4 max-h-[80vh] overflow-y-auto pr-2">
                <div>
                    <label className="block text-sm font-medium mb-1 text-foreground">{t('originalText')}</label>
                    <p className="text-sm text-muted-foreground italic bg-muted/50 p-2 rounded">&quot;{data.originalText}&quot;</p>
                </div>

                {/* Date & Account */}
                <div className="grid grid-cols-2 gap-4">
                    <div>
                        <label className="block text-sm font-medium mb-1 text-foreground">{t('labels.date')}</label>
                        <Input
                            type="date"
                            value={(formData.date as string) || ''}
                            onChange={(e) => handleChange('date', e.target.value)}
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium mb-1 text-foreground">{t('labels.account')}</label>
                        <select
                            className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm text-foreground ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                            value={formData.resolvedAccountId || ''}
                            onChange={(e) => handleChange('resolvedAccountId', e.target.value)}
                        >
                            <option value="">{t('placeholders.selectAccount')}</option>
                            {accounts.map((acc: any) => (
                                <option key={acc.id} value={acc.id}>
                                    {acc.name}
                                </option>
                            ))}
                        </select>
                    </div>
                </div>

                {/* Amount & Currency */}
                <div className="grid grid-cols-2 gap-4">
                    <div>
                        <label className="block text-sm font-medium mb-1 text-foreground">{t('labels.amount')}</label>
                        <Input
                            type="number"
                            value={formData.amount || ''}
                            onChange={(e) => handleChange('amount', parseFloat(e.target.value))}
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium mb-1 text-foreground">{t('labels.currency')}</label>
                        <Input
                            value={formData.currency || ''}
                            onChange={(e) => handleChange('currency', e.target.value)}
                        />
                    </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                    <div>
                        <label className="block text-sm font-medium mb-1 text-foreground">{t('labels.merchant')}</label>
                        <Input
                            placeholder={t('placeholders.merchant')}
                            value={formData.merchant || ''}
                            onChange={(e) => handleChange('merchant', e.target.value)}
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium mb-1 text-foreground">{t('labels.description')}</label>
                        <Input
                            placeholder={t('placeholders.description')}
                            value={formData.description || ''}
                            onChange={(e) => handleChange('description', e.target.value)}
                        />
                    </div>
                </div>

                <div>
                    <label className="block text-sm font-medium mb-1 text-foreground">{t('labels.category')}</label>
                    <select
                        className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm text-foreground ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                        value={formData.resolvedCategoryId || ''}
                        onChange={(e) => {
                            handleChange('resolvedCategoryId', e.target.value);
                            const cat = flatCategories.find(c => c.id === e.target.value);
                            if (cat) handleChange('category', cat.name);
                        }}
                    >
                        <option value="">{t('placeholders.selectCategory')}</option>
                        {flatCategories.map((cat: any) => (
                            <option key={cat.id} value={cat.id}>
                                {cat.displayName}
                            </option>
                        ))}
                    </select>
                </div>

                {/* Group Selection Toggle */}
                <div className="mb-4">
                    <label className="flex items-center space-x-2 cursor-pointer">
                        <input
                            type="checkbox"
                            className="rounded border-input bg-background text-primary focus:ring-ring h-4 w-4"
                            checked={!!(formData.resolvedGroupId || formData.groupName)}
                            onChange={(e) => {
                                if (e.target.checked) {
                                    // Default to first group if available, or just show empty selector
                                    if (groups.length > 0) {
                                        const first = groups[0];
                                        handleChange('resolvedGroupId', first.id);
                                        handleChange('groupName', first.name);
                                    } else {
                                        handleChange('groupName', 'Manual Selection');
                                    }
                                } else {
                                    handleChange('resolvedGroupId', null);
                                }
                            }}
                        />
                        <span className="text-sm font-medium text-foreground">{t('groups.markAsShared')}</span>
                    </label>
                </div>

                {/* Group Selection (Visible if toggled or detected) */}
                {(formData.resolvedGroupId || formData.groupName) && (
                    <div className="bg-blue-500/10 p-4 rounded-md mb-4 border border-blue-500/20 animate-in fade-in slide-in-from-top-2 duration-200">
                        <label className="block text-sm font-medium mb-1 text-blue-700 dark:text-blue-300">
                            {t('labels.group')}
                            {data.groupName && !data.resolvedGroupId && <span className='ml-2 text-xs font-light text-blue-600 dark:text-blue-400'>({t('groups.aiSuggested', { name: data.groupName })})</span>}
                        </label>
                        <select
                            className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm text-foreground ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                            value={formData.resolvedGroupId || ''}
                            onChange={(e) => {
                                const newVal = e.target.value;
                                handleChange('resolvedGroupId', newVal);
                                if (!newVal) {
                                    handleChange('groupName', null); // Clear text if deselected
                                } else {
                                    const grp = groups?.find((g: any) => g.id === newVal);
                                    if (grp) handleChange('groupName', grp.name);
                                }
                            }}
                        >
                            <option value="">{t('groups.personalExpense')}</option>
                            {groups?.map((g: any) => (
                                <option key={g.id} value={g.id}>
                                    {g.name}
                                </option>
                            ))}
                        </select>
                    </div>
                )}

                {/* Tags with Search */}
                <div>
                    <label className="block text-sm font-medium mb-2 text-foreground">{t('labels.tags')}</label>
                    <Input
                        placeholder={t('placeholders.searchTags')}
                        value={tagSearch}
                        onChange={(e) => setTagSearch(e.target.value)}
                        className="mb-2 h-8 text-sm"
                    />
                    <div className="flex flex-wrap gap-2 max-h-32 overflow-y-auto p-1 border border-input rounded-lg bg-background/50">
                        {filteredTags.map((tag: any) => (
                            <button
                                key={tag.id}
                                type="button"
                                onClick={() => toggleTag(tag.id)}
                                className={`px-3 py-1 rounded-full text-xs font-medium transition-colors border ${selectedTags.includes(tag.id)
                                    ? 'bg-primary text-primary-foreground border-primary'
                                    : 'bg-background text-muted-foreground border-input hover:bg-muted'
                                    }`}
                            >
                                {tag.name}
                            </button>
                        ))}
                        {filteredTags.length === 0 && (
                            <p className="text-xs text-muted-foreground w-full text-center py-2">{t('tags.noTagsFound')}</p>
                        )}
                    </div>
                </div>

                <div className="mt-6 flex justify-end gap-2">
                    <Button variant="ghost" onClick={onClose}>{t('buttons.cancel')}</Button>
                    <Button onClick={handleSave}>{t('buttons.save')}</Button>
                </div>
            </div>
        </Modal>
    );
};
