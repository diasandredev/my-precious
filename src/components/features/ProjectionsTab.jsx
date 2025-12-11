import { useState, useMemo } from 'react';
import { format, addMonths } from 'date-fns';
import { TrendingUp } from 'lucide-react';
import { useData } from '../../contexts/DataContext';
import { Input, Label } from '../ui';
import { cn } from '../../lib/utils';
import { getFinancialsForMonth } from '../../lib/financialPeriodUtils';
import { WealthProjectionChart } from './WealthProjectionChart';

export function ProjectionsTab() {
    const { data, addSnapshot, formatCurrency } = useData();
    const [yieldRate, setYieldRate] = useState(1.16);

    // --- Projection Logic ---
    const projectionData = useMemo(() => {
        // 1. Find latest snapshot for starting point
        const sortedSnapshots = [...data.snapshots].sort((a, b) => new Date(b.date) - new Date(a.date));
        const latestSnapshot = sortedSnapshots[0];

        if (!latestSnapshot) return [];

        let currentBalance = Object.values(latestSnapshot.balances).reduce((a, b) => a + b, 0);
        let currentDate = new Date(latestSnapshot.date);

        // Start projection from next month after snapshot? 
        // Or if snapshot is today, start from today. 
        // Let's iterate 12 months starting from the snapshot date.

        const dataPoints = [];

        // Initial Point
        dataPoints.push({
            month: format(currentDate, 'MMM yy'),
            amount: currentBalance,
            net: 0,
            yield: 0
        });

        for (let i = 1; i <= 12; i++) {
            // Move to next month
            currentDate = addMonths(currentDate, 1);

            // Calculate Transactions for this month
            // We use getFinancialsForMonth to pull recurring items + one-time transactions
            // Note: Projections usually only care about Recurring Items (FixedItems) 
            // but if there are already registered future transactions, we should include them.
            const financials = getFinancialsForMonth(currentDate, data.fixedItems, data.transactions, data.fixedExpenses);

            const income = financials
                .filter(f => f.type === 'INCOME')
                .reduce((sum, item) => sum + (item.amount || 0), 0);

            const expense = financials
                .filter(f => f.type === 'EXPENSE')
                .reduce((sum, item) => sum + (item.amount || 0), 0);

            const netChange = income - expense;

            // Apply Yield (Compound Interest)
            // Assuming yield applies to the balance at START of month? Or end?
            // Simple model: Balance * Yield + NetChange
            const yieldAmount = currentBalance * (yieldRate / 100);

            currentBalance = currentBalance + yieldAmount + netChange;

            dataPoints.push({
                month: format(currentDate, 'MMM yy'),
                amount: currentBalance,
                net: netChange,
                yield: yieldAmount
            });
        }

        return dataPoints;

    }, [data.snapshots, data.fixedItems, data.transactions, data.fixedExpenses, yieldRate]);


    return (
        <div className="space-y-6 pb-12">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h2 className="text-3xl font-bold text-gray-900 tracking-tight flex items-center gap-2">
                        <TrendingUp className="h-8 w-8 text-primary" />
                        Financial Projections
                    </h2>
                    <p className="text-gray-500">Forecast your wealth based on recurring patterns</p>
                </div>

                <div className="flex items-center gap-4 bg-white p-2 rounded-xl border border-gray-100 shadow-sm">
                    <div className="flex items-center gap-2 px-2">
                        <Label htmlFor="yield" className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-0">Monthly Yield (%)</Label>
                        <div className="relative w-24">
                            <Input
                                id="yield"
                                type="number"
                                step="0.01"
                                value={yieldRate}
                                onChange={(e) => setYieldRate(parseFloat(e.target.value) || 0)}
                                className="h-8 text-right pr-6 font-bold text-emerald-600 border-gray-200"
                            />
                            <span className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 text-xs">%</span>
                        </div>
                    </div>
                </div>
            </div>

            {/* Main Projection Chart */}
            <WealthProjectionChart data={projectionData} />

        </div>
    );
}
