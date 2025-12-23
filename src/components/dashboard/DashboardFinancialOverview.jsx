import {
    BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend
} from 'recharts';
import { Card } from '../ui/Card';

export function DashboardFinancialOverview({ chartData, pieData, breakdownFilter, setBreakdownFilter, categories, formatCurrency }) {
    return (
        <Card className="lg:col-span-2 p-6 bg-white min-h-[500px] rounded-none shadow-none">
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
                                        </div>
                                    );
                                }
                                return null;
                            }}
                        />
                        <Legend
                            content={({ payload }) => {
                                // Filter active keys
                                const activeKeys = new Set();
                                chartData.forEach(d => {
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
