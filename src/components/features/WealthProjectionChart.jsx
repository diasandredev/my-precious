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
            <div className="bg-white/95 backdrop-blur-md p-4 border border-slate-200/80 shadow-xl rounded-2xl z-50 min-w-[200px]">
                <p className="font-bold text-slate-900 mb-3 text-sm font-mono">{label}</p>
                <div className="space-y-2">
                    {payload.map((entry, index) => (
                        <div key={index} className="flex items-center justify-between gap-4 text-xs">
                            <div className="flex items-center gap-2">
                                <div
                                    className="w-2.5 h-2.5 rounded-full"
                                    style={{ backgroundColor: entry.color }}
                                />
                                <span className="text-slate-600 font-medium">{entry.name}</span>
                            </div>
                            <span className="font-mono font-bold text-slate-900">
                                {new Intl.NumberFormat('pt-BR', {
                                    style: 'currency',
                                    currency: 'BRL'
                                }).format(entry.value)}
                            </span>
                        </div>
                    ))}
                    <div className="border-t border-slate-100 my-2 pt-2 flex items-center justify-between gap-4">
                        <span className="text-slate-900 font-bold text-xs">Total Projetado</span>
                        <span className="font-mono font-extrabold text-slate-900 text-sm">
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
            <div className="h-[300px] flex items-center justify-center text-slate-400 text-sm">
                Nenhum dado de projeção disponível.
            </div>
        );
    }

    return (
        <Card className={cn("p-6 bg-white border-slate-200/80 shadow-xs hover:shadow-md transition-all rounded-2xl", className)}>
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
                <div>
                    <h3 className="text-base font-bold text-slate-900">Evolução Patrimonial (1 Ano)</h3>
                    <p className="text-xs text-slate-400">Composição do crescimento estimado por fonte</p>
                </div>
                {/* Simple Legend */}
                <div className="flex flex-wrap items-center gap-3 text-xs font-medium">
                    <div className="flex items-center gap-1.5 bg-slate-50 px-2 py-1 rounded-lg border border-slate-200/60">
                        <div className="w-2 h-2 rounded-full bg-slate-400"></div>
                        <span className="text-slate-600">Saldo Inicial</span>
                    </div>
                    <div className="flex items-center gap-1.5 bg-blue-50 px-2 py-1 rounded-lg border border-blue-200/60">
                        <div className="w-2 h-2 rounded-full bg-blue-500"></div>
                        <span className="text-blue-700">Aporte Acumulado</span>
                    </div>
                    <div className="flex items-center gap-1.5 bg-emerald-50 px-2 py-1 rounded-lg border border-emerald-200/60">
                        <div className="w-2 h-2 rounded-full bg-emerald-500"></div>
                        <span className="text-emerald-700">Rendimento Acumulado</span>
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
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                        <XAxis
                            dataKey="month"
                            axisLine={false}
                            tickLine={false}
                            tick={{ fill: '#94a3b8', fontSize: 12 }}
                            tickMargin={10}
                        />
                        <YAxis
                            axisLine={false}
                            tickLine={false}
                            tick={{ fill: '#94a3b8', fontSize: 12 }}
                            tickFormatter={(value) =>
                                new Intl.NumberFormat('pt-BR', {
                                    notation: "compact",
                                    compactDisplay: "short",
                                    currency: 'BRL',
                                    style: 'currency'
                                }).format(value)
                            }
                        />
                        <Tooltip content={<CustomTooltip />} cursor={{ stroke: '#e2e8f0' }} />

                        {/* Stacked Areas */}
                        <Area
                            type="monotone"
                            dataKey="initialPrincipal"
                            name="Saldo Inicial"
                            stackId="1"
                            stroke="#94a3b8"
                            fill="url(#colorPrincipal)"
                        />
                        <Area
                            type="monotone"
                            dataKey="accumulatedSavings"
                            name="Aporte Acumulado"
                            stackId="1"
                            stroke="#3b82f6"
                            fill="url(#colorSavings)"
                        />
                        <Area
                            type="monotone"
                            dataKey="totalYield"
                            name="Rendimento Acumulado"
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
