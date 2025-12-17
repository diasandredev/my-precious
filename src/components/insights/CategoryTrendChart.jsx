import { Bar, BarChart, ResponsiveContainer, XAxis, YAxis, Tooltip, CartesianGrid, Cell } from "recharts";

export function CategoryTrendChart({ data, formatCurrency }) {
    // data expected: array of { category: 'Food', current: 1200, previous: 1000 } or similar structure for simple bar comparison
    // OR array of top categories for current month

    if (!data || data.length === 0) {
        return <div className="h-[200px] flex items-center justify-center text-gray-400 text-sm">No data available</div>;
    }

    return (
        <div className="h-[300px] w-full">
            <ResponsiveContainer width="100%" height="100%">
                <BarChart data={data} layout="vertical" margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" horizontal={false} />
                    <XAxis type="number" hide />
                    <YAxis
                        dataKey="name"
                        type="category"
                        width={100}
                        tick={{ fontSize: 12 }}
                        interval={0}
                    />
                    <Tooltip
                        formatter={(value) => formatCurrency(value)}
                        contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}
                        cursor={{ fill: 'transparent' }}
                    />
                    <Bar dataKey="amount" radius={[0, 4, 4, 0]}>
                        {
                            data.map((entry, index) => (
                                <Cell key={`cell-${index}`} fill={entry.color || "#8884d8"} />
                            ))
                        }
                    </Bar>
                </BarChart>
            </ResponsiveContainer>
        </div>
    );
}
