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

        const getSnapshotTotal = (snapshot) => {
            if (!snapshot) return 0;
            return Object.entries(snapshot.balances).reduce((total, [accId, bal]) => {
                const acc = data.accounts.find(a => a.id === accId);
                let rate = 1;
                const currency = acc?.currency || 'BRL';
                if (acc && currency !== 'BRL') {
                    rate = snapshot.rates?.[currency] || 0;
                }
                return total + (bal * rate);
            }, 0);
        };

        let currentBalance = getSnapshotTotal(latestSnapshot);
        let currentDate = new Date(latestSnapshot.date);

        // Start projection from next month after snapshot? 
        // Or if snapshot is today, start from today. 
        // Let's iterate 12 months starting from the snapshot date.

        const dataPoints = [];

        // Initial Values
        const initialPrincipal = currentBalance;
        let runningBalance = currentBalance;
        let accumulatedSavings = 0;
        let accumulatedYield = 0;

        // Initial Point
        dataPoints.push({
            month: format(currentDate, 'MMM yy'),
            initialPrincipal: initialPrincipal,
            accumulatedSavings: 0,
            totalYield: 0,
            total: initialPrincipal
        });

        for (let i = 1; i <= 12; i++) {
            // Move to next month
            currentDate = addMonths(currentDate, 1);

            // Calculate Net Transactions for this month (Active Savings)
            const financials = getFinancialsForMonth(currentDate, data.recurringTransactions, data.transactions, data.fixedExpenses);

            const income = financials
                .filter(f => f.type === 'INCOME')
                .reduce((sum, item) => sum + (item.amount || 0), 0);

            const expense = financials
                .filter(f => f.type === 'EXPENSE')
                .reduce((sum, item) => sum + (item.amount || 0), 0);

            const netChange = income - expense;

            // Calculate Yield on the TOTAL existing balance (Compound Interest)
            // Yield applies to: Principal + Previous Savings + Previous Yield
            const yieldAmount = runningBalance * (yieldRate / 100);

            // Update Accumulators
            accumulatedSavings += netChange;
            accumulatedYield += yieldAmount;

            // Update Running Total
            runningBalance += netChange + yieldAmount;

            dataPoints.push({
                month: format(currentDate, 'MMM yy'),
                initialPrincipal: initialPrincipal,
                accumulatedSavings: accumulatedSavings,
                totalYield: accumulatedYield,
                total: runningBalance
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

            {/* Summary Cards */}
            {projectionData.length > 0 && (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="bg-white p-4 rounded-xl border border-gray-100 shadow-sm">
                        <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">Projected Wealth (1Y)</p>
                        <p className="text-2xl font-bold text-gray-900">
                            {formatCurrency(projectionData[projectionData.length - 1].total)}
                        </p>
                        <p className="text-xs text-gray-400 mt-1">
                            Current: {formatCurrency(projectionData[0].total)}
                        </p>
                    </div>
                    <div className="bg-white p-4 rounded-xl border border-gray-100 shadow-sm">
                        <p className="text-xs font-semibold text-emerald-600 uppercase tracking-wider mb-1">Passive Income (Yield)</p>
                        <p className="text-2xl font-bold text-emerald-600">
                            +{formatCurrency(projectionData[projectionData.length - 1].totalYield)}
                        </p>
                        <p className="text-xs text-gray-400 mt-1">
                            Estimated interest earned
                        </p>
                    </div>
                    <div className="bg-white p-4 rounded-xl border border-gray-100 shadow-sm">
                        <p className="text-xs font-semibold text-blue-600 uppercase tracking-wider mb-1">Active Savings</p>
                        <p className="text-2xl font-bold text-blue-600">
                            {formatCurrency(projectionData[projectionData.length - 1].accumulatedSavings)}
                        </p>
                        <p className="text-xs text-gray-400 mt-1">
                            From recurring contributions
                        </p>
                    </div>
                </div>
            )}

            {/* Main Projection Chart */}
            <WealthProjectionChart data={projectionData} />

            {/* Methodology / Explanation */}
            {projectionData.length > 0 && (
                <div className="bg-gray-50 rounded-xl p-6 border border-gray-100">
                    <h4 className="text-sm font-bold text-gray-900 uppercase tracking-wider mb-4">How is this calculated?</h4>
                    <div className="space-y-3 text-sm text-gray-600">
                        <p className="flex items-start gap-3">
                            <span className="bg-white px-2 py-1 rounded border border-gray-200 font-mono text-xs font-bold text-gray-700 whitespace-nowrap">Starting Point</span>
                            <span>
                                We start with your latest snapshot balance of <strong className="text-gray-900">{formatCurrency(projectionData[0].total)}</strong>.
                            </span>
                        </p>
                        <p className="flex items-start gap-3">
                            <span className="bg-blue-50 px-2 py-1 rounded border border-blue-100 font-mono text-xs font-bold text-blue-700 whitespace-nowrap">Active Savings</span>
                            <span>
                                Based on your recurring transactions, we assume you save approximately <strong className="text-blue-700">{formatCurrency(projectionData[projectionData.length - 1].accumulatedSavings / 12)}</strong> per month.
                                <br />
                                <span className="text-xs text-gray-400">(Total accumulated: {formatCurrency(projectionData[projectionData.length - 1].accumulatedSavings)})</span>
                            </span>
                        </p>
                        <p className="flex items-start gap-3">
                            <span className="bg-emerald-50 px-2 py-1 rounded border border-emerald-100 font-mono text-xs font-bold text-emerald-700 whitespace-nowrap">Compound Yield</span>
                            <span>
                                A monthly yield of <strong className="text-emerald-700">{yieldRate}%</strong> is applied to your <strong>entire balance</strong> (Principal + Savings) at the end of each month.
                            </span>
                        </p>
                    </div>
                </div>
            )}
        </div>
    );
}
