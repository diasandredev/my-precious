import React, { useMemo } from 'react';
import { Button } from '../ui/Button';
import { useDashboardData } from '../../hooks/useDashboardData';
import { analyzeTrends, aggregateMonthlyData, calculateMonthlyExpenses, DEFAULT_INSIGHTS_CONFIG } from '../../lib/insights';
import { getFinancialsForMonth } from '../../lib/financialPeriodUtils';
import { format } from 'date-fns';
import { HelpCircle, Lightbulb, ArrowUp, ArrowDown, Minus } from 'lucide-react';
import * as Tooltip from '@radix-ui/react-tooltip';

export function FinancialScore({ onViewInsights }) {
    const {
        netWorthStats,
        currentMonthMetrics,
        allocationData,
        assetsByCurrency,
        chartData, // Contains monthly data
        data,
        formatCurrency
    } = useDashboardData();

    // --- 1. Precise Trend Calculations ---

    // A. Cash Flow Trends (Income/Expense): Current Month vs Last Month
    const cashFlowTrends = useMemo(() => {
        // Find current month data in chartData
        const currentMonthIndex = chartData.findIndex(d => d.isCurrent);
        const current = chartData[currentMonthIndex] || { income: 0, expense: 0 };
        const previous = chartData[currentMonthIndex - 1] || { income: 0, expense: 0 };

        const incomeDiff = current.income - previous.income;
        const incomeTrend = previous.income !== 0 ? (incomeDiff / previous.income) * 100 : 0;

        const expenseDiff = current.expense - previous.expense;
        const expenseTrend = previous.expense !== 0 ? (expenseDiff / previous.expense) * 100 : 0;

        return {
            income: { value: current.income, trend: incomeTrend },
            expense: { value: current.expense, trend: expenseTrend }
        };
    }, [chartData]);


    // B. Balance Trends (Assets/Debts): Current Snapshot vs Penultimate Snapshot
    const balanceTrends = useMemo(() => {
        const sortedSnapshots = [...data.snapshots].sort((a, b) => new Date(b.date) - new Date(a.date));

        // Current is Latest (Index 0)
        const currentSnapshot = sortedSnapshots[0] || { balances: {} };
        // Penultimate is Index 1 (if exists)
        const penultimateSnapshot = sortedSnapshots[1] || { balances: {} };

        // Helper to calculate total value for a set of accounts from a snapshot
        const calculateTotal = (snapshot, filterFn) => {
            return Object.entries(snapshot.balances).reduce((total, [accId, bal]) => {
                const acc = data.accounts.find(a => a.id === accId);
                if (!acc) return total;

                // Filter
                if (!filterFn(acc, bal)) return total;

                let rate = 1;
                if (acc.currency !== 'BRL') {
                    rate = snapshot.rates?.[acc.currency] || 0;
                }
                return total + (bal * rate);
            }, 0);
        };

        // Definitions
        const isDebt = (acc, val) => val < 0; // Debt is strictly negative balance
        const isInvestment = (acc, val) => ['Investment', 'Crypto'].includes(acc.type) || ['BTC', 'ETH', 'BNB', 'XRP'].includes(acc.currency);
        // Savings = Strict: Bank Accounts in BRL
        const isSavings = (acc, val) => acc.type === 'Bank' && acc.currency === 'BRL' && val > 0;

        const currentDebt = Math.abs(calculateTotal(currentSnapshot, isDebt));
        const prevDebt = Math.abs(calculateTotal(penultimateSnapshot, isDebt));
        const debtTrend = prevDebt !== 0 ? ((currentDebt - prevDebt) / prevDebt) * 100 : 0;

        const currentInv = calculateTotal(currentSnapshot, isInvestment);
        const prevInv = calculateTotal(penultimateSnapshot, isInvestment);
        const invTrend = prevInv !== 0 ? ((currentInv - prevInv) / prevInv) * 100 : 0;

        const currentSavings = calculateTotal(currentSnapshot, isSavings);
        const prevSavings = calculateTotal(penultimateSnapshot, isSavings);
        const savingsTrend = prevSavings !== 0 ? ((currentSavings - prevSavings) / prevSavings) * 100 : 0;

        return {
            debt: { value: currentDebt, trend: debtTrend },
            investment: { value: currentInv, trend: invTrend },
            savings: { value: currentSavings, trend: savingsTrend }
        };
    }, [data.snapshots, data.accounts]);


    // --- 1.2 Helper: Standardized Monthly Stats for History ---
    const monthlyStats = useMemo(() => calculateMonthlyExpenses(data.transactions), [data.transactions]);

    // --- 1.3 Helper: Find Current Month Index ---
    const currentMonthIndex = useMemo(() => {
        const now = new Date();
        const currentMonthKey = format(now, 'yyyy-MM');
        return monthlyStats.findIndex(m => m.month === currentMonthKey);
    }, [monthlyStats]);

    // --- 2. Scoring Logic (0-100 each, Total 0-1000) ---
    const scores = useMemo(() => {

        const calculateScoreFromMetrics = (inc, exp, nw, debtBal, savBal, invBal) => {

            // Helper: Progressive Score Interpolation
            const getProgressiveScore = (val, tiers) => {
                // tiers = [{ upTo: 20, score: 85 }, { upTo: 60, score: 100 }]
                // implicit start: { upTo: 0, score: <base> } - handled by logic

                // We assume linear interpolation between tiers.
                // We need at least one tier.
                if (!tiers || tiers.length === 0) return 0;

                // Sort tiers by 'upTo' just in case
                // tiers.sort((a,b) => a.upTo - b.upTo);

                // Find the range [prev, next] that 'val' falls into
                let prev = { upTo: 0, score: 0 }; // Default baseline

                // Specific handling if val < 0? Assuming inputs standardized.
                // For "Penalty", we expect tiers to start from 0 upwards.

                for (let i = 0; i < tiers.length; i++) {
                    const tier = tiers[i];
                    if (val <= tier.upTo) {
                        // Found the bracket provided val > prev.upTo
                        // Interpolate
                        const range = tier.upTo - prev.upTo;
                        const scoreRange = tier.score - prev.score;
                        const progress = (val - prev.upTo) / range;
                        return prev.score + (progress * scoreRange);
                    }
                    prev = tier;
                }

                // If exceeded all tiers, return last score (Cap)
                return prev.score;
            };

            // 1. Spending Score (Savings Rate)
            // Metric: (Inc - Exp) / Inc
            // < 0%: Penalty (0-50).
            // 0% - 20%: 50 -> 85 (Good)
            // 20% - 90%: 85 -> 100 (Excellent)
            let spendingScore = 50;
            if (inc > 0) {
                const savingsRate = (inc - exp) / inc;
                if (savingsRate < 0) {
                    // Penalty Zone
                    spendingScore = Math.max(0, 50 + (savingsRate * 100)); // -50% SR => 0 Score
                } else {
                    spendingScore = getProgressiveScore(savingsRate * 100, [
                        { upTo: 20, score: 85 },
                        { upTo: 90, score: 100 }
                    ]);
                }
            } else if (exp === 0) {
                spendingScore = 60; // Neutral/Idle
            } else {
                spendingScore = 10; // All expense, no income
            }

            // 2. Investments Score (Inv / Net Worth)
            // Target: 40% (Score 85).
            // Max: 90% (Score 100).
            let investmentScore = 0;
            if (nw > 0) {
                const ratio = (invBal / nw) * 100;
                investmentScore = getProgressiveScore(ratio, [
                    { upTo: 40, score: 85 },
                    { upTo: 90, score: 100 }
                ]);
            }

            // 3. Debts Score (Debt / Monthly Income)
            // Metric: How many months of income to pay off debt?
            // 0: Score 100
            // 0.5 (2 weeks): Score 90
            // 3.0 (3 months): Score 60
            // 6.0: Score 0
            let debtScore = 100;
            const refIncome = Math.max(inc, 1000); // Avoid div/0
            if (debtBal > 0) {
                const monthsToPay = debtBal / refIncome;
                // Custom inverted interpolation logic or just map
                if (monthsToPay <= 0.5) {
                    // 0 -> 0.5 maps to 100 -> 90
                    debtScore = 100 - ((monthsToPay / 0.5) * 10);
                } else if (monthsToPay <= 3) {
                    // 0.5 -> 3.0 maps to 90 -> 60
                    // Range: 2.5. Score Range: 30.
                    debtScore = 90 - (((monthsToPay - 0.5) / 2.5) * 30);
                } else if (monthsToPay <= 12) {
                    // 3.0 -> 12.0 maps to 60 -> 0
                    debtScore = Math.max(0, 60 - (((monthsToPay - 3) / 9) * 60));
                } else {
                    debtScore = 0;
                }
            }

            // 4. Savings Score (Coverage / Runway)
            // Metric: Cash / AvgExp
            // 0 - 6 mo: 0 -> 85
            // 6 - 12 mo: 85 -> 100
            let savingsScore = 0;
            const avgExp = Math.max(1000, exp);
            const months = savBal / avgExp;

            savingsScore = getProgressiveScore(months, [
                { upTo: 6, score: 85 },
                { upTo: 12, score: 100 }
            ]);

            return {
                spending: Math.round(spendingScore),
                investments: Math.round(investmentScore),
                debts: Math.round(debtScore),
                savings: Math.round(savingsScore),
                total: Math.round((spendingScore + investmentScore + debtScore + savingsScore) * 2.5)
            };
        };

        // --- Current Score ---
        const current = calculateScoreFromMetrics(
            cashFlowTrends.income.value,
            cashFlowTrends.expense.value,
            netWorthStats?.currentTotal || 0,
            balanceTrends.debt.value,
            balanceTrends.savings.value,
            balanceTrends.investment.value
        );

        // --- Previous Score (Approximate) ---
        // 1. Get Previous Month Income/Expense from History
        const prevIndex = currentMonthIndex === -1 ? 0 : currentMonthIndex + 1;
        const prevMonth = monthlyStats[prevIndex];
        const prevInc = prevMonth?.incomeTotal || 0;
        const prevExp = prevMonth?.total || 0;

        // 2. Reverse Engineer Previous Balances using Trends
        // Trend = (Curr - Prev) / Prev  =>  Prev = Curr / (1 + Trend)
        // Note: trends are percentage (e.g. 10 for 10%)
        const getPrev = (curr, trend) => trend === 0 ? curr : curr / (1 + (trend / 100));

        const prevDebt = getPrev(balanceTrends.debt.value, balanceTrends.debt.trend);
        const prevSav = getPrev(balanceTrends.savings.value, balanceTrends.savings.trend);
        const prevInv = getPrev(balanceTrends.investment.value, balanceTrends.investment.trend);

        // 3. Approximate Previous Net Worth
        const prevNW = (netWorthStats?.currentTotal || 0) - (netWorthStats?.diff || 0);

        const prev = calculateScoreFromMetrics(prevInc, prevExp, prevNW, prevDebt, prevSav, prevInv);

        return {
            ...current,
            trend: current.total - prev.total
        };

    }, [cashFlowTrends, balanceTrends, netWorthStats, monthlyStats, currentMonthIndex]);


    // --- 3. Tips Integration (Insights) ---
    const tips = useMemo(() => {
        // 1. Use hoisted monthlyStats

        // Ensure current month exists in stats for comparison
        const now = new Date();
        const currentMonthKey = format(now, 'yyyy-MM');

        // Use hoisted currentMonthIndex

        // If current month isn't in historical stats (e.g. brand new month with no recorded expenses yet),
        // we essentially treat the "history" as starting from index 0 (last month).
        // However, analyzeTrends expects [Current, Previous, PrevPrev...]
        // So we need to ensure the list aligns if we are forcing "current" data.

        // Actually, easiest way is to trust calculateMonthlyExpenses for history
        // and currentMonthData (below) for the 'target'. 
        // analyzeTrends(currentMonthData, monthlyStats, index...)
        // If currentMonthIndex is -1, it means 'current' isn't in history array. 
        // That's fine, we just pass -1 as index? No, expected usage:
        // prevMonth = historyStats[currentIndex + 1];
        // If index is -1, prevMonth = historyStats[0], which is perfectly correct (Last Month).

        // 2. Prepare Current Month Data (Realized + Projected)
        const currentTransactions = getFinancialsForMonth(
            now,
            data.recurringTransactions,
            data.transactions,
            data.transactions,
            data.fixedExpenses || []
        );

        // Current Month Consolidated
        const currentMonthData = aggregateMonthlyData(currentTransactions, now);

        // Mark projections
        currentMonthData.isProjected = currentTransactions.some(t => t.status === 'PROJECTED');

        const insights = analyzeTrends(
            currentMonthData,
            monthlyStats,
            currentMonthIndex, // If -1, next is 0 (Latest History), which is correct.
            data.categories,
            formatCurrency,
            currentTransactions,
            data.recurringTransactions,
            // Merge config locally since we are not in the provider
            {
                ...DEFAULT_INSIGHTS_CONFIG,
                ...(data?.settings?.insights || {}),
                thresholds: {
                    ...DEFAULT_INSIGHTS_CONFIG.thresholds,
                    ...(data?.settings?.insights?.thresholds || {})
                }
            }
        );

        // Filter and Sort: 1 Alert, 1 Warning, 1 Good/Info
        const important = insights.filter(i => ['alert', 'warning'].includes(i.type));
        const positive = insights.filter(i => ['good', 'info'].includes(i.type));

        return [...important, ...positive];
    }, [chartData, cashFlowTrends, data.transactions, data.categories, formatCurrency]);


    // --- 4. Sub-Components ---

    const TrendIndicator = ({ value, type = 'neutral' }) => {
        const isPositive = value > 0;
        const isNegative = value < 0;
        const absValue = Math.abs(value).toFixed(1);
        let color = 'text-gray-400';
        let Icon = Minus;

        if (isPositive) {
            Icon = ArrowUp;
            color = type === 'inverse' ? 'text-red-500' : 'text-emerald-500';
        } else if (isNegative) {
            Icon = ArrowDown;
            color = type === 'inverse' ? 'text-emerald-500' : 'text-red-500';
        }

        if (value === 0) return <span className="text-xs text-gray-400 ml-auto">-</span>;

        return (
            <div className={`flex items-center gap-1 text-xs font-medium ${color} ml-auto`}>
                <Icon size={14} />
                <span>{absValue}%</span>
            </div>
        );
    };

    const TotalScoreRing = ({ score, trend }) => {
        const radius = 80;
        const circumference = 2 * Math.PI * radius;
        const offset = circumference - (score / 1000) * circumference;
        const color = score >= 800 ? "text-emerald-500" : score >= 600 ? "text-cyan-500" : "text-amber-500";

        return (
            <div className="relative flex flex-col items-center justify-center py-6">
                {/* SVG Ring */}
                <div className="relative w-56 h-56">
                    <svg className="w-full h-full transform -rotate-90" viewBox="0 0 200 200">
                        {/* Track */}
                        <circle cx="100" cy="100" r={radius} stroke="currentColor" strokeWidth="8" fill="transparent" className="text-gray-100 dark:text-gray-800" />
                        {/* Progress */}
                        <circle
                            cx="100" cy="100" r={radius}
                            stroke="currentColor" strokeWidth="8" fill="transparent"
                            strokeDasharray={circumference} strokeDashoffset={offset} strokeLinecap="round"
                            className={`${color} transition-all duration-1000 ease-out`}
                        />
                    </svg>

                    {/* Inner Content */}
                    <div className="absolute inset-0 flex flex-col items-center justify-center">
                        <span className="text-5xl font-bold text-gray-900 dark:text-gray-100 tracking-tight">
                            {score}
                        </span>
                        <div className="flex flex-col items-center mt-2">
                            <span className="text-[10px] font-semibold text-gray-400 uppercase tracking-widest">
                                / 1000
                            </span>

                            {/* Trend Indicator (MoM) */}
                            {trend !== 0 && (
                                <div className={`flex items-center gap-1 mt-1 text-xs font-bold ${trend > 0 ? 'text-emerald-500' : 'text-red-500'}`}>
                                    {trend > 0 ? <ArrowUp size={12} strokeWidth={3} /> : <ArrowDown size={12} strokeWidth={3} />}
                                    <span>{Math.abs(trend)} pts</span>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        );
    };

    const StatCard = ({ title, score, trend, accentColor, tooltipText }) => (
        <div className="flex flex-col h-full justify-center p-4">
            <div className="flex justify-between items-start mb-2">
                <div className="flex items-center gap-1.5">
                    <span className="text-xs font-semibold text-gray-400 uppercase tracking-wider">{title}</span>
                    {tooltipText && (
                        <Tooltip.Provider>
                            <Tooltip.Root>
                                <Tooltip.Trigger asChild>
                                    <HelpCircle className="w-3 h-3 text-gray-300 cursor-help hover:text-gray-500 transition-colors" />
                                </Tooltip.Trigger>
                                <Tooltip.Portal>
                                    <Tooltip.Content
                                        className="bg-gray-900 text-white text-xs rounded px-2 py-1 shadow-lg max-w-[200px] z-50 animate-in fade-in-0 zoom-in-95 data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=closed]:zoom-out-95 data-[side=bottom]:slide-in-from-top-2 data-[side=left]:slide-in-from-right-2 data-[side=right]:slide-in-from-left-2 data-[side=top]:slide-in-from-bottom-2"
                                        sideOffset={5}
                                    >
                                        {tooltipText}
                                        <Tooltip.Arrow className="fill-gray-900" />
                                    </Tooltip.Content>
                                </Tooltip.Portal>
                            </Tooltip.Root>
                        </Tooltip.Provider>
                    )}
                </div>
            </div>

            <div className="flex items-baseline gap-2 mb-3">
                <span className="text-3xl font-bold text-gray-900 dark:text-white">{score}</span>
                <span className="text-xs text-gray-400 font-medium">/ 100</span>
                <TrendIndicator value={trend} type={title.includes('Spending') || title.includes('Debt') ? 'inverse' : 'neutral'} />
            </div>

            {/* Minimal Progress Bar */}
            <div className="h-1 w-full bg-gray-100 dark:bg-gray-800 rounded-full overflow-hidden">
                <div className={`h-full ${accentColor} rounded-full transition-all duration-1000 ease-out`} style={{ width: `${score}%` }} />
            </div>
        </div>
    );

    return (
        <div className="bg-white p-6 shadow-none border border-transparent dark:bg-gray-800 relative">

            {/* Header */}
            <div className="flex items-center justify-between mb-2">
                <div>
                    <h3 className="text-lg font-bold text-gray-900 dark:text-white">Financial Score</h3>
                    <p className="text-xs text-gray-400">Current Month</p>
                </div>
                <div className="flex items-center gap-2">
                    <span className={`text-sm font-bold ${scores.total >= 800 ? "text-emerald-500" : scores.total >= 600 ? "text-cyan-500" : "text-amber-500"}`}>
                        {scores.total >= 800 ? "Excellent" : scores.total >= 600 ? "Very Good" : "Fair"}
                    </span>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-0">

                {/* LEFT COLUMN: Hero Score (4 Cols) */}
                <div className="lg:col-span-4 flex flex-col items-center justify-center border-r border-gray-50/50 dark:border-gray-700/50">
                    <TotalScoreRing score={scores.total} trend={scores.trend} />
                </div>

                {/* RIGHT COLUMN: Details Grid (8 Cols) */}
                <div className="lg:col-span-8 pl-0 lg:pl-8 flex flex-col justify-center">

                    {/* The Grid */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-12 gap-y-8">
                        <StatCard
                            title="Spending"
                            score={scores.spending}
                            trend={cashFlowTrends.expense.trend}
                            accentColor="bg-cyan-500"
                            tooltipText={`Income: ${formatCurrency(cashFlowTrends.income.value)} | Expenses: ${formatCurrency(cashFlowTrends.expense.value)}. Savings Rate: ${((cashFlowTrends.income.value - cashFlowTrends.expense.value) / cashFlowTrends.income.value * 100).toFixed(1)}% (Target > 20%).`}
                        />
                        <StatCard
                            title="Savings"
                            score={scores.savings}
                            trend={balanceTrends.savings.trend}
                            accentColor="bg-emerald-500"
                            tooltipText={`Liquid Cash: ${formatCurrency(balanceTrends.savings.value)} | Avg Exp: ${formatCurrency(Math.max(1000, cashFlowTrends.expense.value))}. Coverage: ${(balanceTrends.savings.value / Math.max(1000, cashFlowTrends.expense.value)).toFixed(1)} months (Target 6mo).`}
                        />
                        <StatCard
                            title="Debts"
                            score={scores.debts}
                            trend={balanceTrends.debt.trend}
                            accentColor="bg-red-500"
                            tooltipText={`Total Debt: ${formatCurrency(balanceTrends.debt.value)} | Monthly Income: ${formatCurrency(Math.max(cashFlowTrends.income.value, 1000))}. Ratio: ${(balanceTrends.debt.value / Math.max(cashFlowTrends.income.value, 1000)).toFixed(1)} months of income (Target < 0.5mo).`}
                        />
                        <StatCard
                            title="Investments"
                            score={scores.investments}
                            trend={balanceTrends.investment.trend}
                            accentColor="bg-purple-500"
                            tooltipText={`Invested: ${formatCurrency(balanceTrends.investment.value)} | Net Worth: ${formatCurrency(netWorthStats?.currentTotal || 0)}. Allocation: ${((balanceTrends.investment.value / (netWorthStats?.currentTotal || 1)) * 100).toFixed(1)}% (Target > 40%).`}
                        />
                    </div>

                    {/* Minimal Insights */}
                    {/* Insights Box */}
                    <div className="mt-8 bg-gray-50/80 dark:bg-gray-800/80 rounded-lg p-4 flex items-center justify-between border border-gray-100 dark:border-gray-700">
                        <div className="flex items-center gap-3">
                            <div className={`p-2 rounded-full ${tips.some(t => ['alert', 'warning'].includes(t.type)) ? 'bg-red-100 text-red-600' : 'bg-emerald-100 text-emerald-600'}`}>
                                <Lightbulb size={16} strokeWidth={2.5} />
                            </div>
                            <div className="flex flex-col">
                                <span className="text-xs font-bold text-gray-900 dark:text-white uppercase tracking-wider">
                                    Insights
                                </span>
                                <div className="flex flex-wrap items-center gap-2 mt-1">
                                    {tips.length > 0 ? (
                                        <>
                                            {tips.filter(t => t.type === 'alert').length > 0 && (
                                                <span className="text-[10px] font-bold text-red-600 bg-red-50 px-1.5 py-0.5 rounded border border-red-100/50">
                                                    {tips.filter(t => t.type === 'alert').length} Alerts
                                                </span>
                                            )}
                                            {tips.filter(t => t.type === 'warning').length > 0 && (
                                                <span className="text-[10px] font-bold text-amber-600 bg-amber-50 px-1.5 py-0.5 rounded border border-amber-100/50">
                                                    {tips.filter(t => t.type === 'warning').length} Warnings
                                                </span>
                                            )}
                                            {tips.filter(t => t.type === 'good').length > 0 && (
                                                <span className="text-[10px] font-bold text-emerald-600 bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-100/50">
                                                    {tips.filter(t => t.type === 'good').length} Positive
                                                </span>
                                            )}
                                            {tips.filter(t => t.type === 'info').length > 0 && (
                                                <span className="text-[10px] font-bold text-blue-600 bg-blue-50 px-1.5 py-0.5 rounded border border-blue-100/50">
                                                    {tips.filter(t => t.type === 'info').length} Observations
                                                </span>
                                            )}
                                        </>
                                    ) : (
                                        <span className="text-[10px] text-gray-500">Your finances are stable.</span>
                                    )}
                                </div>
                            </div>
                        </div>

                        <Button size="sm" variant="ghost" className="text-xs font-bold text-gray-900 hover:bg-white hover:shadow-sm whitespace-nowrap" onClick={onViewInsights}>
                            Full Analysis &rarr;
                        </Button>
                    </div>
                </div>
            </div>
        </div>
    );
}
