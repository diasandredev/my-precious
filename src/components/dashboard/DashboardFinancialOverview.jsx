import {
    BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend
} from 'recharts';
import { Card } from '../ui/Card';

export function DashboardFinancialOverview({ chartData, pieData, breakdownFilter, setBreakdownFilter, categories, formatCurrency }) {
    return (
        <Card className="lg:col-span-2 p-6 bg-white min-h-[500px]">
            <div className="flex justify-between items-start mb-8">
                <div>
                    <h3 className="text-lg font-bold text-gray-900">
                        Financial Overview
                    </h3>
                    <p className="text-sm text-gray-400">Income vs Expenses (Past & Projected)</p>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 h-[400px]">
                {/* Stacked Bar Chart */}
                <div className="h-full">
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
                            <Legend
                                content={({ payload }) => (
                                    <div className="flex flex-wrap gap-4 mt-4 justify-center">
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
                            {/* Generate Bars for Categories */}
                            {(categories || [])
                                .filter(c => c.type === 'EXPENSE' || c.type === 'BOTH')
                                .map(cat => (
                                    <Bar
                                        key={cat.id}
                                        dataKey={cat.id}
                                        name={cat.name}
                                        stackId="expenses"
                                        fill={cat.color}
                                    />
                                ))
                            }
                            {/* Uncategorized expenses */}
                            <Bar dataKey="uncategorized" name="Uncategorized" stackId="expenses" fill="#9ca3af" />

                            {/* Income Bar (Single or Stacked? User said Income vs Expense stacked. Usually income is one block) */}
                            {/* Let's keep Income as a separate bar stack for comparison */}
                            {(categories || [])
                                .filter(c => c.type === 'INCOME')
                                .map(cat => (
                                    <Bar
                                        key={cat.id}
                                        dataKey={cat.id}
                                        name={cat.name}
                                        stackId="income"
                                        fill={cat.color}
                                    />
                                ))
                            }
                        </BarChart>
                    </ResponsiveContainer>
                </div>

                {/* Pie Chart */}
                <div className="h-full relative flex flex-col">
                    <div className="flex justify-between items-center mb-2">
                        <h4 className="text-sm font-bold text-gray-400 uppercase tracking-wider">Expenses Breakdown</h4>
                        <select
                            className="text-xs border rounded px-2 py-1 text-gray-600 bg-white shadow-sm focus:outline-none focus:ring-1 focus:ring-indigo-500"
                            value={breakdownFilter}
                            onChange={(e) => setBreakdownFilter(e.target.value)}
                        >
                            <option value="ALL">All Months</option>
                            {chartData.map(m => (
                                <option key={m.fullDate} value={m.fullDate}>
                                    {m.name} {m.isCurrent ? '(Current)' : ''}
                                </option>
                            ))}
                        </select>
                    </div>
                    <div className="flex-1 min-h-0">
                        <ResponsiveContainer width="100%" height="100%">
                            <PieChart>
                                <Pie
                                    data={pieData}
                                    cx="50%"
                                    cy="50%"
                                    innerRadius={60}
                                    outerRadius={80}
                                    paddingAngle={5}
                                    dataKey="value"
                                >
                                    {pieData.map((entry, index) => (
                                        <Cell key={`cell-${index}`} fill={entry.color} />
                                    ))}
                                </Pie>
                                <Tooltip
                                    formatter={(value) => formatCurrency(value)}
                                />
                                <Legend layout="vertical" align="right" verticalAlign="middle" wrapperStyle={{ fontSize: '12px' }} />
                            </PieChart>
                        </ResponsiveContainer>
                    </div>
                </div>
            </div>
        </Card >
    );
}
