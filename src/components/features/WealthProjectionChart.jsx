import {
    AreaChart,
    Area,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer
} from 'recharts';
import { Card } from '../ui';
import { cn } from '../../lib/utils';

const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
        // Calculate total from payload items to allow checking % contribution
        const total = payload.reduce((sum, entry) => sum + (entry.value || 0), 0);

        return (
            <div className="bg-white p-4 border border-gray-100 shadow-xl rounded-xl z-50">
                <p className="font-bold text-gray-900 mb-3 text-base">{label}</p>
                <div className="space-y-2">
                    {payload.map((entry, index) => (
                        <div key={index} className="flex items-center justify-between gap-6 text-sm">
                            <div className="flex items-center gap-2">
                                <div
                                    className="w-2.5 h-2.5 rounded-full"
                                    style={{ backgroundColor: entry.color }}
                                />
                                <span className="text-gray-600 font-medium">{entry.name}</span>
                            </div>
                            <span className="font-mono font-bold text-gray-900">
                                {new Intl.NumberFormat('pt-BR', {
                                    style: 'currency',
                                    currency: 'BRL'
                                }).format(entry.value)}
                            </span>
                        </div>
                    ))}
                    <div className="border-t border-gray-100 my-2 pt-2 flex items-center justify-between gap-6">
                        <span className="text-gray-900 font-bold">Total Projected</span>
                        <span className="font-mono font-bold text-gray-900 text-base">
                            {new Intl.NumberFormat('pt-BR', {
                                style: 'currency',
                                currency: 'BRL'
                            }).format(total)}
                        </span>
                    </div>
                </div>
            </div>
        );
    }
    return null;
};

export function WealthProjectionChart({ data, className }) {
    if (!data || data.length === 0) {
        return (
            <div className="h-[300px] flex items-center justify-center text-gray-400">
                No projection data available.
            </div>
        );
    }


    return (
        <Card className={cn("p-6 bg-white border-gray-100 shadow-sm", className)}>
            <div className="flex items-center justify-between mb-8">
                <div>
                    <h3 className="text-lg font-bold text-gray-900">Wealth Projection (1 Year)</h3>
                    <p className="text-xs text-gray-500">Breakdown of growth by source</p>
                </div>
                {/* Simple Legend */}
                <div className="flex items-center gap-4 text-xs font-medium">
                    <div className="flex items-center gap-1.5">
                        <div className="w-2 h-2 rounded-full bg-slate-400"></div>
                        <span className="text-gray-600">Initial Balance</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                        <div className="w-2 h-2 rounded-full bg-blue-500"></div>
                        <span className="text-gray-600">Savings Added</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                        <div className="w-2 h-2 rounded-full bg-emerald-500"></div>
                        <span className="text-gray-600">Yield Earned</span>
                    </div>
                </div>
            </div>

            <div className="h-[400px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                    <AreaChart
                        data={data}
                        margin={{ top: 10, right: 10, left: 0, bottom: 0 }}
                    >
                        <defs>
                            <linearGradient id="colorYield" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="5%" stopColor="#10b981" stopOpacity={0.8} />
                                <stop offset="95%" stopColor="#10b981" stopOpacity={0.2} />
                            </linearGradient>
                            <linearGradient id="colorSavings" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.8} />
                                <stop offset="95%" stopColor="#3b82f6" stopOpacity={0.2} />
                            </linearGradient>
                            <linearGradient id="colorPrincipal" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="5%" stopColor="#94a3b8" stopOpacity={0.8} />
                                <stop offset="95%" stopColor="#94a3b8" stopOpacity={0.2} />
                            </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f3f4f6" />
                        <XAxis
                            dataKey="month"
                            axisLine={false}
                            tickLine={false}
                            tick={{ fill: '#9ca3af', fontSize: 12 }}
                            tickMargin={10}
                        />
                        <YAxis
                            axisLine={false}
                            tickLine={false}
                            tick={{ fill: '#9ca3af', fontSize: 12 }}
                            tickFormatter={(value) =>
                                new Intl.NumberFormat('pt-BR', {
                                    notation: "compact",
                                    compactDisplay: "short",
                                    currency: 'BRL',
                                    style: 'currency'
                                }).format(value)
                            }
                        />
                        <Tooltip content={<CustomTooltip />} cursor={{ stroke: '#e5e7eb' }} />

                        {/* Stacked Areas - Order matters for visual layering (rendered bottom to top in stack) */}
                        <Area
                            type="monotone"
                            dataKey="initialPrincipal"
                            name="Initial Balance"
                            stackId="1"
                            stroke="#94a3b8"
                            fill="url(#colorPrincipal)"
                        />
                        <Area
                            type="monotone"
                            dataKey="accumulatedSavings"
                            name="Savings Added"
                            stackId="1"
                            stroke="#3b82f6"
                            fill="url(#colorSavings)"
                        />
                        <Area
                            type="monotone"
                            dataKey="totalYield"
                            name="Yield Earned"
                            stackId="1"
                            stroke="#10b981"
                            fill="url(#colorYield)"
                        />
                    </AreaChart>
                </ResponsiveContainer>
            </div>
        </Card>
    );
}
