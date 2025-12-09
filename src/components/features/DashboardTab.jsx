import { useMemo } from 'react';
import { format, addMonths, subMonths, startOfMonth, endOfMonth, isSameMonth, isAfter, isBefore } from 'date-fns';
import {
    AreaChart, Area, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell, Legend
} from 'recharts';
import { ArrowUpRight, ArrowDownRight, Search, MoreHorizontal, TrendingUp, TrendingDown } from 'lucide-react';
import { useData } from '../../contexts/DataContext';
import { cn } from '../../lib/utils';

export function DashboardTab() {
    const { data, formatCurrency } = useData();

    // --- Derived Data Calculations ---

    // 1. Total Net Worth & Trend
    const netWorthStats = useMemo(() => {
        // Sort snapshots by date desc
        const sortedSnapshots = [...data.snapshots].sort((a, b) => new Date(b.date) - new Date(a.date));

        const currentSnapshot = sortedSnapshots[0];
        const currentTotal = currentSnapshot ? Object.values(currentSnapshot.balances).reduce((a, b) => a + b, 0) : 0;

        // Find last month's snapshot (approx)
        const lastMonthDate = subMonths(new Date(), 1);
        const lastMonthSnapshot = sortedSnapshots.find(s => isSameMonth(new Date(s.date), lastMonthDate));
        // If no exact match, try finding one close or just use the next available one if it's older? 
        // For simplicity, let's look for the most recent one BEFORE this month.
        const prevSnapshot = sortedSnapshots.find(s => isBefore(new Date(s.date), startOfMonth(new Date())));

        const prevTotal = prevSnapshot ? Object.values(prevSnapshot.balances).reduce((a, b) => a + b, 0) : 0;

        const diff = currentTotal - prevTotal;
        const percentChange = prevTotal !== 0 ? (diff / prevTotal) * 100 : 0;

        return { currentTotal, percentChange, diff };
    }, [data.snapshots]);

    // 2. Chart Data (2 months back + Current + 6 months forward)
    const chartData = useMemo(() => {
        const currentDate = new Date();
        const months = [];

        // Generate range: -2 to +6
        for (let i = -2; i <= 6; i++) {
            const d = addMonths(currentDate, i);
            months.push({
                date: d,
                name: format(d, 'MMM'),
                fullDate: format(d, 'yyyy-MM'),
                expense: 0,
                income: 0,
                isFuture: i > 0,
                isCurrent: i === 0
            });
        }

        // Fill Past & Current from Transactions
        data.transactions.forEach(t => {
            const tDate = new Date(t.date);
            const monthData = months.find(m => isSameMonth(tDate, m.date));
            if (monthData) {
                if (t.type === 'EXPENSE') monthData.expense += t.amount;
                else if (t.type === 'INCOME') monthData.income += t.amount;
            }
        });

        // Fill Future from Fixed Items (Projections)
        // Simple projection: if fixed item is active, add it to future months
        // Note: This matches "Monthly" recurrence mostly. 
        // For accurate daily/weekly recurrence we'd need complex logic.
        // Assuming 'fixedItems' are mostly monthly or we estimate monthly cost.
        if (data.fixedItems) {
            data.fixedItems.forEach(item => {
                // If item has no end date or end date is after... 
                // Simplified: Add amount to all future months
                months.filter(m => m.isFuture).forEach(m => {
                    // Check if item should occur in this month?
                    // For MVP: assume monthly recurrence for all fixed items
                    if (item.type === 'EXPENSE') m.expense += item.amount;
                    else if (item.type === 'INCOME') m.income += item.amount;
                });
            });
        }

        return months;
    }, [data.transactions, data.fixedItems]);

    // 3. Total Spendings (Current Month? or displayed range?)
    // Request says "Total Spendings chart n está representando nenhum dado real". 
    // And user complained about logic. Let's show TOTAL EXPENSES for the CURRENT MONTH as the main KPI.
    const currentMonthMetrics = useMemo(() => {
        const current = chartData.find(d => d.isCurrent);
        return current || { expense: 0, income: 0 };
    }, [chartData]);

    return (
        <div className="space-y-6">

            {/* Top Row Stats */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">

                {/* Total Spendings (Current Month) */}
                <Card className="p-6 relative overflow-hidden bg-white">
                    <div className="flex justify-between items-start mb-4">
                        <div>
                            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Total Spendings</p>
                            <div className="flex items-baseline gap-2 mt-1">
                                <h3 className="text-2xl font-bold text-gray-900">
                                    {formatCurrency(currentMonthMetrics.expense)}
                                </h3>
                            </div>
                            <p className="text-xs text-gray-400 mt-1">in {format(new Date(), 'MMMM')}</p>
                        </div>
                    </div>
                </Card>

                {/* Income / Savings (Using Income for this slot?) */}
                <Card className="p-6 bg-white">
                    <div className="flex justify-between items-start mb-4">
                        <div>
                            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Total Income</p>
                            <div className="flex items-baseline gap-2 mt-1">
                                <h3 className="text-2xl font-bold text-gray-900">
                                    {formatCurrency(currentMonthMetrics.income)}
                                </h3>
                            </div>
                            <p className="text-xs text-gray-400 mt-1">in {format(new Date(), 'MMMM')}</p>
                        </div>
                    </div>
                </Card>

                {/* Total Net Worth Trend */}
                <Card className="p-6 bg-white">
                    <div className="flex justify-between items-start mb-2">
                        <div>
                            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Total Net Worth</p>
                            <div className="flex items-baseline gap-2 mt-1">
                                <h3 className="text-2xl font-bold text-gray-900">
                                    {formatCurrency(netWorthStats.currentTotal)}
                                </h3>
                                <span className={cn(
                                    "text-xs font-medium px-1.5 py-0.5 rounded flex items-center gap-1",
                                    netWorthStats.percentChange >= 0 ? "text-emerald-500 bg-emerald-50" : "text-red-500 bg-red-50"
                                )}>
                                    {netWorthStats.percentChange >= 0 ? <TrendingUp size={12} /> : <TrendingDown size={12} />}
                                    {Math.abs(netWorthStats.percentChange).toFixed(1)}%
                                </span>
                            </div>
                            <p className="text-xs text-gray-400 mt-1">vs last month</p>
                        </div>
                    </div>
                </Card>

            </div>

            {/* Bottom Section */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

                {/* Transactions List */}
                <Card className="lg:col-span-1 p-6 bg-white space-y-6 max-h-[500px] overflow-y-auto">
                    <div className="flex items-center justify-between">
                        <h3 className="text-lg font-bold text-gray-900">Transactions</h3>
                        <p className="text-xs text-gray-400">Recent</p>
                    </div>

                    <div className="space-y-6">
                        <TransactionList transactions={data.transactions} formatCurrency={formatCurrency} />
                    </div>
                </Card>

                {/* Main Chart */}
                <Card className="lg:col-span-2 p-6 bg-white min-h-[500px]">
                    <div className="flex justify-between items-start mb-8">
                        <div>
                            <h3 className="text-lg font-bold text-gray-900">
                                Financial Overview
                            </h3>
                            <p className="text-sm text-gray-400">Income vs Expenses (Past & Projected)</p>
                        </div>
                    </div>

                    <div className="h-[400px]">
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={chartData} barSize={20}>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f3f4f6" />
                                <XAxis
                                    dataKey="name"
                                    axisLine={false}
                                    tickLine={false}
                                    tick={{ fill: '#9ca3af', fontSize: 12 }}
                                    dy={10}
                                />
                                <YAxis
                                    axisLine={false}
                                    tickLine={false}
                                    tick={{ fill: '#9ca3af', fontSize: 12 }}
                                    tickFormatter={(value) => formatCurrency ? formatCurrency(value).replace(/\D00(?=\D*$)/, '') : value} // Mini formatter attempt
                                />
                                <Tooltip
                                    cursor={{ fill: 'transparent' }}
                                    content={({ active, payload, label }) => {
                                        if (active && payload && payload.length) {
                                            return (
                                                <div className="bg-white p-3 shadow-xl rounded-lg border border-gray-100">
                                                    <p className="text-xs text-gray-500 mb-1 font-bold uppercase">{label}</p>
                                                    {payload.map((p, i) => (
                                                        <p key={i} className="text-sm font-medium" style={{ color: p.color }}>
                                                            {p.name}: {formatCurrency(p.value)}
                                                        </p>
                                                    ))}
                                                </div>
                                            );
                                        }
                                        return null;
                                    }}
                                />
                                <Legend />
                                <Bar dataKey="income" name="Income" fill="#22c55e" radius={[4, 4, 0, 0]} />
                                <Bar dataKey="expense" name="Expense" fill="#ef4444" radius={[4, 4, 0, 0]} />
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </Card>

            </div>
        </div>
    );
}

function Card({ children, className }) {
    return <div className={cn("rounded-2xl border border-gray-100 shadow-sm", className)}>{children}</div>;
}

function TransactionList({ transactions, formatCurrency }) {
    if (!transactions || transactions.length === 0) {
        return <p className="text-sm text-gray-400">No recent transactions.</p>;
    }

    // Sort by date desc
    const sorted = [...transactions].sort((a, b) => new Date(b.date) - new Date(a.date));

    // Group by Today, Yesterday, Date
    const grouped = sorted.reduce((acc, t) => {
        const d = new Date(t.date);
        const today = new Date();
        const yesterday = new Date();
        yesterday.setDate(yesterday.getDate() - 1);

        let key = format(d, 'MMM d');
        if (d.toDateString() === today.toDateString()) key = 'TODAY';
        else if (d.toDateString() === yesterday.toDateString()) key = 'YESTERDAY';

        if (!acc[key]) acc[key] = [];
        acc[key].push(t);
        return acc;
    }, {});

    return Object.entries(grouped).map(([label, items]) => (
        <div key={label}>
            <div className="text-xs font-semibold text-gray-400 uppercase mb-3">{label}</div>
            <div className="space-y-4">
                {items.map(t => (
                    <TransactionItem
                        key={t.id}
                        icon={
                            <div className={cn("w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs",
                                t.type === 'INCOME' ? "bg-emerald-100 text-emerald-600" : "bg-blue-100 text-blue-600"
                            )}>
                                {t.title.substring(0, 2).toUpperCase()}
                            </div>
                        }
                        title={t.title}
                        subtitle={format(new Date(t.date), 'MMM d, h:mm a')}
                        amountDisplay={formatCurrency ? (t.type === 'EXPENSE' ? '-' : '+') + formatCurrency(t.amount) : (t.type === 'EXPENSE' ? '-' : '+') + `$${t.amount}`}
                        amountColor={t.type === 'INCOME' ? "text-emerald-500" : "text-gray-900"}
                        type={t.type}
                    />
                ))}
            </div>
        </div>
    ));
}

function TransactionItem({ icon, title, subtitle, amountDisplay, amountColor, type }) {
    return (
        <div className="flex items-center justify-between group">
            <div className="flex items-center gap-4">
                {icon}
                <div>
                    <h4 className="text-sm font-bold text-gray-900">{title}</h4>
                    <p className="text-xs text-gray-400">{subtitle}</p>
                </div>
            </div>
            <div className="text-right">
                <p className={cn("text-sm font-bold", amountColor)}>{amountDisplay}</p>
                <p className="text-xs text-gray-400 capitalize">{type.toLowerCase()}</p>
            </div>
        </div>
    );
}
