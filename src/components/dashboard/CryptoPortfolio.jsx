import {
    AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend
} from 'recharts';
import { Card } from '../ui/Card';

export function CryptoPortfolio({ cryptoStats, formatCurrency, getAccountColor, data }) {
    if (cryptoStats.allocationData.length === 0) return null;

    return (
        <Card className="p-6 bg-white min-h-[350px] rounded-2xl border border-slate-200/80 shadow-xs hover:shadow-md transition-all mb-4">
            <div className="flex justify-between items-center mb-6">
                <div>
                    <h3 className="text-lg font-bold text-slate-900">Portfólio Crypto</h3>
                    <p className="text-xs text-slate-400">Evolução dos ativos em criptomoedas</p>
                </div>
                <div className="text-right">
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Valor Total</p>
                    <p className="text-xl font-extrabold font-mono text-slate-900">{formatCurrency(cryptoStats.totalBalance)}</p>
                </div>
            </div>
            <div className="h-[250px]">
                {/* Area Chart for Crypto Trend */}
                <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={cryptoStats.evolutionData}>
                        <defs>
                            <linearGradient id="colorCrypto" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.15} />
                                <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0} />
                            </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                        <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#94a3b8' }} />
                        <YAxis hide domain={['auto', 'auto']} />
                        <Tooltip
                            contentStyle={{ borderRadius: '12px', border: '1px solid #e2e8f0', backgroundColor: 'rgba(255,255,255,0.95)', backdropFilter: 'blur(8px)', boxShadow: '0 10px 25px -5px rgba(0,0,0,0.1)' }}
                            formatter={(val) => formatCurrency(val)}
                            labelFormatter={(label, payload) => {
                                if (payload && payload.length > 0 && payload[0].payload.tooltipLabel) {
                                    return payload[0].payload.tooltipLabel;
                                }
                                return label;
                            }}
                        />
                        {data.accounts.filter(acc => ['BTC', 'ETH', 'BNB', 'XRP'].includes(acc.currency) || acc.type === 'Crypto').map((acc, index) => (
                            <Area
                                key={acc.id}
                                type="monotone"
                                dataKey={acc.id}
                                name={`${acc.name} (${acc.currency})`}
                                stackId="1"
                                stroke={getAccountColor(acc, index)}
                                fill={getAccountColor(acc, index)}
                                fillOpacity={0.5}
                            />
                        ))}
                    </AreaChart>
                </ResponsiveContainer>
            </div>
        </Card>
    );
}

export function CryptoAllocation({ cryptoStats, formatCurrency, getAccountColor }) {
    if (cryptoStats.allocationData.length === 0) return null;

    return (
        <Card className="p-6 bg-white min-h-[420px] flex flex-col rounded-2xl border border-slate-200/80 shadow-xs hover:shadow-md transition-all">
            <div className="mb-4">
                <h3 className="text-base font-bold text-slate-900">Alocação Crypto</h3>
                <p className="text-xs text-slate-400">Distribuição por moeda</p>
            </div>
            <div className="flex-1 min-h-0">
                <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                        <Pie
                            data={cryptoStats.allocationData}
                            cx="50%"
                            cy="50%"
                            innerRadius={55}
                            outerRadius={85}
                            paddingAngle={4}
                            dataKey="value"
                        >
                            {cryptoStats.allocationData.map((entry, index) => {
                                const dummyAcc = {
                                    id: entry.id,
                                    currency: entry.currency,
                                    name: entry.simpleName,
                                    type: entry.type
                                };
                                return <Cell key={`cell-${index}`} fill={getAccountColor(dummyAcc, index)} stroke="#fff" strokeWidth={2} />;
                            })}
                        </Pie>
                        <Tooltip 
                            formatter={(value, name) => [formatCurrency(value), name]} 
                            contentStyle={{ borderRadius: '12px', border: '1px solid #e2e8f0', backgroundColor: 'rgba(255,255,255,0.95)', backdropFilter: 'blur(8px)', boxShadow: '0 10px 25px -5px rgba(0,0,0,0.1)' }}
                        />
                        <Legend layout="vertical" verticalAlign="middle" align="right" wrapperStyle={{ fontSize: '11px', fontWeight: '500' }} />
                    </PieChart>
                </ResponsiveContainer>
            </div>
        </Card>
    );
}
