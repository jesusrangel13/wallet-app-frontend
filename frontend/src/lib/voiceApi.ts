import api from './api';
import { ApiResponse } from '@/types';

export interface ParsedVoiceTransaction {
    amount: number;
    currency: string;
    merchant: string | null;
    category: string | null;
    date: string; // ISO string
    confidence: number;
    originalText: string;
    resolvedCategoryId?: string;
    resolvedAccountId?: string;
    accountName?: string;
    resolvedTagIds?: string[];
    tags?: string[];
}

export const voiceAPI = {
    parse: (text: string) =>
        api.post<ApiResponse<ParsedVoiceTransaction>>('/voice/parse', { text }),
}
