import { useState, useMemo } from 'react';
import {
    BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend, ReferenceLine
} from 'recharts';
import { Card } from '../ui/Card';

export function DashboardFinancialOverview({ chartData, pieData, breakdownFilter, setBreakdownFilter, categories, formatCurrency }) {
    const [viewMode, setViewMode] = useState('DEFAULT'); // DEFAULT (-3 to +5), 3M, 6M, 1Y (Past)

    // Filter data based on view mode
    const filteredData = useMemo(() => {
        if (!chartData || chartData.length === 0) return [];

        const currentIndex = chartData.findIndex(d => d.isCurrent);
        if (currentIndex === -1) return chartData;

        let start, end;

        switch (viewMode) {
            case '3M': // Past 3 months (Current + 2 previous)
                start = currentIndex - 2;
                end = currentIndex;
                break;
            case '6M': // Past 6 months (Current + 5 previous)
                start = currentIndex - 5;
                end = currentIndex;
                break;
            case '1Y': // Past 12 months (Current + 11 previous)
                start = currentIndex - 11;
                end = currentIndex;
                break;
            case 'DEFAULT':
            default:
                // 3 months back, 5 months forward (Total 9 months: -3 to +5)
                start = currentIndex - 3;
                end = currentIndex + 5;
                break;
        }

        // Ensure bounds
        start = Math.max(0, start);
        end = Math.min(chartData.length - 1, end);

        return chartData.slice(start, end + 1);
    }, [chartData, viewMode]);

    // Calculate averages for visible data
    const averages = useMemo(() => {
        if (!filteredData || filteredData.length === 0) return { income: 0, expense: 0 };

        const totalIncome = filteredData.reduce((sum, item) => sum + item.income, 0);
        const totalExpense = filteredData.reduce((sum, item) => sum + item.expense, 0);

        return {
            income: totalIncome / filteredData.length,
            expense: totalExpense / filteredData.length
        };
    }, [filteredData]);

    return (
        <Card className="lg:col-span-2 p-6 bg-white min-h-[500px] rounded-none shadow-none">
            <div className="flex justify-between items-start mb-8">
                <div>
                    <h3 className="text-lg font-bold text-gray-900">
                        Financial Overview
                    </h3>
                    <p className="text-sm text-gray-400">Income vs Expenses</p>
                </div>
                <div className="flex gap-2">
                    {/* View Selectors */}
                    {['DEFAULT', '3M', '6M', '1Y'].map(mode => (
                        <button
                            key={mode}
                            onClick={() => setViewMode(mode)}
                            className={`px-3 py-1 text-xs font-medium uppercase tracking-wider transition-colors ${viewMode === mode
                                ? 'text-white bg-gray-900'
                                : 'text-gray-500 hover:text-gray-900 bg-gray-100 hover:bg-gray-200'
                                }`}
                        >
                            {mode === 'DEFAULT' ? 'Default' : mode === '1Y' ? 'Year' : mode === '3M' ? '3 Months' : '6 Months'}
                        </button>
                    ))}
                </div>
            </div>

            <div className="h-[400px]">
                <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={filteredData} barSize={20}>
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
                            tickFormatter={(value) => formatCurrency ? formatCurrency(value).replace(/\D00(?=\D*$)/, '') : value}
                        />
                        <Tooltip
                            cursor={{ fill: 'transparent' }}
                            content={({ active, payload, label }) => {
                                if (active && payload && payload.length) {
                                    return (
                                        <div className="bg-white p-3 shadow-xl rounded-lg border border-gray-100">
                                            <p className="text-xs text-gray-500 mb-1 font-bold uppercase">{payload[0]?.payload?.fullName || label}</p>
                                            {payload.map((p, i) => {
                                                const isIncome = p.dataKey && p.dataKey.toString().startsWith('inc_');
                                                const typeLabel = isIncome ? 'Income' : 'Expense';
                                                return (
                                                    <p key={i} className="text-sm font-medium" style={{ color: p.color }}>
                                                        {p.name} <span className="text-xs opacity-75">({typeLabel})</span>: {formatCurrency(p.value)}
                                                    </p>
                                                );
                                            })}
                                            <div className="mt-2 pt-2 border-t border-gray-100">
                                                <p className="text-xs text-gray-400 uppercase font-bold">Averages (View)</p>
                                                <p className="text-xs text-gray-500">Income: {formatCurrency(averages.income)}</p>
                                                <p className="text-xs text-gray-500">Expense: {formatCurrency(averages.expense)}</p>
                                            </div>
                                        </div>
                                    );
                                }
                                return null;
                            }}
                        />

                        {/* Average Lines */}
                        <ReferenceLine
                            y={averages.income}
                            stroke="#22c55e"
                            strokeDasharray="3 3"
                            strokeOpacity={0.5}
                            label={{ position: 'right', value: 'Avg Inc', fill: '#22c55e', fontSize: 10 }}
                        />
                        <ReferenceLine
                            y={averages.expense}
                            stroke="#ef4444"
                            strokeDasharray="3 3"
                            strokeOpacity={0.5}
                            label={{ position: 'right', value: 'Avg Exp', fill: '#ef4444', fontSize: 10 }}
                        />

                        <Legend
                            content={({ payload }) => {
                                // Filter active keys
                                const activeKeys = new Set();
                                filteredData.forEach(d => {
                                    Object.keys(d).forEach(k => {
                                        if (typeof d[k] === 'number' && d[k] > 0) {
                                            activeKeys.add(k);
                                        }
                                    });
                                });

                                const filteredPayload = payload.filter(entry => activeKeys.has(entry.dataKey));

                                return (
                                    <div className="flex flex-wrap gap-4 mt-4 justify-center">
                                        {filteredPayload.map((entry, index) => (
                                            <div key={`item-${index}`} className="flex items-center gap-1.5">
                                                <div
                                                    className="w-2 h-2 rounded-full"
                                                    style={{ backgroundColor: entry.color }}
                                                />
                                                <span className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider">
                                                    {entry.value}
                                                </span>
                                            </div>
                                        ))}
                                    </div>
                                );
                            }}
                        />
                        {/* Generate Bars for Categories */}
                        {(categories || [])
                            .filter(c => c.type === 'EXPENSE' || c.type === 'BOTH')
                            .map(cat => (
                                <Bar
                                    key={`exp_${cat.id}`}
                                    dataKey={`exp_${cat.id}`}
                                    name={cat.name}
                                    stackId="expenses"
                                    fill={cat.color}
                                />
                            ))
                        }
                        {/* Uncategorized expenses */}
                        <Bar dataKey="exp_uncategorized_expense" name="Uncategorized Exp" stackId="expenses" fill="#9ca3af" />

                        {/* Income Bar (Single or Stacked? User said Income vs Expense stacked. Usually income is one block) */}
                        {/* Let's keep Income as a separate bar stack for comparison */}
                        {(categories || [])
                            .filter(c => c.type === 'INCOME' || c.type === 'BOTH')
                            .map(cat => (
                                <Bar
                                    key={`inc_${cat.id}`}
                                    dataKey={`inc_${cat.id}`}
                                    name={cat.name}
                                    stackId="income"
                                    fill={cat.color}
                                />
                            ))
                        }
                        {/* Uncategorized income */}
                        <Bar dataKey="inc_uncategorized_income" name="Uncategorized Inc" stackId="income" fill="#d1d5db" />
                    </BarChart>
                </ResponsiveContainer>
            </div>
        </Card>
    );
}
