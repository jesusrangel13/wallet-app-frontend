"use client";

import { Modal } from '@/components/ui/Modal';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { ParsedVoiceTransaction } from '@/lib/voiceApi';
import React, { useState, useEffect } from 'react';
import { toast } from 'sonner';
import { useAccounts } from '@/hooks/useAccounts';
import { useMergedCategories } from '@/hooks/useCategories';
import { useTags } from '@/hooks/useTags';

interface VoiceCorrectionModalProps {
    isOpen: boolean;
    onClose: () => void;
    data: ParsedVoiceTransaction | null;
    onSave: (data: ParsedVoiceTransaction) => void;
}

export const VoiceCorrectionModal = ({ isOpen, onClose, data, onSave }: VoiceCorrectionModalProps) => {
    const [formData, setFormData] = useState<Partial<ParsedVoiceTransaction>>({});
    const [selectedTags, setSelectedTags] = useState<string[]>([]);
    const [tagSearch, setTagSearch] = useState("");

    const { data: accountsData } = useAccounts();
    const { categories: rawCategories } = useMergedCategories();
    const { data: tagsData } = useTags();

    const accounts = (accountsData as any)?.data?.data || (accountsData as any)?.data || [];

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

    const flatCategories = React.useMemo(() => flattenCategories(rawCategories || []), [rawCategories]);

    const tags = (tagsData as any)?.data?.data || (tagsData as any)?.data || tagsData || [];
    const filteredTags = tags.filter((t: any) => t.name.toLowerCase().includes(tagSearch.toLowerCase()));

    useEffect(() => {
        if (data) {
            setFormData({
                ...data,
                date: data.date ? new Date(data.date).toISOString().split('T')[0] : new Date().toISOString().split('T')[0]
            });
            setSelectedTags(data.resolvedTagIds || []);
        }
    }, [data]);

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
            toast.error("Please fill required fields (Amount and Merchant/Category)");
        }
    };

    if (!data) return null;

    return (
        <Modal isOpen={isOpen} onClose={onClose} title="Confirm Transaction">
            <div className="space-y-4 max-h-[80vh] overflow-y-auto pr-2">
                <div>
                    <label className="block text-sm font-medium mb-1">Original Text</label>
                    <p className="text-sm text-zinc-500 italic bg-zinc-50 p-2 rounded">&quot;{data.originalText}&quot;</p>
                </div>

                {/* Date & Account */}
                <div className="grid grid-cols-2 gap-4">
                    <div>
                        <label className="block text-sm font-medium mb-1">Date</label>
                        <Input
                            type="date"
                            value={formData.date as string}
                            onChange={(e) => handleChange('date', e.target.value)}
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium mb-1">Account</label>
                        <select
                            className="flex h-10 w-full rounded-md border border-zinc-200 bg-white px-3 py-2 text-sm ring-offset-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zinc-950 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                            value={formData.resolvedAccountId || ''}
                            onChange={(e) => handleChange('resolvedAccountId', e.target.value)}
                        >
                            <option value="">Select Account</option>
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
                        <label className="block text-sm font-medium mb-1">Amount</label>
                        <Input
                            type="number"
                            value={formData.amount || ''}
                            onChange={(e) => handleChange('amount', parseFloat(e.target.value))}
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium mb-1">Currency</label>
                        <Input
                            value={formData.currency || ''}
                            onChange={(e) => handleChange('currency', e.target.value)}
                        />
                    </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                    <div>
                        <label className="block text-sm font-medium mb-1">Merchant (Payee)</label>
                        <Input
                            placeholder="Where/Who?"
                            value={formData.merchant || ''}
                            onChange={(e) => handleChange('merchant', e.target.value)}
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium mb-1">Description (Item)</label>
                        <Input
                            placeholder="What?"
                            value={formData.description || ''}
                            onChange={(e) => handleChange('description', e.target.value)}
                        />
                    </div>
                </div>

                <div>
                    <label className="block text-sm font-medium mb-1">Category</label>
                    <select
                        className="flex h-10 w-full rounded-md border border-zinc-200 bg-white px-3 py-2 text-sm ring-offset-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zinc-950 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                        value={formData.resolvedCategoryId || ''}
                        onChange={(e) => {
                            handleChange('resolvedCategoryId', e.target.value);
                            const cat = flatCategories.find(c => c.id === e.target.value);
                            if (cat) handleChange('category', cat.name);
                        }}
                    >
                        <option value="">Select Category</option>
                        {flatCategories.map((cat: any) => (
                            <option key={cat.id} value={cat.id}>
                                {cat.displayName}
                            </option>
                        ))}
                    </select>
                </div>

                {/* Tags with Search */}
                <div>
                    <label className="block text-sm font-medium mb-2">Tags</label>
                    <Input
                        placeholder="Search tags..."
                        value={tagSearch}
                        onChange={(e) => setTagSearch(e.target.value)}
                        className="mb-2 h-8 text-sm"
                    />
                    <div className="flex flex-wrap gap-2 max-h-32 overflow-y-auto p-1 border rounded-md">
                        {filteredTags.map((tag: any) => (
                            <button
                                key={tag.id}
                                type="button"
                                onClick={() => toggleTag(tag.id)}
                                className={`px-3 py-1 rounded-full text-xs font-medium transition-colors border ${selectedTags.includes(tag.id)
                                    ? 'bg-zinc-900 text-white border-zinc-900'
                                    : 'bg-white text-zinc-600 border-zinc-200 hover:bg-zinc-100'
                                    }`}
                            >
                                {tag.name}
                            </button>
                        ))}
                        {filteredTags.length === 0 && (
                            <p className="text-xs text-zinc-400 w-full text-center py-2">No tags found</p>
                        )}
                    </div>
                </div>

                <div className="mt-6 flex justify-end gap-2">
                    <Button variant="ghost" onClick={onClose}>Cancel</Button>
                    <Button onClick={handleSave}>Save Transaction</Button>
                </div>
            </div>
        </Modal>
    );
};
