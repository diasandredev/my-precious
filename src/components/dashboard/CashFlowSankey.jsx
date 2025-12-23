import { useState, useMemo, useEffect } from 'react';
import { ResponsiveContainer, Sankey, Tooltip, Rectangle, Layer } from 'recharts';
import { Card } from '../ui/Card';
import { format, startOfMonth, endOfMonth, isWithinInterval, parseISO } from 'date-fns';
import { ptBR } from 'date-fns/locale';

export function CashFlowSankey({ transactions, categories, formatCurrency }) {
    // Default to current month
    const [selectedMonth, setSelectedMonth] = useState(format(new Date(), 'yyyy-MM'));

    // Generate month options based on transactions
    const monthOptions = useMemo(() => {
        if (!transactions || transactions.length === 0) {
            // Fallback to current month if no data
            return [{
                value: format(new Date(), 'yyyy-MM'),
                label: format(new Date(), 'MMMM yyyy', { locale: ptBR })
            }];
        }

        const uniqueMonths = new Set();
        transactions.forEach(t => {
            if (t.date && t.status === 'CONFIRMED') {
                const d = parseISO(t.date);
                uniqueMonths.add(format(d, 'yyyy-MM'));
            }
        });

        // Convert to array and sort descending
        return Array.from(uniqueMonths)
            .sort((a, b) => b.localeCompare(a)) // Descending: 2025-12, 2025-11...
            .map(m => {
                const [year, month] = m.split('-');
                const d = new Date(parseInt(year), parseInt(month) - 1);
                return {
                    value: m,
                    label: format(d, 'MMMM yyyy', { locale: ptBR }) // e.g. "Dezembro 2025"
                };
            });
    }, [transactions]);

    // Sync selection with available options
    useEffect(() => {
        if (monthOptions.length > 0 && !monthOptions.find(o => o.value === selectedMonth)) {
            setSelectedMonth(monthOptions[0].value);
        }
    }, [monthOptions, selectedMonth]);

    const data = useMemo(() => {
        if (!transactions || !categories) return { nodes: [], links: [] };

        const [year, month] = selectedMonth.split('-');
        const startDate = startOfMonth(new Date(parseInt(year), parseInt(month) - 1));
        const endDate = endOfMonth(startDate);

        // 1. Filter Transactions
        const filtered = transactions.filter(t => {
            if (!t.date || t.status !== 'CONFIRMED') return false;
            const d = parseISO(t.date);
            return isWithinInterval(d, { start: startDate, end: endDate });
        });

        // 2. Aggregate Data
        const incomeMap = {};
        const expenseMap = {};
        let totalIncome = 0;
        let totalExpense = 0;

        filtered.forEach(t => {
            const cat = categories.find(c => c.id === t.categoryId);
            const catName = cat ? cat.name : 'Outros';
            const catColor = cat ? cat.color : '#9ca3af';
            const type = t.type || (cat ? cat.type : 'EXPENSE');

            if (type === 'INCOME') {
                // Use explicit Green for Income nodes to match reference
                if (!incomeMap[catName]) incomeMap[catName] = { val: 0, color: '#10b981' };
                incomeMap[catName].val += Number(t.amount);
                totalIncome += Number(t.amount);
            } else if (type === 'EXPENSE') {
                if (!expenseMap[catName]) expenseMap[catName] = { val: 0, color: catColor };
                expenseMap[catName].val += Number(t.amount);
                totalExpense += Number(t.amount);
            }
        });

        // 3. Construct Nodes & Links
        const nodes = [];
        const links = [];

        // Income Nodes (Sources)
        Object.entries(incomeMap).forEach(([name, { val, color }]) => {
            nodes.push({ name, color });
        });

        // Center Node
        const centerName = 'Fluxo de Caixa';
        const centerIndex = nodes.length;
        // Center color always Green to match "Money Stream" idea, or Red if absolute deficit?
        const balance = totalIncome - totalExpense;
        const centerColor = '#10b981'; // Fixed Green for central flow
        nodes.push({ name: centerName, color: centerColor });

        // Expense Nodes (Targets)
        const firstExpenseIndex = nodes.length;
        // Sort expenses by value for nicer look
        const sortedExpenses = Object.entries(expenseMap).sort((a, b) => b[1].val - a[1].val);

        sortedExpenses.forEach(([name, { val, color }]) => {
            nodes.push({ name, color });
        });

        // Surplus/Deficit
        let surplusIndex = -1;
        let deficitIndex = -1;

        if (totalIncome > totalExpense) {
            surplusIndex = nodes.length;
            nodes.push({ name: 'Sobrou', color: '#10b981' }); // Green
        } else if (totalExpense > totalIncome) {
            // Deficit as Source
            deficitIndex = nodes.length;
            nodes.push({ name: 'Retirado', color: '#f59e0b' }); // Orange/Red
        }

        // --- Links ---

        // --- Links ---

        // 1. Income -> Center
        // Use darker colors for better visibility
        Object.entries(incomeMap).forEach(([name, { val }], index) => {
            links.push({
                source: index,
                target: centerIndex,
                value: val,
                color: '#34d399' // Emerald 400
            });
        });

        // 1b. Deficit -> Center
        if (deficitIndex !== -1) {
            const deficitAmount = totalExpense - totalIncome;
            links.push({
                source: deficitIndex,
                target: centerIndex,
                value: deficitAmount,
                color: '#fbbf24' // Amber 400
            });
        }

        // 2. Center -> Expenses
        sortedExpenses.forEach(([name, info], i) => {
            links.push({
                source: centerIndex,
                target: firstExpenseIndex + i,
                value: info.val,
                color: '#f87171' // Red 400
            });
        });

        // 2b. Center -> Surplus
        if (surplusIndex !== -1) {
            const surplusAmount = totalIncome - totalExpense;
            links.push({
                source: centerIndex,
                target: surplusIndex,
                value: surplusAmount,
                color: '#34d399' // Emerald 400
            });
        }

        return { nodes, links };
    }, [transactions, categories, selectedMonth]);

    // Custom Node
    const MyCustomNode = ({ x, y, width, height, index, payload, containerWidth }) => {
        const isLeft = x < 100;
        const isCaixa = payload.name === 'Fluxo de Caixa';

        let textAnchor = 'start';
        let tx = x + width + 8;
        let ty = y + height / 2;

        if (isCaixa) {
            textAnchor = 'middle';
            tx = x + width / 2;
            ty = y - 25; // Keep high position
        } else if (!isLeft) {
            textAnchor = 'end';
            tx = x - 8;
        }

        return (
            <Layer key={`node-${index}`}>
                <Rectangle
                    x={x} y={y} width={width} height={height}
                    fill={payload.color || "#8884d8"}
                    fillOpacity="1"
                    radius={4}
                />

                {/* Labels */}
                {!isCaixa ? (
                    <text x={tx} y={ty} textAnchor={textAnchor} alignmentBaseline="middle">
                        <tspan x={tx} dy="-0.6em" fontSize={11} fontWeight="600" fill="#111827">{payload.name}</tspan>
                        <tspan x={tx} dy="1.2em" fontSize={10} fill="#6b7280">{formatCurrency(payload.value)}</tspan>
                    </text>
                ) : (
                    <text x={tx} y={ty} textAnchor="middle">
                        <tspan x={tx} dy="0" fontSize={12} fontWeight="bold" fill="#111827">{payload.name}</tspan>
                        <tspan x={tx} dy="1.2em" fontSize={11} fill="#6b7280">{formatCurrency(payload.value)}</tspan>
                    </text>
                )}
            </Layer>
        );
    };

    // Custom Link to use specific colors
    const DemoLink = (props) => {
        const { sourceX, sourceY, targetX, targetY, linkWidth, payload } = props;
        // Verify payload.color exists, else fallback
        const color = payload.color || '#9ca3af';

        // Calculate Bezier path for horizontal Sankey
        // Standard Sankey curvature
        const deltaX = targetX - sourceX;
        const curvature = 0.5;
        const x1 = sourceX + deltaX * curvature;
        const x2 = targetX - deltaX * curvature;

        const d = `
            M ${sourceX},${sourceY}
            C ${x1},${sourceY}
              ${x2},${targetY}
              ${targetX},${targetY}
        `;

        return (
            <path
                d={d}
                stroke={color}
                strokeWidth={Math.max(1, linkWidth)}
                fill="none"
                strokeOpacity={0.25} // More transparent
                style={{ transition: 'stroke-opacity 0.3s' }}
            />
        );
    };

    return (
        <Card className="col-span-1 lg:col-span-3 p-6 bg-white min-h-[500px] rounded-none shadow-none">
            <div className="flex justify-between items-center mb-6">
                <div>
                    <h3 className="text-lg font-bold text-gray-900">Fluxo de Caixa</h3>
                    <p className="text-sm text-gray-400">Entradas vs Saídas</p>
                </div>

                <select
                    className="border rounded-md px-3 py-1.5 text-sm bg-gray-50 text-gray-700 focus:ring-2 focus:ring-indigo-500 outline-none"
                    value={selectedMonth}
                    onChange={(e) => setSelectedMonth(e.target.value)}
                >
                    {monthOptions.map(opt => (
                        <option key={opt.value} value={opt.value}>
                            {opt.label}
                        </option>
                    ))}
                </select>
            </div>

            <div className="h-[500px] w-full">
                {data.nodes.length > 0 ? (
                    <ResponsiveContainer width="100%" height="100%">
                        <Sankey
                            data={data}
                            node={<MyCustomNode />}
                            link={<DemoLink />}
                            nodePadding={20}
                            nodeWidth={12}
                            margin={{ left: 20, right: 20, top: 40, bottom: 40 }}
                        >
                            <Tooltip content={({ active, payload }) => {
                                if (!active || !payload?.length) return null;
                                const item = payload[0];
                                const isLink = item.payload.source !== undefined;
                                if (isLink) return (
                                    <div className="bg-white p-2 border shadow-sm rounded text-xs">
                                        {item.payload.source.name} → {item.payload.target.name}: <b>{formatCurrency(item.value)}</b>
                                    </div>
                                );
                                return (
                                    <div className="bg-white p-2 border shadow-sm rounded text-xs">
                                        {item.payload.name}: <b>{formatCurrency(item.value)}</b>
                                    </div>
                                );
                            }} />
                        </Sankey>
                    </ResponsiveContainer>
                ) : (
                    <div className="flex items-center justify-center h-full text-gray-400">
                        Sem dados para este período
                    </div>
                )}
            </div>
        </Card>
    );
}
