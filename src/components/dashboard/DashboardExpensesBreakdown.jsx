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
        <Card className="p-6 bg-white min-h-[420px] flex flex-col rounded-2xl border border-slate-200/80 shadow-xs hover:shadow-md transition-all">
            <div className="flex justify-between items-center mb-4 shrink-0">
                <div>
                    <h4 className="text-base font-bold text-slate-900">Distribuição de Gastos</h4>
                    <p className="text-xs text-slate-400">Por categoria</p>
                </div>

                {/* Custom Selector */}
                <div className="relative" ref={dropdownRef}>
                    <button
                        onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                        className="flex items-center gap-2 border border-slate-200 rounded-xl px-3 py-1.5 text-xs font-semibold bg-slate-50 text-slate-700 hover:bg-slate-100 focus:outline-none focus:ring-2 focus:ring-slate-900 capitalize min-w-[140px] justify-between transition-all"
                    >
                        <span className="truncate">{selectedLabel}</span>
                        <ChevronDown className="w-3.5 h-3.5 text-slate-500 shrink-0" />
                    </button>

                    {isDropdownOpen && (
                        <div className="absolute right-0 top-full mt-1.5 w-[200px] max-h-[300px] overflow-y-auto bg-white border border-slate-200 rounded-xl shadow-xl z-50 p-1 custom-scrollbar">
                            <div
                                onClick={() => {
                                    setBreakdownFilter('ALL');
                                    setIsDropdownOpen(false);
                                }}
                                className={`px-3 py-2 text-xs rounded-lg cursor-pointer capitalize hover:bg-slate-50 transition-colors border-b border-slate-100 ${breakdownFilter === 'ALL' ? 'bg-slate-900 text-white font-semibold' : 'text-slate-700'
                                    }`}
                            >
                                Todos os Meses
                            </div>

                            {monthOptions.map((group) => (
                                <div key={group.year} className="my-1">
                                    <div className="sticky top-0 bg-slate-50 px-3 py-1 text-[10px] font-bold text-slate-400 uppercase tracking-wider rounded-md">
                                        {group.year}
                                    </div>
                                    <div className="space-y-0.5 mt-0.5">
                                        {group.months.map((opt) => (
                                            <div
                                                key={opt.value}
                                                onClick={() => {
                                                    setBreakdownFilter(opt.value);
                                                    setIsDropdownOpen(false);
                                                }}
                                                className={`px-3 py-1.5 text-xs rounded-lg cursor-pointer capitalize hover:bg-slate-100 transition-colors ${breakdownFilter === opt.value ? 'bg-slate-900 text-white font-semibold' : 'text-slate-700'
                                                    }`}
                                            >
                                                {opt.label} {opt.isCurrent && <span className="text-[10px] text-emerald-500 font-bold ml-1">• Atual</span>}
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
                            innerRadius={55}
                            outerRadius={85}
                            paddingAngle={4}
                            dataKey="value"
                        >
                            {pieData.map((entry, index) => (
                                <Cell key={`cell-${index}`} fill={entry.color} stroke="#fff" strokeWidth={2} />
                            ))}
                        </Pie>
                        <Tooltip
                            formatter={(value) => formatCurrency(value)}
                            contentStyle={{ borderRadius: '12px', border: '1px solid #e2e8f0', backgroundColor: 'rgba(255,255,255,0.95)', backdropFilter: 'blur(8px)', boxShadow: '0 10px 25px -5px rgba(0,0,0,0.1)' }}
                        />
                        <Legend layout="vertical" align="right" verticalAlign="middle" wrapperStyle={{ fontSize: '11px', fontWeight: '500' }} />
                    </PieChart>
                </ResponsiveContainer>
            </div>
        </Card>
    );
}
