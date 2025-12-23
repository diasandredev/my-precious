import { useState, useRef, useEffect, useMemo } from 'react';
import {
    PieChart, Pie, Cell, Legend, Tooltip, ResponsiveContainer
} from 'recharts';
import { Card } from '../ui/Card';
import { ChevronDown } from 'lucide-react';
import { format, parseISO } from 'date-fns';
import { ptBR } from 'date-fns/locale';

export function DashboardExpensesBreakdown({ pieData, breakdownFilter, setBreakdownFilter, chartData, formatCurrency }) {
    const [isDropdownOpen, setIsDropdownOpen] = useState(false);
    const dropdownRef = useRef(null);

    // Close dropdown when clicking outside
    useEffect(() => {
        function handleClickOutside(event) {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
                setIsDropdownOpen(false);
            }
        }
        document.addEventListener("mousedown", handleClickOutside);
        return () => {
            document.removeEventListener("mousedown", handleClickOutside);
        };
    }, [dropdownRef]);

    // Group chartData by Year
    const monthOptions = useMemo(() => {
        if (!chartData) return [];

        const grouped = {};

        // Filter out future months if needed, or keep all? 
        // Sankey used transactions which are past/current usually. 
        // chartData has -11 to +6. Let's keep all for now as they might have projected expenses.

        chartData.forEach(m => {
            // m.fullDate is yyyy-MM
            const [year, month] = m.fullDate.split('-');
            const d = parseISO(m.fullDate);

            if (!grouped[year]) grouped[year] = [];
            grouped[year].push({
                value: m.fullDate,
                label: format(d, 'MMMM', { locale: ptBR }),
                isCurrent: m.isCurrent
            });
        });

        // Sort years descending
        return Object.entries(grouped)
            .sort(([yearA], [yearB]) => yearB - yearA)
            .map(([year, months]) => ({
                year,
                // Sort months descending? chartData is usually ascending.
                // Sankey sorted unique transactions descending.
                // Let's sort months descending to match Sankey style (Dec, Nov, Oct...)
                months: months.sort((a, b) => b.value.localeCompare(a.value))
            }));
    }, [chartData]);

    const selectedLabel = useMemo(() => {
        if (!breakdownFilter || breakdownFilter === 'ALL') return 'All Months';
        const d = parseISO(breakdownFilter);
        return format(d, "MMMM ' - ' yyyy", { locale: ptBR });
    }, [breakdownFilter]);

    return (
        <Card className="p-5 bg-white h-[400px] flex flex-col rounded-none shadow-none">
            <div className="flex justify-between items-center mb-2 shrink-0">
                <h4 className="text-sm font-bold text-gray-400 uppercase tracking-wider">Expenses Breakdown</h4>

                {/* Custom Selector */}
                <div className="relative" ref={dropdownRef}>
                    <button
                        onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                        className="flex items-center gap-2 border rounded-md px-3 py-1.5 text-sm bg-gray-50 text-gray-700 hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-indigo-500 capitalize min-w-[160px] justify-between"
                    >
                        <span>{selectedLabel}</span>
                        <ChevronDown className="w-4 h-4 text-gray-500" />
                    </button>

                    {isDropdownOpen && (
                        <div className="absolute right-0 top-full mt-1 w-[200px] max-h-[300px] overflow-y-auto bg-white border border-gray-200 rounded-lg shadow-xl z-50">
                            {/* Option for ALL - user didn't ask to remove it, but "default is current month" */}
                            <div
                                onClick={() => {
                                    setBreakdownFilter('ALL');
                                    setIsDropdownOpen(false);
                                }}
                                className={`px-3 py-2 text-sm cursor-pointer capitalize hover:bg-gray-50 transition-colors border-b border-gray-100 ${breakdownFilter === 'ALL' ? 'bg-indigo-50 text-indigo-700 font-medium' : 'text-gray-700'
                                    }`}
                            >
                                All Months
                            </div>

                            {monthOptions.map((group) => (
                                <div key={group.year}>
                                    <div className="sticky top-0 bg-gray-50 px-3 py-1.5 text-xs font-bold text-gray-500 border-b border-gray-100">
                                        {group.year}
                                    </div>
                                    <div>
                                        {group.months.map((opt) => (
                                            <div
                                                key={opt.value}
                                                onClick={() => {
                                                    setBreakdownFilter(opt.value);
                                                    setIsDropdownOpen(false);
                                                }}
                                                className={`px-3 py-2 text-sm cursor-pointer capitalize hover:bg-gray-50 transition-colors ${breakdownFilter === opt.value ? 'bg-indigo-50 text-indigo-700 font-medium' : 'text-gray-700'
                                                    }`}
                                            >
                                                {opt.label} {opt.isCurrent && <span className="text-xs text-indigo-500 ml-1">(Current)</span>}
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
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
