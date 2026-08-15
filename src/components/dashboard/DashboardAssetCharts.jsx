import {
    BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend
} from 'recharts';
import { Card } from '../ui/Card';
import { DashboardAssetsCard } from './DashboardAssetsCard';

export function DashboardAssetCharts({ evolutionData, allocationData, sortedAccounts, getAccountColor, formatCurrency }) {
    // Calculate total value for allocation
    const totalValue = allocationData.reduce((sum, item) => sum + item.value, 0);

    return (
        <div className="space-y-4 mb-4">
            {/* Assets Allocation Card */}
            <div>
                <DashboardAssetsCard
                    allocationData={allocationData}
                    totalValue={totalValue}
                    formatCurrency={formatCurrency}
                    getAccountColor={getAccountColor}
                />
            </div>

            {/* Stacked Area/Bar Chart - Evolution */}
            <Card className="p-6 bg-white min-h-[480px] rounded-2xl border border-slate-200/80 shadow-xs hover:shadow-md transition-all">
                <div className="flex items-center justify-between mb-6">
                    <div>
                        <h3 className="text-lg font-bold text-slate-900">Evolução Patrimonial</h3>
                        <p className="text-xs text-slate-400">Histórico de snapshots e distribuição por conta</p>
                    </div>
                </div>
                <div className="h-[400px]">
                    <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={evolutionData}>
                            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                            <XAxis
                                dataKey="name"
                                axisLine={false}
                                tickLine={false}
                                tick={{ fill: '#94a3b8', fontSize: 12 }}
                                dy={10}
                            />
                            <YAxis
                                axisLine={false}
                                tickLine={false}
                                tick={{ fill: '#94a3b8', fontSize: 12 }}
                                tickFormatter={(value) => `R$${value / 1000}k`}
                            />
                            <Tooltip
                                cursor={{ fill: 'rgba(0,0,0,0.02)' }}
                                content={({ active, payload, label }) => {
                                    if (active && payload && payload.length) {
                                        const sortedPayload = [...payload].sort((a, b) => b.value - a.value);

                                        return (
                                            <div className="bg-white/95 backdrop-blur-md p-3.5 shadow-xl rounded-xl border border-slate-200/80 z-50">
                                                <p className="text-xs text-slate-500 mb-2 font-bold uppercase">{payload[0]?.payload?.tooltipLabel || label}</p>
                                                <div className="space-y-1">
                                                    {sortedPayload.map((p, i) => (
                                                        <div key={i} className="flex justify-between gap-4 text-xs">
                                                            <span className="font-medium" style={{ color: p.color }}>{p.name}:</span>
                                                            <span className="font-mono font-semibold text-slate-700">
                                                                {formatCurrency(p.value)}
                                                            </span>
                                                        </div>
                                                    ))}
                                                </div>
                                                <div className="mt-2.5 pt-2 border-t border-slate-100 flex justify-between gap-4 text-xs font-bold text-slate-900">
                                                    <span>Total:</span>
                                                    <span className="font-mono">
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
                                                    className="w-2.5 h-2.5 rounded-full shadow-xs"
                                                    style={{ backgroundColor: entry.color }}
                                                />
                                                <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
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
                                    radius={index === sortedAccounts.length - 1 ? [4, 4, 0, 0] : [0, 0, 0, 0]}
                                />
                            ))}
                        </BarChart>
                    </ResponsiveContainer>
                </div>
            </Card>
        </div>
    );
}

