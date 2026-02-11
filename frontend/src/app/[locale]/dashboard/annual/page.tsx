import { AnnualView } from '@/components/dashboard/annual/AnnualView';
import { Metadata } from 'next';

export const metadata: Metadata = {
    title: 'Vista Anual | FinanceApp',
    description: 'Resumen financiero anual',
};

export default function AnnualPage() {
    return (
        <div className="flex-1 space-y-4 p-4 md:p-8 pt-4 md:pt-6">
            <AnnualView />
        </div>
    );
}
