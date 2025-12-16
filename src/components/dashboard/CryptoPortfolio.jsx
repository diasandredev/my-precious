import {
    AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend
} from 'recharts';
import { Card } from '../ui/Card';

export function CryptoPortfolio({ cryptoStats, formatCurrency, getAccountColor, data }) {
    if (cryptoStats.allocationData.length === 0) return null;

    return (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <Card className="lg:col-span-2 p-6 bg-white min-h-[350px]">
                <div className="flex justify-between items-center mb-6">
                    <h3 className="text-lg font-bold text-gray-900">Crypto Portfolio</h3>
                    <div className="text-right">
                        <p className="text-xs font-semibold text-gray-400 uppercase">Total Value</p>
                        <p className="text-xl font-bold font-mono text-gray-900">{formatCurrency(cryptoStats.totalBalance)}</p>
                    </div>
                </div>
                <div className="h-[250px]">
                    {/* Area Chart for Crypto Trend */}
                    <ResponsiveContainer width="100%" height="100%">
                        <AreaChart data={cryptoStats.evolutionData}>
                            <defs>
                                <linearGradient id="colorCrypto" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.1} />
                                    <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0} />
                                </linearGradient>
                            </defs>
                            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f3f4f6" />
                            <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#9ca3af' }} />
                            <YAxis hide domain={['auto', 'auto']} />
                            <Tooltip
                                contentStyle={{ borderRadius: '8px', border: '1px solid #f3f4f6', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
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
                                    fillOpacity={0.6}
                                />
                            ))}
                        </AreaChart>
                    </ResponsiveContainer>
                </div>
            </Card>

            <Card className="lg:col-span-1 p-6 bg-white min-h-[350px] flex flex-col">
                <h3 className="text-lg font-bold text-gray-900 mb-2">Crypto Allocation</h3>
                <div className="flex-1 min-h-0">
                    <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                            <Pie
                                data={cryptoStats.allocationData}
                                cx="50%"
                                cy="50%"
                                innerRadius={60}
                                outerRadius={80}
                                paddingAngle={5}
                                dataKey="value"
                            >
                                {cryptoStats.allocationData.map((entry, index) => {
                                    // Same dummy logic as AssetCharts
                                    const dummyAcc = {
                                        id: entry.id,
                                        currency: entry.currency,
                                        name: entry.simpleName,
                                        type: entry.type
                                    };
                                    return <Cell key={`cell-${index}`} fill={getAccountColor(dummyAcc, index)} />;
                                })}
                            </Pie>
                            <Tooltip formatter={(value, name) => [formatCurrency(value), name]} />
                            <Legend layout="vertical" verticalAlign="middle" align="right" wrapperStyle={{ fontSize: '11px' }} />
                        </PieChart>
                    </ResponsiveContainer>
                </div>
            </Card>
        </div>
    );
}
