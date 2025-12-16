import {
    BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell, Legend, PieChart, Pie
} from 'recharts';
import { Card } from '../ui/Card';

export function DashboardAssetCharts({ evolutionData, allocationData, sortedAccounts, getAccountColor, formatCurrency }) {
    return (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Stacked Area/Bar Chart - Evolution */}
            <Card className="lg:col-span-2 p-6 bg-white min-h-[400px]">
                <h3 className="text-lg font-bold text-gray-900 mb-6">Asset Evolution (BRL)</h3>
                <div className="h-[320px]">
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

            {/* Donut Chart - Current Allocation */}
            <Card className="lg:col-span-1 p-6 bg-white min-h-[400px] flex flex-col">
                <h3 className="text-lg font-bold text-gray-900 mb-2">Asset Allocation</h3>
                <p className="text-xs text-gray-400 mb-6">Current distribution (BRL Eq.)</p>
                <div className="flex-1 min-h-0">
                    <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                            <Pie
                                data={allocationData}
                                cx="50%"
                                cy="50%"
                                innerRadius={60}
                                outerRadius={80}
                                paddingAngle={2}
                                dataKey="value"
                            >
                                {allocationData.map((entry, index) => {
                                    // Hack: We need 'acc' to get consistent color. Accessing through closure or props might be hard if 'acc' isn't in entry.
                                    // Luckily 'allocationData' logic in hook put 'id' in entry.
                                    // But we need the 'acc' object to pass to getAccountColor.
                                    // Better to pass the whole account object in entry or modify getAccountColor to accept ID or simpler args.
                                    // Actually, getAccountColor takes (account, index). We have account ID.
                                    // Simplest fix: The hook attached 'id' and 'currency' and 'type' to allocation items.
                                    // But getAccountColor checks name!
                                    // I should update getAccountColor or pass the account map?
                                    // The hook returns `allocationData` where items have `simpleName` (=acc.name).
                                    // I can construct a dummy account object for `getAccountColor`.
                                    const dummyAcc = {
                                        id: entry.id,
                                        currency: entry.currency,
                                        name: entry.simpleName, // used for color
                                        type: entry.type
                                    };
                                    return <Cell key={`cell-${index}`} fill={getAccountColor(dummyAcc, index)} />;
                                })}
                            </Pie>
                            <Tooltip
                                formatter={(value, name, props) => [formatCurrency(value), name]}
                            />
                            <Legend layout="vertical" verticalAlign="middle" align="right" wrapperStyle={{ fontSize: '11px', maxWidth: '120px' }} />
                        </PieChart>
                    </ResponsiveContainer>
                </div>
            </Card>
        </div>
    );
}
