import { useState, useMemo, useEffect } from 'react';
import { ResponsiveContainer, Sankey, Tooltip, Rectangle, Layer } from 'recharts';
import { Card } from '../ui/Card';
import { format, startOfMonth, endOfMonth, isWithinInterval, parseISO, subMonths } from 'date-fns';
import { ptBR } from 'date-fns/locale';

export function CashFlowSankey({ transactions, categories, formatCurrency }) {
    // Default to current month
    const [selectedMonth, setSelectedMonth] = useState(format(new Date(), 'yyyy-MM'));

    // Auto-select latest valid month if current selection becomes invalid
    // (e.g. initially current month, but maybe no data for it yet)
    // Actually, user might want to see "Empty" current month. 
    // But request was "Only show months with data". 
    // So if current month has NO data, it won't be in options, so we must switch.


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
            if (!t.date || t.status !== 'CONFIRMED') return false; // Only confirmed? Or pending too? User usually wants cashflow of actual money or projected? Image implies analyzing past/current. Let's strictly use CONFIRMED for actual cashflow, or maybe all active if looking at current month. Let's match other charts: ALL for now, or check status. 
            // In DashboardFinancialOverview, we use all. Let's use all valid transactions.
            const d = parseISO(t.date);
            return isWithinInterval(d, { start: startDate, end: endDate });
        });

        // 2. Aggregate Data
        const incomeMap = {};
        const expenseMap = {};
        let totalIncome = 0;
        let totalExpense = 0;

        filtered.forEach(t => {
            // Find category
            const cat = categories.find(c => c.id === t.categoryId);
            const catName = cat ? cat.name : 'Outros';
            const catColor = cat ? cat.color : '#9ca3af';

            // Check type (explicit or by category)
            // Some transactions might not have type if they are legacy, rely on category type
            const type = t.type || (cat ? cat.type : 'EXPENSE');

            if (type === 'INCOME') {
                if (!incomeMap[catName]) incomeMap[catName] = { val: 0, color: catColor };
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

        // --- Nodes ---
        // Helper to get index
        const getNodeIndex = (name) => {
            let idx = nodes.findIndex(n => n.name === name);
            if (idx === -1) {
                idx = nodes.length;
                nodes.push({ name }); // Color?
            }
            return idx;
        };

        // Center Node
        const centerName = 'Caixa';
        // const centerIdx = getNodeIndex(centerName); // We'll add it, but index depends on order.
        // Recharts Sankey is sensitive to order. Usually: Sources -> Center -> Targets.

        // Income Nodes (Sources)
        Object.entries(incomeMap).forEach(([name, { val, color }]) => {
            nodes.push({ name, color });
        });

        // Center Node (Middle)
        const centerIndex = nodes.length;
        // Color depends on Surplus/Deficit? Or neutral.
        const balance = totalIncome - totalExpense;
        const centerColor = balance >= 0 ? '#10b981' : '#ef4444'; // Green or Red
        nodes.push({ name: centerName, color: centerColor });

        // Expense Nodes (Targets)
        const firstExpenseIndex = nodes.length;
        Object.entries(expenseMap).forEach(([name, { val, color }]) => {
            nodes.push({ name, color });
        });

        // Special Nodes for Surplus/Deficit
        // If Income > Expenses: Surplus node (Target)
        // If Expenses > Income: Deficit/Savings node (Source) - Wait, Sankey needs flow conservation.
        //   If In < Out, we need an extra Source "Poupança/Reserva" flowing into Center.

        let surplusIndex = -1;
        let deficitIndex = -1;

        if (totalIncome > totalExpense) {
            surplusIndex = nodes.length;
            nodes.push({ name: 'Sobrou', color: '#10b981' });
        } else if (totalExpense > totalIncome) {
            // Need a source node for deficit to balance the center
            // "Retirado da Poupança" or "Deficit"
            // Ensure this is treated as a SOURCE in the list order? 
            // Recharts Sankey uses the link logic to determine flow direction, but usually nicer to handle index order.
            // Let's add it at start or handle logic.
            // Actually, simply adding it to nodes is enough, links define structure.
            deficitIndex = nodes.length;
            nodes.push({ name: 'Retirado da Poupança', color: '#f59e0b' });
        }


        // --- Links ---

        // 1. Income -> Center
        Object.entries(incomeMap).forEach(([name, { val }], index) => {
            links.push({
                source: index, // Income nodes are 0 to (centerIndex-1)
                target: centerIndex,
                value: val
            });
        });

        // 1b. Deficit used (Source) -> Center
        if (deficitIndex !== -1) {
            const deficitAmount = totalExpense - totalIncome;
            links.push({
                source: deficitIndex,
                target: centerIndex,
                value: deficitAmount
            });
        }

        // 2. Center -> Expenses
        Object.keys(expenseMap).forEach((name, i) => {
            links.push({
                source: centerIndex,
                target: firstExpenseIndex + i,
                value: expenseMap[name].val
            });
        });

        // 2b. Center -> Surplus
        if (surplusIndex !== -1) {
            const surplusAmount = totalIncome - totalExpense;
            links.push({
                source: centerIndex,
                target: surplusIndex,
                value: surplusAmount
            });
        }

        return { nodes, links };
    }, [transactions, categories, selectedMonth]);


    // Custom Tooltip
    const CustomTooltip = ({ active, payload }) => {
        if (!active || !payload || !payload.length) return null;
        const data = payload[0];
        const isLink = data.payload.source !== undefined;

        if (isLink) {
            const sourceName = data.payload.source.name;
            const targetName = data.payload.target.name;
            return (
                <div className="bg-white p-3 shadow-xl rounded-lg border border-gray-100 z-50">
                    <p className="text-sm font-medium text-gray-900">
                        {sourceName} → {targetName}
                    </p>
                    <p className="text-sm font-bold text-indigo-600">
                        {formatCurrency(data.value)}
                    </p>
                </div>
            );
        }

        // Node Tooltip
        return (
            <div className="bg-white p-3 shadow-xl rounded-lg border border-gray-100 z-50">
                <p className="text-sm font-bold text-gray-900">{data.payload.name}</p>
                <p className="text-sm font-medium text-gray-500">
                    {formatCurrency(data.value)}
                </p>
            </div>
        );
    };

    // Custom Node Rendering to add Text labels properly? 
    // Recharts Sankey default labels are okay, but maybe we want custom colors.
    // The "node" prop can be a custom component.
    const MyCustomNode = ({ x, y, width, height, index, payload, containerWidth }) => {
        // Heuristic: If x is small (left side), text on right.
        // If x is in middle (center), text centered above? Or right.
        // If x is large (right side), text on left.

        // Simple check: Is it in the first 20% of the canvas?
        const isLeft = x < 100; // Assuming canvas > 200
        // Is it in the last 20%? or just Not Left. 
        // Middle node (Caixa) is around x = width/2.
        // Let's treat Middle and Right as "Text Left" or "Text Above"?
        // Usually Center: Text Above. Right: Text Left.

        // Let's refine based on "Layer". We know Source=0, Center=1, Target=2 usually.
        // But we don't have layer easily.

        // Let's stick to: Left -> Start, Right -> End. 
        // For Center (around mid), if we use "End", it puts text on Left (inside incoming links area). 
        // If we use "Start", it puts text on Right (inside outgoing link area).
        // Text ABOVE is safest for Center.

        const isCenter = !isLeft && (containerWidth ? x < containerWidth - 100 : x < 500); // Rough check
        // Actually, easiest: name === 'Caixa'
        const isCaixa = payload.name === 'Caixa';

        let textAnchor = 'start';
        let tx = x + width + 6;
        let ty = y + height / 2;

        if (isCaixa) {
            textAnchor = 'middle';
            tx = x + width / 2;
            ty = y - 10; // Above
        } else if (!isLeft) {
            textAnchor = 'end';
            tx = x - 6;
        }

        return (
            <Layer key={`node-${index}`}>
                <Rectangle
                    x={x} y={y} width={width} height={height}
                    fill={payload.color || "#8884d8"}
                    fillOpacity="1"
                    radius={4}
                />
                <text
                    x={tx}
                    y={ty}
                    textAnchor={textAnchor}
                    alignmentBaseline="middle"
                    fill="#374151"
                    fontSize={12}
                    fontWeight="500"
                >
                    {payload.name} ({formatCurrency(payload.value)})
                </text>
            </Layer>
        );
    };


    return (
        <Card className="col-span-1 lg:col-span-3 p-6 bg-white min-h-[500px]">
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

            <div className="h-[400px] w-full">
                {data.nodes.length > 0 ? (
                    <ResponsiveContainer width="100%" height="100%">
                        <Sankey
                            data={data}
                            node={<MyCustomNode />}
                            nodePadding={20}
                            margin={{ left: 10, right: 10, top: 20, bottom: 20 }}
                            link={{ stroke: '#94a3b8', strokeOpacity: 0.4, fill: 'none' }}
                        >
                            <Tooltip content={<CustomTooltip />} />
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
