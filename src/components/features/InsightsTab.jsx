import { useState, useMemo } from 'react';
import { useData } from '../../contexts/DataContext';
import { calculateMonthlyExpenses, analyzeTrends, identifyTopCategories, aggregateMonthlyData } from '../../lib/insights';
import { getFinancialsForMonth } from '../../lib/financialPeriodUtils';
import { InsightCard } from '../insights/InsightCard';
import { CategoryTrendChart } from '../insights/CategoryTrendChart';
import { Card, CardHeader, CardTitle, CardContent } from '../ui/Card';
import { format, startOfMonth } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { ArrowLeft, ArrowRight, TrendingUp, TrendingDown, AlertTriangle, Wallet, PieChart, LineChart } from 'lucide-react';

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
    const currentMonthTransactions = useMemo(() => {
        const stats = monthlyStats[selectedMonthIndex];
        if (!stats) return [];

        return getFinancialsForMonth(
            stats.date,
            data.recurringTransactions,
            data.transactions,
            data.fixedExpenses
        );
    }, [selectedMonthIndex, monthlyStats, data.recurringTransactions, data.transactions, data.fixedExpenses]);

    const currentMonthData = useMemo(() => {
        const stats = monthlyStats[selectedMonthIndex];
        if (!stats) return null;

        // Aggregate these financials into the Statistics format
        const enhancedStats = aggregateMonthlyData(currentMonthTransactions, stats.date);

        // Mark if it contains projections
        enhancedStats.hasProjections = currentMonthTransactions.some(f => f.status === 'PROJECTED');
        enhancedStats.isProjected = enhancedStats.hasProjections;

        return enhancedStats;
    }, [selectedMonthIndex, monthlyStats, currentMonthTransactions]);

    const insights = useMemo(() => {
        const result = analyzeTrends(
            currentMonthData,
            monthlyStats,
            selectedMonthIndex,
            data.categories,
            formatCurrency,
            currentMonthTransactions,
            data.recurringTransactions
        );

        const getScore = (insight) => {
            const t = insight?.type?.toLowerCase();
            if (t === 'alert') return 0;
            if (t === 'warning') return 1;
            if (t === 'good') return 2;
            return 3; // Info or others
        };

        return result.sort((a, b) => getScore(a) - getScore(b));
    }, [currentMonthData, monthlyStats, selectedMonthIndex, data.categories, formatCurrency, currentMonthTransactions, data.recurringTransactions]);



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
        <div className="space-y-6 max-w-full mx-auto pb-12">

            {/* Header Section */}
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
                        <TrendingUp className="h-6 w-6" />
                        Financial Insights
                    </h1>
                    <p className="text-gray-500 mt-1">Analyze your spending patterns and discover trends</p>
                </div>

                {/* Right Side: Month Navigation (Styled like Projections controls) */}
                <div className="flex items-center gap-2 bg-white p-1 rounded-lg border shadow-sm">
                    <button
                        onClick={() => navigateMonth(1)}
                        disabled={selectedMonthIndex >= monthlyStats.length - 1}
                        className="p-1.5 hover:bg-gray-100 rounded-md disabled:opacity-30 text-gray-500 transition-colors"
                        aria-label="Previous Month"
                    >
                        <ArrowLeft className="h-4 w-4" />
                    </button>

                    <span className="font-semibold text-sm text-gray-700 min-w-[140px] text-center capitalize select-none">
                        {format(currentMonthData.date, 'MMMM yyyy', { locale: ptBR })}
                    </span>

                    <button
                        onClick={() => navigateMonth(-1)}
                        disabled={selectedMonthIndex <= 0}
                        className="p-1.5 hover:bg-gray-100 rounded-md disabled:opacity-30 text-gray-500 transition-colors"
                        aria-label="Next Month"
                    >
                        <ArrowRight className="h-4 w-4" />
                    </button>
                </div>
            </div>

            {/* 1. Overview Cards for Selected Month */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Card className="flex flex-col h-full">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 p-4">
                        <CardTitle className="text-sm font-medium text-gray-500">Total Expenses</CardTitle>
                        <Wallet className="h-4 w-4 text-gray-400" />
                    </CardHeader>
                    <CardContent className="p-4 pt-2 flex-1 flex flex-col justify-between">
                        <div>
                            <div className="text-2xl font-bold">{formatCurrency(currentMonthData.total)}</div>
                            <p className="text-xs text-gray-500 mt-1">
                                {currentMonthData.hasProjections ? (
                                    <span className="text-amber-600 font-medium">Includes Projected</span>
                                ) : (
                                    <span>Realized Amount</span>
                                )}
                            </p>
                        </div>
                        {monthlyStats[selectedMonthIndex + 1] && (
                            <div className="mt-4 pt-3 border-t border-gray-100 flex items-center justify-between">
                                <span className="text-xs text-gray-400">vs last month</span>
                                <div className={`flex items-center gap-1 text-xs font-medium ${currentMonthData.total > monthlyStats[selectedMonthIndex + 1].total ? 'text-red-500' : 'text-emerald-500'
                                    }`}>
                                    {currentMonthData.total > monthlyStats[selectedMonthIndex + 1].total ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
                                    {Math.abs((currentMonthData.total - monthlyStats[selectedMonthIndex + 1].total) / monthlyStats[selectedMonthIndex + 1].total * 100).toFixed(0)}%
                                </div>
                            </div>
                        )}
                    </CardContent>
                </Card>

                <Card className="flex flex-col h-full">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 p-4">
                        <CardTitle className="text-sm font-medium text-gray-500">Top Category</CardTitle>
                        <PieChart className="h-4 w-4 text-gray-400" />
                    </CardHeader>
                    <CardContent className="p-4 pt-2 flex-1 flex flex-col justify-between">
                        <div>
                            <div className="flex items-center gap-2 mb-1">
                                {topCategories[0]?.color && (
                                    <div className="w-3 h-3 rounded-full shrink-0" style={{ backgroundColor: topCategories[0].color }} />
                                )}
                                <div className="text-xl font-bold truncate">
                                    {topCategories[0]?.name || 'N/A'}
                                </div>
                            </div>
                            <div className="text-sm font-medium text-gray-700">
                                {topCategories[0] ? `${formatCurrency(topCategories[0].amount)}` : '-'}
                                <span className="text-gray-400 ml-1 font-normal">
                                    {topCategories[0] ? `(${topCategories[0].percentage.toFixed(0)}%)` : ''}
                                </span>
                            </div>
                        </div>
                        {topCategories[0] && monthlyStats[selectedMonthIndex + 1] && (
                            <div className="mt-4 pt-3 border-t border-gray-100 flex items-center justify-between">
                                <span className="text-xs text-gray-400">Previous</span>
                                <span className="text-xs font-medium text-gray-600">
                                    {formatCurrency(monthlyStats[selectedMonthIndex + 1].categories[topCategories[0].id] || 0)}
                                </span>
                            </div>
                        )}
                    </CardContent>
                </Card>

                {/* Trend Analysis Card */}
                <Card className="flex flex-col h-full">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 p-4">
                        <CardTitle className="text-sm font-medium text-gray-500">Trend Analysis</CardTitle>
                        <LineChart className="h-4 w-4 text-gray-400" />
                    </CardHeader>
                    <CardContent className="p-4 pt-2 flex-1">
                        <div className="space-y-3">
                            {insights.length > 0 ? (
                                <>
                                    {insights.filter(i => i.type === 'alert').length > 0 && (
                                        <div className="flex items-center justify-between">
                                            <div className="flex items-center gap-2 text-red-600">
                                                <TrendingUp className="h-4 w-4" />
                                                <span className="font-semibold text-sm">Critical Alerts</span>
                                            </div>
                                            <span className="bg-red-100 text-red-700 text-xs font-bold px-2 py-0.5 rounded-full">
                                                {insights.filter(i => i.type === 'alert').length}
                                            </span>
                                        </div>
                                    )}
                                    {insights.filter(i => i.type === 'warning').length > 0 && (
                                        <div className="flex items-center justify-between">
                                            <div className="flex items-center gap-2 text-amber-600">
                                                <AlertTriangle className="h-4 w-4" />
                                                <span className="font-semibold text-sm">Warnings</span>
                                            </div>
                                            <span className="bg-amber-100 text-amber-700 text-xs font-bold px-2 py-0.5 rounded-full">
                                                {insights.filter(i => i.type === 'warning').length}
                                            </span>
                                        </div>
                                    )}
                                    {insights.filter(i => i.type === 'good').length > 0 && (
                                        <div className="flex items-center justify-between">
                                            <div className="flex items-center gap-2 text-emerald-600">
                                                <TrendingDown className="h-4 w-4" />
                                                <span className="font-medium text-sm">Positive highlights</span>
                                            </div>
                                            <span className="bg-emerald-100 text-emerald-700 text-xs font-bold px-2 py-0.5 rounded-full">
                                                {insights.filter(i => i.type === 'good').length}
                                            </span>
                                        </div>
                                    )}
                                    {insights.filter(i => i.type === 'info').length > 0 && (
                                        <div className="flex items-center justify-between">
                                            <div className="flex items-center gap-2 text-blue-500">
                                                <div className="h-4 w-4 flex items-center justify-center font-bold text-[10px] ring-1 ring-blue-200 rounded-full">i</div>
                                                <span className="font-medium text-sm">Observations</span>
                                            </div>
                                            <span className="bg-blue-100 text-blue-700 text-xs font-bold px-2 py-0.5 rounded-full">
                                                {insights.filter(i => i.type === 'info').length}
                                            </span>
                                        </div>
                                    )}
                                </>
                            ) : (
                                <div className="flex items-center gap-2 text-emerald-600">
                                    <TrendingDown className="h-4 w-4" />
                                    <span className="font-medium text-sm">Spending appears normal</span>
                                </div>
                            )}
                        </div>
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
