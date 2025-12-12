import { useMemo, useState } from 'react';
import { format, addMonths, subMonths, startOfMonth, endOfMonth, isSameMonth, isAfter, isBefore, parseISO } from 'date-fns';
import {
    AreaChart, Area, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell, Legend, PieChart, Pie
} from 'recharts';
import { ArrowUpRight, ArrowDownRight, Search, MoreHorizontal, TrendingUp, TrendingDown, Filter } from 'lucide-react';
import { useData } from '../../contexts/DataContext';
import { cn } from '../../lib/utils';

export function DashboardTab() {
    const { data, formatCurrency } = useData();
    const [breakdownFilter, setBreakdownFilter] = useState('ALL');

    // --- Derived Data Calculations ---

    // 1. Total Net Worth & Trend
    const netWorthStats = useMemo(() => {
        // Sort snapshots by date desc
        const sortedSnapshots = [...data.snapshots].sort((a, b) => new Date(b.date) - new Date(a.date));

        const getSnapshotTotal = (snapshot) => {
            if (!snapshot) return 0;
            return Object.entries(snapshot.balances).reduce((total, [accId, bal]) => {
                const acc = data.accounts.find(a => a.id === accId);
                let rate = 1;
                const currency = acc?.currency || 'BRL';
                if (acc && currency !== 'BRL') {
                    // Use rates from snapshot, or 0 if missing (conservative)
                    rate = snapshot.rates?.[currency] || 0;
                }
                return total + (bal * rate);
            }, 0);
        };

        const currentSnapshot = sortedSnapshots[0];
        const currentTotal = getSnapshotTotal(currentSnapshot);

        // Find last month's snapshot (approx)
        const lastMonthDate = subMonths(new Date(), 1);
        const prevSnapshot = sortedSnapshots.find(s => isBefore(new Date(s.date), startOfMonth(new Date())));

        const prevTotal = getSnapshotTotal(prevSnapshot);

        const diff = currentTotal - prevTotal;
        const percentChange = prevTotal !== 0 ? (diff / prevTotal) * 100 : 0;

        return { currentTotal, percentChange, diff };
    }, [data.snapshots, data.accounts]);

    // 1.5 Assets by Currency
    const assetsByCurrency = useMemo(() => {
        const sortedSnapshots = [...data.snapshots].sort((a, b) => new Date(b.date) - new Date(a.date));
        const currentSnapshot = sortedSnapshots[0];
        // Even if no snapshot, we want to show the cards with 0
        const balances = currentSnapshot ? currentSnapshot.balances : {};

        const totals = { BRL: 0, USD: 0, EUR: 0 };

        Object.entries(balances).forEach(([accId, bal]) => {
            const acc = data.accounts.find(a => a.id === accId);
            if (acc) {
                const currency = acc.currency || 'BRL';
                if (totals[currency] !== undefined) {
                    totals[currency] += bal;
                }
            }
        });

        // Always return BRL, USD, EUR
        return ['BRL', 'USD', 'EUR'].map(curr => ({
            currency: curr,
            amount: totals[curr] || 0,
            symbol: curr === 'BRL' ? 'R$' : (curr === 'USD' ? '$' : '€')
        }));
    }, [data.snapshots, data.accounts]);

    // Helper for consistent colors
    const getAccountColor = (account, index) => {
        // Specific colors for known currencies
        if (account.currency === 'BTC') return '#190E4F';
        if (account.currency === 'ETH') return '#e66eacff';
        if (account.currency === 'BNB') return '#f0d14bff';
        if (account.currency === 'XRP') return '#49D49F';

        // Specific colors for known Banks/Services (Case insensitive check)
        const name = account.name.toLowerCase();
        if (name.includes('nubank')) return '#715892ff';
        if (name.includes('wise')) return '#66B783';
        if (name.includes('itau') || name.includes('itaú')) return '#F68A3C';
        if (name.includes('xp')) return '#ec6462ff';
        if (name.includes('nomad')) return '#EEB044';
        if (name.includes('c6')) return '#33658A';
        // Refined Fallback palette - drastically different hues
        const colors = [
            '#0ea5e9', // Sky 500 (Blue)
            '#22c55e', // Green 500
            '#ef4444', // Red 500
            '#eab308', // Yellow 500
            '#a855f7', // Purple 500
            '#ec4899', // Pink 500
            '#f97316', // Orange 500
            '#14b8a6', // Teal 500
            '#6366f1', // Indigo 500
            '#84cc16', // Lime 500
            '#f43f5e', // Rose 500
            '#06b6d4', // Cyan 500
            '#d946ef', // Fuchsia 500
            '#64748b', // Slate 500
        ];
        return colors[index % colors.length];
    };

    // 1.6 Asset Evolution & Allocation Data (General & Crypto)
    const { evolutionData, allocationData, cryptoStats } = useMemo(() => {
        const sortedSnapshots = [...data.snapshots].sort((a, b) => new Date(a.date) - new Date(b.date)); // ASC for chart

        // Helper to check if is crypto
        const isCrypto = (acc) => ['BTC', 'ETH', 'BNB', 'XRP'].includes(acc.currency) || acc.type === 'Crypto';

        // --- Evolution (Stacked Bar) ---
        const evoData = sortedSnapshots.map(snap => {
            const point = {
                date: snap.date,
                name: format(parseISO(snap.date), 'MMM yy'),
                fullDate: snap.date
            };
            const cryptoPoint = { ...point }; // For crypto only chart

            data.accounts.forEach(acc => {
                const bal = snap.balances[acc.id] || 0;
                let rate = 1;
                if (acc.currency !== 'BRL') {
                    rate = snap.rates?.[acc.currency] || 0;
                }
                const valueBRL = bal * rate;
                point[acc.id] = valueBRL;

                if (isCrypto(acc)) {
                    cryptoPoint[acc.id] = valueBRL;
                }
            });
            return { general: point, crypto: cryptoPoint };
        });

        // Separate arrays for charting
        const generalEvoData = evoData.map(d => d.general);
        const cryptoEvoData = evoData.map(d => d.crypto);

        // --- Allocation (Donut) ---
        const latestInfo = generalEvoData[generalEvoData.length - 1] || {};

        let allocData = [];
        let cryptoAllocData = [];
        let cryptoTotal = 0;

        if (latestInfo) {
            allocData = data.accounts.map(acc => {
                const val = latestInfo[acc.id] || 0;
                const isC = isCrypto(acc);
                if (isC) cryptoTotal += val;

                const item = {
                    name: `${acc.name} (${acc.currency || 'BRL'})`,
                    simpleName: acc.name,
                    value: val,
                    currency: acc.currency,
                    id: acc.id,
                    type: acc.type
                };

                if (isC && val > 0) cryptoAllocData.push(item);

                return item;
            }).filter(d => d.value > 0);
        }

        return {
            evolutionData: generalEvoData,
            allocationData: allocData,
            cryptoStats: {
                evolutionData: cryptoEvoData,
                allocationData: cryptoAllocData,
                totalBalance: cryptoTotal
            }
        };
    }, [data.snapshots, data.accounts]);

    // Sort accounts by latest balance for the Asset Evolution chart
    const sortedAccounts = useMemo(() => {
        if (!evolutionData || evolutionData.length === 0) return data.accounts;
        const latestPoint = evolutionData[evolutionData.length - 1] || {};

        return [...data.accounts].sort((a, b) => {
            const valA = latestPoint[a.id] || 0;
            const valB = latestPoint[b.id] || 0;
            return valB - valA; // Descending
        });
    }, [data.accounts, evolutionData]);


    // 2. Chart Data (2 months back + Current + 6 months forward) & Pie Data
    const { chartData, pieData } = useMemo(() => {
        const currentDate = new Date();
        const months = [];
        const filteredExpenses = {}; // for pie chart

        // Default categories map for easy lookup
        const cats = data.categories || [];
        const getCat = (id) => cats.find(c => c.id === id) || { name: 'Uncategorized', color: '#9ca3af', type: 'EXPENSE' };

        // Generate range: -2 to +6
        for (let i = -2; i <= 6; i++) {
            const d = addMonths(currentDate, i);
            months.push({
                date: d,
                name: format(d, 'MMM'),
                fullDate: format(d, 'yyyy-MM'), // Format matches default select values usually
                expense: 0,
                income: 0,
                isFuture: i > 0,
                isCurrent: i === 0
            });
        }

        // Helper to add to pie if matches filter
        const addToPie = (monthData, catId, amount) => {
            const isMatch = breakdownFilter === 'ALL' || monthData.fullDate === breakdownFilter;
            if (isMatch) {
                if (!filteredExpenses[catId]) filteredExpenses[catId] = 0;
                filteredExpenses[catId] += amount;
            }
        };

        // Fill Past & Current from Transactions
        data.transactions.forEach(t => {
            const tDate = new Date(t.date);
            const monthData = months.find(m => isSameMonth(tDate, m.date));
            if (monthData) {
                if (t.type === 'EXPENSE') {
                    monthData.expense += t.amount;
                    // Add to category bucket
                    const catId = t.categoryId || 'uncategorized';
                    if (!monthData[catId]) monthData[catId] = 0;
                    monthData[catId] += t.amount;

                    addToPie(monthData, catId, t.amount);

                } else if (t.type === 'INCOME') {
                    monthData.income += t.amount;
                    // Add to category bucket (if we stack income too)
                    const catId = t.categoryId || 'uncategorized';
                    if (!monthData[catId]) monthData[catId] = 0;
                    monthData[catId] += t.amount;
                }
            }
        });

        // Fill Future from Fixed Items (Projections)
        if (data.fixedItems) {
            data.fixedItems.forEach(item => {
                months.filter(m => m.isFuture).forEach(m => {
                    if (item.type === 'EXPENSE') {
                        m.expense += item.amount;
                        const catId = item.categoryId || 'uncategorized';
                        if (!m[catId]) m[catId] = 0;
                        m[catId] += item.amount;

                        addToPie(m, catId, item.amount);

                    } else if (item.type === 'INCOME') {
                        m.income += item.amount;
                        const catId = item.categoryId || 'uncategorized';
                        if (!m[catId]) m[catId] = 0;
                        m[catId] += item.amount;
                    }
                });
            });
        }

        return {
            chartData: months,
            pieData: Object.entries(filteredExpenses).map(([catId, amount]) => {
                const cat = getCat(catId);
                return { name: cat.name, value: amount, color: cat.color };
            })
        };
    }, [data.transactions, data.fixedItems, data.categories, breakdownFilter]);

    // 3. Projected Net Worth (Current + Future)
    const projectionData = useMemo(() => {
        const currentTotal = netWorthStats.currentTotal;
        let runningBalance = currentTotal;

        const futureMonths = chartData.filter(d => d.isCurrent || d.isFuture);

        return futureMonths.map((month, index) => {
            if (index === 0) {
                return { ...month, accumulatedBalance: currentTotal };
            }
            const netFlow = month.income - month.expense;
            runningBalance += netFlow;
            return {
                ...month,
                accumulatedBalance: runningBalance
            };
        });
    }, [chartData, netWorthStats.currentTotal]);

    // 4. Total Spendings (Current Month)
    const currentMonthMetrics = useMemo(() => {
        const current = chartData.find(d => d.isCurrent);
        return current || { expense: 0, income: 0 };
    }, [chartData]);



    return (
        <div className="space-y-6">

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">

                {/* Total Spendings (Current Month) */}
                <Card className="p-6 relative overflow-hidden bg-white">
                    <div className="flex justify-between items-start mb-4">
                        <div>
                            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Total Spendings</p>
                            <div className="flex items-baseline gap-2 mt-1">
                                <h3 className="text-2xl font-bold text-gray-900">
                                    {formatCurrency(currentMonthMetrics.expense)}
                                </h3>
                            </div>
                            <p className="text-xs text-gray-400 mt-1">in {format(new Date(), 'MMMM')}</p>
                        </div>
                    </div>
                </Card>

                {/* Income / Savings */}
                <Card className="p-6 bg-white">
                    <div className="flex justify-between items-start mb-4">
                        <div>
                            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Total Income</p>
                            <div className="flex items-baseline gap-2 mt-1">
                                <h3 className="text-2xl font-bold text-gray-900">
                                    {formatCurrency(currentMonthMetrics.income)}
                                </h3>
                            </div>
                            <p className="text-xs text-gray-400 mt-1">in {format(new Date(), 'MMMM')}</p>
                        </div>
                    </div>
                </Card>

                {/* Total Net Worth Trend */}
                <Card className="p-6 bg-white">
                    <div className="flex justify-between items-start mb-2">
                        <div>
                            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Total Net Worth</p>
                            <div className="flex items-baseline gap-2 mt-1">
                                <h3 className="text-2xl font-bold text-gray-900">
                                    {formatCurrency(netWorthStats.currentTotal)}
                                </h3>
                                <span className={cn(
                                    "text-xs font-medium px-1.5 py-0.5 rounded flex items-center gap-1",
                                    netWorthStats.percentChange >= 0 ? "text-emerald-500 bg-emerald-50" : "text-red-500 bg-red-50"
                                )}>
                                    {netWorthStats.percentChange >= 0 ? <TrendingUp size={12} /> : <TrendingDown size={12} />}
                                    {Math.abs(netWorthStats.percentChange).toFixed(1)}%
                                </span>
                            </div>
                            <p className="text-xs text-gray-400 mt-1">vs last month</p>
                        </div>
                    </div>
                </Card>

            </div>

            {/* Assets by Currency */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
                {assetsByCurrency.map(item => (
                    <Card key={item.currency} className="p-6 bg-white flex items-center gap-4">
                        <div className={cn("w-12 h-12 rounded-full flex items-center justify-center text-xl font-bold",
                            item.currency === 'BRL' ? "bg-green-100 text-green-700" :
                                item.currency === 'USD' ? "bg-blue-100 text-blue-700" : "bg-purple-100 text-purple-700"
                        )}>
                            {item.symbol}
                        </div>
                        <div>
                            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider">{item.currency} Total</p>
                            <h3 className="text-xl font-bold text-gray-900">
                                {item.symbol} {item.amount.toLocaleString(item.currency === 'BRL' ? 'pt-BR' : 'en-US', { minimumFractionDigits: 2 })}
                            </h3>
                        </div>
                    </Card>
                ))}
            </div>

            {/* Asset Evolution & Allocation */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Stacked Area/Bar Chart - Evolution */}
                <Card className="lg:col-span-2 p-6 bg-white min-h-[400px]">
                    <h3 className="text-lg font-bold text-gray-900 mb-6">Asset Evolution (BRL)</h3>
                    <div className="h-[320px]">
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={evolutionData}>
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
                                    tickFormatter={(value) => `R$${value / 1000}k`}
                                />
                                <Tooltip
                                    cursor={{ fill: 'rgba(0,0,0,0.05)' }}
                                    content={({ active, payload, label }) => {
                                        if (active && payload && payload.length) {
                                            // Sort by value descending
                                            const sortedPayload = [...payload].sort((a, b) => b.value - a.value);

                                            return (
                                                <div className="bg-white p-3 shadow-xl rounded-lg border border-gray-100 z-50">
                                                    <p className="text-xs text-gray-500 mb-2 font-bold uppercase">{label}</p>
                                                    {sortedPayload.map((p, i) => (
                                                        <div key={i} className="flex justify-between gap-4 text-sm mb-1">
                                                            <span className="font-medium" style={{ color: p.color }}>{p.name}:</span>
                                                            <span className="font-mono text-gray-600">
                                                                {formatCurrency(p.value)}
                                                            </span>
                                                        </div>
                                                    ))}
                                                    <div className="mt-2 pt-2 border-t border-gray-100 flex justify-between gap-4">
                                                        <span className="font-bold text-gray-900">Total:</span>
                                                        <span className="font-bold font-mono text-gray-900">
                                                            {formatCurrency(payload.reduce((sum, p) => sum + p.value, 0))}
                                                        </span>
                                                    </div>
                                                </div>
                                            );
                                        }
                                        return null;
                                    }}
                                />
                                <Legend
                                    content={({ payload }) => (
                                        <div className="flex flex-wrap gap-4 mt-6 justify-center">
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
                                {sortedAccounts.map((acc, index) => (
                                    <Bar
                                        key={acc.id}
                                        dataKey={acc.id}
                                        name={`${acc.name} (${acc.currency || 'BRL'})`}
                                        stackId="a"
                                        fill={getAccountColor(acc, index)}
                                    />
                                ))}
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </Card>

                {/* Donut Chart - Current Allocation */}
                <Card className="lg:col-span-1 p-6 bg-white min-h-[400px] flex flex-col">
                    <h3 className="text-lg font-bold text-gray-900 mb-2">Asset Allocation</h3>
                    <p className="text-xs text-gray-400 mb-6">Current distribution (BRL Eq.)</p>
                    <div className="flex-1 min-h-0">
                        <ResponsiveContainer width="100%" height="100%">
                            <PieChart>
                                <Pie
                                    data={allocationData}
                                    cx="50%"
                                    cy="50%"
                                    innerRadius={60}
                                    outerRadius={80}
                                    paddingAngle={2}
                                    dataKey="value"
                                >
                                    {allocationData.map((entry, index) => {
                                        const acc = data.accounts.find(a => a.id === entry.id);
                                        return <Cell key={`cell-${index}`} fill={getAccountColor(acc, index)} />;
                                    })}
                                </Pie>
                                <Tooltip
                                    formatter={(value, name, props) => [formatCurrency(value), name]}
                                />
                                <Legend layout="vertical" verticalAlign="middle" align="right" wrapperStyle={{ fontSize: '11px', maxWidth: '120px' }} />
                            </PieChart>
                        </ResponsiveContainer>
                    </div>
                </Card>
            </div>

            {/* Crypto Portfolio Section */}
            {
                cryptoStats.allocationData.length > 0 && (
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
                                                const acc = data.accounts.find(a => a.id === entry.id);
                                                return <Cell key={`cell-${index}`} fill={getAccountColor(acc, index)} />;
                                            })}
                                        </Pie>
                                        <Tooltip formatter={(value, name) => [formatCurrency(value), name]} />
                                        <Legend layout="vertical" verticalAlign="middle" align="right" wrapperStyle={{ fontSize: '11px' }} />
                                    </PieChart>
                                </ResponsiveContainer>
                            </div>
                        </Card>
                    </div>
                )
            }



            {/* Bottom Section */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

                {/* Transactions List */}
                <Card className="lg:col-span-1 p-6 bg-white space-y-6 max-h-[500px] overflow-y-auto">
                    <div className="flex items-center justify-between">
                        <h3 className="text-lg font-bold text-gray-900">Transactions</h3>
                        <p className="text-xs text-gray-400">Recent</p>
                    </div>

                    <div className="space-y-6">
                        <TransactionList transactions={data.transactions} formatCurrency={formatCurrency} />
                    </div>
                </Card>

                {/* Main Chart (Income vs Expense) & Pie Chart */}
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
                                    {(data.categories || [])
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
                                    {(data.categories || [])
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
            </div >
        </div >
    );
}

function Card({ children, className }) {
    return <div className={cn("rounded-2xl border border-gray-100 shadow-sm", className)}>{children}</div>;
}

function TransactionList({ transactions, formatCurrency }) {
    if (!transactions || transactions.length === 0) {
        return <p className="text-sm text-gray-400">No recent transactions.</p>;
    }

    // Sort by date desc
    const sorted = [...transactions].sort((a, b) => new Date(b.date) - new Date(a.date));

    // Group by Today, Yesterday, Date
    const grouped = sorted.reduce((acc, t) => {
        const d = new Date(t.date);
        const today = new Date();
        const yesterday = new Date();
        yesterday.setDate(yesterday.getDate() - 1);

        let key = format(d, 'MMM d');
        if (d.toDateString() === today.toDateString()) key = 'TODAY';
        else if (d.toDateString() === yesterday.toDateString()) key = 'YESTERDAY';

        if (!acc[key]) acc[key] = [];
        acc[key].push(t);
        return acc;
    }, {});

    return Object.entries(grouped).map(([label, items]) => (
        <div key={label}>
            <div className="text-xs font-semibold text-gray-400 uppercase mb-3">{label}</div>
            <div className="space-y-4">
                {items.map(t => (
                    <TransactionItem
                        key={t.id}
                        icon={
                            <div className={cn("w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs",
                                t.type === 'INCOME' ? "bg-emerald-100 text-emerald-600" : "bg-blue-100 text-blue-600"
                            )}>
                                {t.title.substring(0, 2).toUpperCase()}
                            </div>
                        }
                        title={t.title}
                        subtitle={format(new Date(t.date), 'MMM d, h:mm a')}
                        amountDisplay={formatCurrency ? (t.type === 'EXPENSE' ? '-' : '+') + formatCurrency(t.amount) : (t.type === 'EXPENSE' ? '-' : '+') + `$${t.amount}`}
                        amountColor={t.type === 'INCOME' ? "text-emerald-500" : "text-gray-900"}
                        type={t.type}
                    />
                ))}
            </div>
        </div>
    ));
}

function TransactionItem({ icon, title, subtitle, amountDisplay, amountColor, type }) {
    return (
        <div className="flex items-center justify-between group">
            <div className="flex items-center gap-4">
                {icon}
                <div>
                    <h4 className="text-sm font-bold text-gray-900">{title}</h4>
                    <p className="text-xs text-gray-400">{subtitle}</p>
                </div>
            </div>
            <div className="text-right">
                <p className={cn("text-sm font-bold", amountColor)}>{amountDisplay}</p>
                <p className="text-xs text-gray-400 capitalize">{type.toLowerCase()}</p>
            </div>
        </div>
    );
}
