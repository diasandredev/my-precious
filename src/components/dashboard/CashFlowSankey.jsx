import { useState, useMemo, useEffect, useRef } from 'react';
import { ResponsiveContainer, Sankey, Tooltip, Rectangle, Layer } from 'recharts';
import { Card } from '../ui/Card';
import { format, startOfMonth, endOfMonth, isWithinInterval, parseISO } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { ChevronDown } from 'lucide-react';

export function CashFlowSankey({ transactions, categories, formatCurrency }) {
    // Default to current month
    const [selectedMonth, setSelectedMonth] = useState(format(new Date(), 'yyyy-MM'));
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

    // Generate month options based on transactions
    const monthOptions = useMemo(() => {
        if (!transactions || transactions.length === 0) {
            // Fallback to current month if no data
            return [{
                year: format(new Date(), 'yyyy'),
                months: [{
                    value: format(new Date(), 'yyyy-MM'),
                    label: format(new Date(), 'MMMM', { locale: ptBR })
                }]
            }];
        }

        const uniqueMonths = new Set();
        transactions.forEach(t => {
            if (t.date && (t.status === 'CONFIRMED' || t.status === 'PROJECTED')) {
                const d = parseISO(t.date);
                uniqueMonths.add(format(d, 'yyyy-MM'));
            }
        });

        // Group by Year
        const grouped = {};

        Array.from(uniqueMonths)
            .sort((a, b) => b.localeCompare(a)) // Descending
            .forEach(m => {
                const [year, month] = m.split('-');
                const d = new Date(parseInt(year), parseInt(month) - 1);

                // Filter out future months (keep current month and past)
                const now = new Date();
                const currentMonthStart = startOfMonth(now);
                if (d > currentMonthStart) return;

                if (!grouped[year]) grouped[year] = [];
                grouped[year].push({
                    value: m,
                    label: format(d, 'MMMM', { locale: ptBR }) // Just month name for label
                });
            });

        // Convert to array of { year, months }
        return Object.entries(grouped)
            .sort(([yearA], [yearB]) => yearB - yearA) // Descending years
            .map(([year, months]) => ({
                year,
                months
            }));
    }, [transactions]);

    // Sync selection with available options
    // Sync selection with available options
    useEffect(() => {
        if (monthOptions.length > 0) {
            // Flatten options to check existence
            const allOptions = monthOptions.flatMap(g => g.months);
            if (!allOptions.find(o => o.value === selectedMonth)) {
                setSelectedMonth(allOptions[0].value);
            }
        }
    }, [monthOptions, selectedMonth]);

    const data = useMemo(() => {
        if (!transactions || !categories) return { nodes: [], links: [] };

        const [year, month] = selectedMonth.split('-');
        const startDate = startOfMonth(new Date(parseInt(year), parseInt(month) - 1));
        const endDate = endOfMonth(startDate);

        // 1. Filter Transactions (CONFIRMED + PROJECTED)
        const filtered = transactions.filter(t => {
            if (!t.date) return false;
            // Allow CONFIRMED and PROJECTED
            if (t.status !== 'CONFIRMED' && t.status !== 'PROJECTED') return false;
            const d = parseISO(t.date);
            return isWithinInterval(d, { start: startDate, end: endDate });
        });

        // 2. Aggregate Data
        // Structure: { [catName]: { confirmed: 0, projected: 0, color: ... } }
        const incomeMap = {};
        const expenseMap = {};

        let totalIncomeConfirmed = 0;
        let totalIncomeProjected = 0;
        let totalExpenseConfirmed = 0;
        let totalExpenseProjected = 0;

        filtered.forEach(t => {
            const cat = categories.find(c => c.id === t.categoryId);
            const catName = cat ? cat.name : 'Outros';
            const catColor = cat ? cat.color : '#9ca3af';
            const type = t.type || (cat ? cat.type : 'EXPENSE');
            const isProjected = t.status === 'PROJECTED';
            const amount = Number(t.amount);

            if (type === 'INCOME') {
                if (!incomeMap[catName]) incomeMap[catName] = { confirmed: 0, projected: 0, color: '#10b981' };
                if (isProjected) {
                    incomeMap[catName].projected += amount;
                    totalIncomeProjected += amount;
                } else {
                    incomeMap[catName].confirmed += amount;
                    totalIncomeConfirmed += amount;
                }
            } else if (type === 'EXPENSE') {
                if (!expenseMap[catName]) expenseMap[catName] = { confirmed: 0, projected: 0, color: catColor };
                if (isProjected) {
                    expenseMap[catName].projected += amount;
                    totalExpenseProjected += amount;
                } else {
                    expenseMap[catName].confirmed += amount;
                    totalExpenseConfirmed += amount;
                }
            }
        });

        const totalIncome = totalIncomeConfirmed + totalIncomeProjected;
        const totalExpense = totalExpenseConfirmed + totalExpenseProjected;

        // 3. Construct Nodes & Links
        const nodes = [];
        const links = [];

        // --- NODES ---
        // Nodes represent the TOTAL (Confirmed + Projected)

        // Income Nodes (Sources)
        // SPLIT INCOMES into Confirmed and Projected nodes
        Object.entries(incomeMap).forEach(([name, { confirmed, projected }]) => {
            // Confirmed Node
            if (confirmed > 0) {
                nodes.push({
                    name: name,
                    displayName: name,
                    color: '#10b981',
                    value: confirmed,
                    confirmed: confirmed,
                    projected: 0,
                    isProjectedNode: false
                });
            }
            // Projected Node
            if (projected > 0) {
                nodes.push({
                    name: `${name} (Proj)`,
                    displayName: name,
                    color: '#fbbf24',
                    value: projected,
                    confirmed: 0,
                    projected: projected,
                    isProjectedNode: true
                });
            }
        });

        // Center Node
        const centerName = 'Cash Flow';
        const centerIndex = nodes.length;
        // Center color
        const centerColor = '#10b981';
        nodes.push({ name: centerName, color: centerColor, value: totalIncome }); // Value here isn't strictly used for size by Recharts Sankey (it infers from links), but good for payload

        // Expense Nodes (Targets)
        const firstExpenseIndex = nodes.length;
        // Sort expenses by total value
        const sortedExpenses = Object.entries(expenseMap).sort((a, b) => (b[1].confirmed + b[1].projected) - (a[1].confirmed + a[1].projected));

        sortedExpenses.forEach(([name, { confirmed, projected, color }]) => {
            nodes.push({ name, color, value: confirmed + projected, confirmed, projected });
        });

        // Surplus/Deficit (Net Result)
        // We calculate Net based on TOTALs. 
        // If Income > Expense: Surplus.
        // If Expense > Income: Deficit.
        // Optional: Distinguish "Confirmed Surplus" vs "Projected Surplus"? 
        // Complexity: High. Let's keep Surplus/Deficit as a single aggregate node for simplicity, 
        // OR we try to flow "Projected Balance" separately. 
        // For now: Aggregate Surplus/Deficit.
        let surplusIndex = -1;
        let deficitIndex = -1;

        if (totalIncome > totalExpense) {
            surplusIndex = nodes.length;
            nodes.push({ name: 'Surplus', color: '#10b981', value: totalIncome - totalExpense });
        } else if (totalExpense > totalIncome) {
            deficitIndex = nodes.length;
            nodes.push({ name: 'Deficit', color: '#f59e0b', value: totalExpense - totalIncome });
        }

        // --- LINKS ---

        // Helper to add links
        // We add two links per category if both confirmed and projected exist
        // Source Index Mapping: 
        // Income Nodes: 0 to (centerIndex - 1)

        // 1. Income -> Center
        // 1. Income -> Center (Iterate through the split nodes we just created)
        for (let i = 0; i < centerIndex; i++) {
            const node = nodes[i];
            links.push({
                source: i,
                target: centerIndex,
                value: node.value,
                color: node.isProjectedNode ? '#fbbf24' : '#34d399',
                isProjected: node.isProjectedNode
            });
        }

        // 1b. Deficit -> Center (Treat as source of funds to balance equation? No, Deficit usually means we pulled from savings/credit)
        // In Sankey logic: Income + Deficit = Expenses + Surplus
        // We treat Deficit as an input to cover expenses.
        if (deficitIndex !== -1) {
            const deficitAmount = totalExpense - totalIncome;
            // Determining if deficit is confirmed or projected is tricky because it's a net result.
            // Simplified: If (Confirmed Exp > Confirmed Inc), we have Confirmed Deficit.
            // Remaining difference is Projected Deficit.

            const confirmedDeficit = Math.max(0, totalExpenseConfirmed - totalIncomeConfirmed);
            const totalDeficit = totalExpense - totalIncome; // (ExpC + ExpP) - (IncC + IncP)
            const projectedDeficit = Math.max(0, totalDeficit - confirmedDeficit);

            if (confirmedDeficit > 0) {
                links.push({
                    source: deficitIndex,
                    target: centerIndex,
                    value: confirmedDeficit,
                    color: '#fbbf24',
                    isProjected: false
                });
            }
            if (projectedDeficit > 0) {
                links.push({
                    source: deficitIndex,
                    target: centerIndex,
                    value: projectedDeficit,
                    color: '#fbbf24',
                    isProjected: true
                });
            }
        }

        // 2. Center -> Expenses
        sortedExpenses.forEach(([name, { confirmed, projected }], i) => {
            const targetIdx = firstExpenseIndex + i; // Correct target index

            if (confirmed > 0) {
                links.push({
                    source: centerIndex,
                    target: targetIdx,
                    value: confirmed,
                    color: '#f87171',
                    isProjected: false
                });
            }
            if (projected > 0) {
                links.push({
                    source: centerIndex,
                    target: targetIdx,
                    value: projected,
                    color: '#fbbf24',
                    isProjected: true
                });
            }
        });

        // 2b. Center -> Surplus
        // 2b. Center -> Surplus
        if (surplusIndex !== -1) {
            const surplusAmount = totalIncome - totalExpense;
            links.push({
                source: centerIndex,
                target: surplusIndex,
                value: surplusAmount,
                color: '#34d399',
                isProjected: false
            });
        }

        return { nodes, links };
    }, [transactions, categories, selectedMonth]);

    // Custom Node
    const MyCustomNode = ({ x, y, width, height, index, payload, containerWidth }) => {
        const isLeft = x < 100;
        const isCaixa = payload.name === 'Cash Flow';
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
            <Layer key={`node - ${index} `}>
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
                        <tspan x={tx} dy="1.2em" fontSize={10} fill="#6b7280">
                            {formatCurrency(payload.value)}
                            {(payload.projected > 0 && payload.confirmed > 0) ? ' (Mix)' : (payload.confirmed === 0 && payload.projected > 0 ? ' (Proj)' : '')}
                        </tspan>
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
        const color = payload.color || '#9ca3af';
        // Check for projected status (dashed)
        const isProjected = payload.isProjected;

        // Calculate Bezier path for horizontal Sankey
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
                strokeOpacity={isProjected ? 0.4 : 0.25} // Slightly more opaque for dashed to be visible? Or keep same.
                strokeDasharray={isProjected ? "4 4" : "0"}
                style={{ transition: 'stroke-opacity 0.3s' }}
            />
        );
    };

    // Get label for current selection
    const selectedDate = parseISO(selectedMonth);
    const selectedLabel = format(selectedDate, "MMMM ' - ' yyyy", { locale: ptBR });

    return (
        <Card className="col-span-1 lg:col-span-3 p-6 bg-white min-h-[500px] rounded-none shadow-none">
            <div className="flex justify-between items-center mb-6">
                <div>
                    <h3 className="text-lg font-bold text-gray-900">Cash Flow</h3>
                    <p className="text-sm text-gray-400">Incomes vs Expenses</p>
                </div>

                {/* Custom Month Selector */}
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
                                                    setSelectedMonth(opt.value);
                                                    setIsDropdownOpen(false);
                                                }}
                                                className={`px-3 py-2 text-sm cursor-pointer capitalize hover:bg-gray-50 transition-colors ${selectedMonth === opt.value ? 'bg-indigo-50 text-indigo-700 font-medium' : 'text-gray-700'
                                                    }`}
                                            >
                                                {opt.label}
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
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

                                if (isLink) {
                                    const { source, target, value, isProjected } = item.payload;
                                    return (
                                        <div className="bg-white p-2 border shadow-sm rounded text-xs">
                                            <div>{source.name} → {target.name}</div>
                                            <div className="font-bold">{formatCurrency(value)}</div>
                                            <div className={`uppercase text-[10px] tracking-wider font-semibold ${isProjected ? 'text-amber-500' : 'text-emerald-600'}`}>
                                                {isProjected ? 'Projected' : 'Confirmed'}
                                            </div>
                                        </div>
                                    );
                                }

                                // Node Tooltip
                                const { name, value, confirmed, projected } = item.payload;
                                return (
                                    <div className="bg-white p-2 border shadow-sm rounded text-xs min-w-[120px]">
                                        <div className="font-bold mb-1 border-b pb-1">{name}</div>
                                        <div className="flex justify-between gap-4 mb-1">
                                            <span>Total:</span>
                                            <span className="font-bold">{formatCurrency(value)}</span>
                                        </div>
                                        {confirmed !== undefined && (
                                            <>
                                                <div className="flex justify-between gap-4 text-emerald-600">
                                                    <span>Confirmed:</span>
                                                    <span>{formatCurrency(confirmed)}</span>
                                                </div>
                                                <div className="flex justify-between gap-4 text-amber-500">
                                                    <span>Projected:</span>
                                                    <span>{formatCurrency(projected)}</span>
                                                </div>
                                            </>
                                        )}
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
