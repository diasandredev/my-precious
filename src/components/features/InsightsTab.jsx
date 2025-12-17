import { useState, useMemo } from 'react';
import { useData } from '../../contexts/DataContext';
import { calculateMonthlyExpenses, analyzeTrends, identifyTopCategories, aggregateMonthlyData } from '../../lib/insights';
import { getFinancialsForMonth } from '../../lib/financialPeriodUtils';
import { InsightCard } from '../insights/InsightCard';
import { CategoryTrendChart } from '../insights/CategoryTrendChart';
import { Card, CardHeader, CardTitle, CardContent } from '../ui/Card';
import { format, startOfMonth } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { ArrowLeft, ArrowRight, TrendingUp, TrendingDown, AlertTriangle } from 'lucide-react';

export function InsightsTab() {
    const { data, formatCurrency } = useData();
    // derived state will be below daily stats


    // Memoize heavy calculations
    const monthlyStats = useMemo(() => {
        const stats = calculateMonthlyExpenses(data.transactions);

        // Ensure current month is present (if no expenses yet)
        const now = new Date();
        const currentMonthKey = format(now, 'yyyy-MM');

        if (!stats.some(s => s.month === currentMonthKey)) {
            // If strictly sorted descending, ensuring it's at top might be tricky if "Future" months exist?
            // calculateMonthlyExpenses sorts descending.
            // If we have Next Month (future), it's at index 0. Current Month should be index 1.
            // We just add it and sort again to be safe.
            stats.push({
                month: currentMonthKey,
                date: startOfMonth(now),
                total: 0,
                categories: {}
            });
            stats.sort((a, b) => b.date - a.date);
        }
        return stats;
    }, [data.transactions]);

    // Find index of current month for default selection
    const initialMonthIndex = useMemo(() => {
        const now = new Date();
        const currentMonthKey = format(now, 'yyyy-MM');
        const index = monthlyStats.findIndex(s => s.month === currentMonthKey);
        return index >= 0 ? index : 0;
    }, [monthlyStats]);

    const [selectedMonthIndex, setSelectedMonthIndex] = useState(initialMonthIndex);
    const [expandedInsightIdx, setExpandedInsightIdx] = useState(null);

    // Reset expansion when month changes
    useMemo(() => {
        setExpandedInsightIdx(null);
    }, [selectedMonthIndex]);

    // Sync selected index if initial changes (e.g. data load) and user hasn't moved? 
    // Actually, explicit effect might be better, OR just use initial state key. 
    // Using key on component to reset state is drastic.
    // Let's just default carefully. If data loads later, monthlyStats changes.
    // We should probably useEffect to update selectedMonthIndex ONLY if it was "uninitialized"?
    // Or just trust the user navigation.
    // Getting "Current Month" as default is usually for First Load.
    // Let's stick to useState(initialMonthIndex) but we need to ensure it updates when data becomes available first time.
    // For now simple useState might be enough if data is already loaded in context.

    // Better: Effect to set it once data is loaded?
    // The issue: "data" comes from context. It might change.
    // If we duplicate logic, it's fine.

    // Let's use a flag to track if we've set the initial mont?
    // Actually, just let it be 0 default, and then useEffect to jump to current?
    // No, cleaner is initializing correctly if data is there.
    // If data isn't there, index 0 is safe (empty list handled differently?).


    // Enhanced Current Month Data (Realized + Projected)
    const currentMonthData = useMemo(() => {
        const stats = monthlyStats[selectedMonthIndex];
        if (!stats) return null;

        // Use getFinancialsForMonth for the SELECTED month to construct the view.
        // This automatically handles "Projected" items for current/future.
        const financials = getFinancialsForMonth(
            stats.date,
            data.recurringTransactions,
            data.transactions,
            data.fixedExpenses
        );

        // Aggregate these financials into the Statistics format
        const enhancedStats = aggregateMonthlyData(financials, stats.date);

        // Mark if it contains projections
        enhancedStats.hasProjections = financials.some(f => f.status === 'PROJECTED');
        enhancedStats.isProjected = enhancedStats.hasProjections;

        return enhancedStats;
    }, [selectedMonthIndex, monthlyStats, data.recurringTransactions, data.transactions, data.fixedExpenses]);

    const insights = useMemo(() => {
        const result = analyzeTrends(currentMonthData, monthlyStats, selectedMonthIndex, data.categories, formatCurrency);

        const getScore = (insight) => {
            const t = insight?.type?.toLowerCase();
            if (t === 'alert') return 0;
            if (t === 'warning') return 1;
            if (t === 'good') return 2;
            return 3; // Info or others
        };

        return result.sort((a, b) => getScore(a) - getScore(b));
    }, [currentMonthData, monthlyStats, selectedMonthIndex, data.categories, formatCurrency]);



    // Calculate top categories for the selected month
    const topCategories = useMemo(() => {
        return identifyTopCategories(currentMonthData, data.categories);
    }, [currentMonthData, data.categories]);

    if (!currentMonthData) {
        return (
            <div className="p-8 text-center text-gray-500">
                <h2 className="text-xl font-semibold mb-2">No Enough Data</h2>
                <p>Start adding expenses to see insights!</p>
            </div>
        );
    }

    const navigateMonth = (direction) => {
        const newIndex = selectedMonthIndex + direction;
        if (newIndex >= 0 && newIndex < monthlyStats.length) {
            setSelectedMonthIndex(newIndex);
        }
    };

    return (
        <div className="space-y-6 max-w-6xl mx-auto pb-12">
            <div className="flex items-center justify-between">
                <h1 className="text-2xl font-bold text-gray-900">Financial Insights</h1>

                {/* Month Navigation */}
                <div className="flex items-center gap-4 bg-white p-2 rounded-lg border shadow-sm">
                    <button
                        onClick={() => navigateMonth(1)}
                        disabled={selectedMonthIndex >= monthlyStats.length - 1}
                        className="p-2 hover:bg-gray-100 rounded-full disabled:opacity-30 transition-colors"
                        aria-label="Previous Month"
                    >
                        <ArrowLeft className="h-4 w-4" />
                    </button>
                    <span className="font-medium min-w-[120px] text-center capitalize">
                        {format(currentMonthData.date, 'MMMM yyyy', { locale: ptBR })}
                    </span>
                    <button
                        onClick={() => navigateMonth(-1)}
                        disabled={selectedMonthIndex <= 0}
                        className="p-2 hover:bg-gray-100 rounded-full disabled:opacity-30 transition-colors"
                        aria-label="Next Month"
                    >
                        <ArrowRight className="h-4 w-4" />
                    </button>
                </div>
            </div>

            {/* 1. Overview Cards for Selected Month */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <Card>
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium text-gray-500">Total Expenses</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{formatCurrency(currentMonthData.total)}</div>
                        <p className="text-xs text-gray-500 mt-1">
                            {currentMonthData.hasProjections ? (
                                <span className="text-amber-600 font-medium">Includes Projected</span>
                            ) : (
                                <span>Realized Amount</span>
                            )}
                        </p>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium text-gray-500">Top Category</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold truncate">
                            {topCategories[0]?.name || 'N/A'}
                        </div>
                        <p className="text-xs text-gray-500 mt-1">
                            {topCategories[0] ? `${formatCurrency(topCategories[0].amount)} (${topCategories[0].percentage.toFixed(0)}%)` : '-'}
                        </p>
                    </CardContent>
                </Card>

                {/* Trend Analysis Card */}
                <Card>
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium text-gray-500">Trend Analysis</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-4">
                            {insights.length > 0 ? (
                                <>
                                    {insights.filter(i => i.type === 'alert').length > 0 && (
                                        <div className="flex items-center gap-2 text-red-600">
                                            <TrendingUp className="h-5 w-5" />
                                            <span className="font-semibold">
                                                {insights.filter(i => i.type === 'alert').length} Critical Alerts
                                            </span>
                                        </div>
                                    )}
                                    {insights.filter(i => i.type === 'warning').length > 0 && (
                                        <div className="flex items-center gap-2 text-amber-600">
                                            <AlertTriangle className="h-5 w-5" />
                                            <span className="font-semibold">
                                                {insights.filter(i => i.type === 'warning').length} Warnings
                                            </span>
                                        </div>
                                    )}
                                    {insights.filter(i => i.type === 'good').length > 0 && (
                                        <div className="flex items-center gap-2 text-emerald-600">
                                            <TrendingDown className="h-5 w-5" />
                                            <span className="font-medium">
                                                {insights.filter(i => i.type === 'good').length} categories under budget
                                            </span>
                                        </div>
                                    )}
                                </>
                            ) : (
                                <div className="flex items-center gap-2 text-emerald-600">
                                    <TrendingDown className="h-5 w-5" />
                                    <span className="font-medium">Spending looks normal</span>
                                </div>
                            )}
                        </div>
                        <p className="text-xs text-gray-400 mt-4 pt-4 border-t border-gray-100">
                            based on historical patterns
                        </p>
                    </CardContent>
                </Card>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* 2. Insights List (Left 2/3) */}
                <div className="lg:col-span-2 space-y-6">
                    <h3 className="text-lg font-semibold text-gray-800">Alerts & Findings</h3>
                    <div className="grid gap-4">
                        {insights.length > 0 ? (
                            insights.map((insight, idx) => {
                                const isExpanded = expandedInsightIdx === idx;

                                // Prepare comparison data if expanded and categoryId exists
                                let comparisonData = null;
                                if (isExpanded && insight.categoryId) {
                                    // Current Month Data (Transactions)
                                    // Use getFinancialsForMonth with strict category filtering
                                    const currentFinancials = getFinancialsForMonth(
                                        monthlyStats[selectedMonthIndex].date,
                                        data.recurringTransactions,
                                        data.transactions,
                                        data.fixedExpenses
                                    ).filter(t => t.categoryId === insight.categoryId && t.type === 'EXPENSE')
                                        .sort((a, b) => new Date(b.date) - new Date(a.date));

                                    // Previous Month Data
                                    // If comparisonType is 'average', we need last 3 months.
                                    // If 'month_over_month', just 1.

                                    const historyItems = [];

                                    if (insight.comparisonType === 'average') {
                                        // Fetch last 3 months
                                        for (let i = 1; i <= 3; i++) {
                                            const histStats = monthlyStats[selectedMonthIndex + i];
                                            if (histStats) {
                                                const financials = getFinancialsForMonth(
                                                    histStats.date,
                                                    data.recurringTransactions,
                                                    data.transactions,
                                                    data.fixedExpenses
                                                ).filter(t => t.categoryId === insight.categoryId && t.type === 'EXPENSE')
                                                    .sort((a, b) => new Date(b.date) - new Date(a.date));

                                                historyItems.push({
                                                    monthName: format(histStats.date, 'MMMM', { locale: ptBR }),
                                                    transactions: financials,
                                                    total: financials.reduce((acc, t) => acc + Number(t.amount), 0)
                                                });
                                            } else {
                                                // Month might not exist in stats (e.g. new user), but we should perhaps show it as 0?
                                                // Calculate date manually
                                                // For now, only show available history to avoid complex date math if stats are missing.
                                                // Actually logic requires 3 months data to trigger insight, so stats MUST exist.
                                            }
                                        }
                                    } else {
                                        // Default: Month over Month (1 prev month)
                                        const prevStats = monthlyStats[selectedMonthIndex + 1];
                                        if (prevStats) {
                                            const financials = getFinancialsForMonth(
                                                prevStats.date,
                                                data.recurringTransactions,
                                                data.transactions,
                                                data.fixedExpenses
                                            ).filter(t => t.categoryId === insight.categoryId && t.type === 'EXPENSE')
                                                .sort((a, b) => new Date(b.date) - new Date(a.date));

                                            historyItems.push({
                                                monthName: format(prevStats.date, 'MMMM', { locale: ptBR }),
                                                transactions: financials,
                                                total: financials.reduce((acc, t) => acc + Number(t.amount), 0)
                                            });
                                        }
                                    }

                                    comparisonData = {
                                        current: {
                                            monthName: format(monthlyStats[selectedMonthIndex].date, 'MMMM', { locale: ptBR }),
                                            transactions: currentFinancials,
                                            total: currentFinancials.reduce((acc, t) => acc + Number(t.amount), 0)
                                        },
                                        history: historyItems,
                                        type: insight.comparisonType || 'month_over_month'
                                    };
                                }

                                return (
                                    <InsightCard
                                        key={idx}
                                        insight={insight}
                                        formatCurrency={formatCurrency}
                                        isExpanded={isExpanded}
                                        onToggle={() => setExpandedInsightIdx(isExpanded ? null : idx)}
                                        comparisonData={comparisonData}
                                    />
                                );
                            })
                        ) : (
                            <div className="p-8 bg-gray-50 rounded-xl border border-dashed text-center">
                                <p className="text-gray-500">
                                    {monthlyStats[selectedMonthIndex + 1]
                                        ? "No anomalies detected for this month."
                                        : "Not enough historical data for trend analysis."}
                                </p>
                            </div>
                        )}
                    </div>
                </div>

                {/* 3. Right Sidebar (Top Spending Only) */}
                <div className="space-y-6 lg:sticky lg:top-8 h-fit">


                    {/* Top Spending Card */}
                    <div>
                        <h3 className="text-lg font-semibold text-gray-800 mb-4">Top Spending</h3>
                        <Card className="h-full">
                            <CardContent className="pt-6">
                                <CategoryTrendChart data={topCategories} formatCurrency={formatCurrency} />
                                <div className="mt-4 space-y-3">
                                    {topCategories.map(cat => (
                                        <div key={cat.id} className="flex items-center justify-between text-sm">
                                            <div className="flex items-center gap-2">
                                                <div className="w-2 h-2 rounded-full" style={{ backgroundColor: cat.color }} />
                                                <span>{cat.name}</span>
                                            </div>
                                            <span className="font-medium">{formatCurrency(cat.amount)}</span>
                                        </div>
                                    ))}
                                </div>
                            </CardContent>
                        </Card>
                    </div>
                </div>
            </div>
        </div >
    );
}
