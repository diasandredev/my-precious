import {
    BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend
} from 'recharts';
import { Card } from '../ui/Card';
import { DashboardAssetsCard } from './DashboardAssetsCard';

export function DashboardAssetCharts({ evolutionData, allocationData, sortedAccounts, getAccountColor, formatCurrency }) {
    // Calculate total value for allocation
    const totalValue = allocationData.reduce((sum, item) => sum + item.value, 0);

    return (
        <div className="space-y-6">
            {/* Stacked Area/Bar Chart - Evolution */}
            <Card className="p-6 bg-white min-h-[500px]">
                <h3 className="text-lg font-bold text-gray-900 mb-6">Asset Evolution (BRL)</h3>
                <div className="h-[420px]">
                    <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={evolutionData}>
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
                                tickFormatter={(value) => `R$${value / 1000}k`}
                            />
                            <Tooltip
                                cursor={{ fill: 'rgba(0,0,0,0.05)' }}
                                content={({ active, payload, label }) => {
                                    if (active && payload && payload.length) {
                                        // Sort by value descending
                                        const sortedPayload = [...payload].sort((a, b) => b.value - a.value);

                                        return (
                                            <div className="bg-white p-3 shadow-xl rounded-lg border border-gray-100 z-50">
                                                <p className="text-xs text-gray-500 mb-2 font-bold uppercase">{payload[0]?.payload?.tooltipLabel || label}</p>
                                                {sortedPayload.map((p, i) => (
                                                    <div key={i} className="flex justify-between gap-4 text-sm mb-1">
                                                        <span className="font-medium" style={{ color: p.color }}>{p.name}:</span>
                                                        <span className="font-mono text-gray-600">
                                                            {formatCurrency(p.value)}
                                                        </span>
                                                    </div>
                                                ))}
                                                <div className="mt-2 pt-2 border-t border-gray-100 flex justify-between gap-4">
                                                    <span className="font-bold text-gray-900">Total:</span>
                                                    <span className="font-bold font-mono text-gray-900">
                                                        {formatCurrency(payload.reduce((sum, p) => sum + p.value, 0))}
                                                    </span>
                                                </div>
                                            </div>
                                        );
                                    }
                                    return null;
                                }}
                            />
                            <Legend
                                content={({ payload }) => (
                                    <div className="flex flex-wrap gap-4 mt-6 justify-center">
                                        {payload.map((entry, index) => (
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
                                )}
                            />
                            {sortedAccounts.map((acc, index) => (
                                <Bar
                                    key={acc.id}
                                    dataKey={acc.id}
                                    name={`${acc.name} (${acc.currency || 'BRL'})`}
                                    stackId="a"
                                    fill={getAccountColor(acc, index)}
                                />
                            ))}
                        </BarChart>
                    </ResponsiveContainer>
                </div>
            </Card>

            {/* Assets Allocation Card */}
            <div className="min-h-[500px]">
                <DashboardAssetsCard
                    allocationData={allocationData}
                    totalValue={totalValue}
                    formatCurrency={formatCurrency}
                    getAccountColor={getAccountColor}
                />
            </div>
        </div>
    );
}

