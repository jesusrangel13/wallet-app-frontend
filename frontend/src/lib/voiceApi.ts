import api from './api';
import { ApiResponse } from '@/types';

export interface ParsedVoiceTransaction {
    amount: number;
    currency: string;
    merchant: string | null;
    description?: string | null; // Added description
    category: string | null;
    date: string; // ISO string
    confidence: number;
    originalText: string;
    resolvedCategoryId?: string;
    resolvedAccountId?: string;
    accountName?: string;
    tags?: string[];
    resolvedTagIds?: string[];
    groupName?: string | null;
    resolvedGroupId?: string;
}

export const voiceAPI = {
    parse: (text: string) =>
        api.post<ApiResponse<ParsedVoiceTransaction>>('/voice/parse', { text }),
}
