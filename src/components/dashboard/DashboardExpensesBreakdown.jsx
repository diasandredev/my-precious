import {
    PieChart, Pie, Cell, Legend, Tooltip, ResponsiveContainer
} from 'recharts';
import { Card } from '../ui/Card';

export function DashboardExpensesBreakdown({ pieData, breakdownFilter, setBreakdownFilter, chartData, formatCurrency }) {
    return (
        <Card className="p-5 bg-white h-[400px] flex flex-col rounded-none shadow-none">
            <div className="flex justify-between items-center mb-2 shrink-0">
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
        </Card>
    );
}
