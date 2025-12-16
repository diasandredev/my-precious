import { useMemo, useState } from 'react';
import { format, addMonths, subMonths, startOfMonth, endOfMonth, isSameMonth, isAfter, isBefore, parseISO } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { useData } from '../contexts/DataContext';
import { getFinancialsForMonth } from '../lib/financialPeriodUtils';

export function useDashboardData() {
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
                name: format(parseISO(snap.date), 'MMM yy', { locale: ptBR }),
                tooltipLabel: format(parseISO(snap.date), "d 'de' MMMM 'de' yyyy", { locale: ptBR }),
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
                name: format(d, 'MMM', { locale: ptBR }),
                fullName: format(d, "MMMM 'de' yyyy", { locale: ptBR }),
                fullDate: format(d, 'yyyy-MM'),
                expense: 0,
                income: 0,
                isFuture: i > 0,
                isCurrent: i === 0
            });
        }

        // Calculate totals for each month using shared logic
        months.forEach(m => {
            const financials = getFinancialsForMonth(
                m.date,
                data.recurringTransactions,
                data.transactions,
                [] // fixedExpenses legacy
            );

            financials.forEach(item => {
                const catId = item.categoryId;

                if (item.type === 'EXPENSE') {
                    m.expense += item.amount;

                    // Add to Stacked Bar Data
                    const key = catId ? `exp_${catId}` : 'exp_uncategorized_expense';
                    if (!m[key]) m[key] = 0;
                    m[key] += item.amount;

                    // Add to pie chart buckets
                    // Only for breakdown filter matching months
                    const isMatch = breakdownFilter === 'ALL' || m.fullDate === breakdownFilter;
                    if (isMatch) {
                        const pieKey = catId || 'uncategorized';
                        if (!filteredExpenses[pieKey]) filteredExpenses[pieKey] = 0;
                        filteredExpenses[pieKey] += item.amount;
                    }

                } else if (item.type === 'INCOME') {
                    m.income += item.amount;

                    // Add to Stacked Bar Data
                    const key = catId ? `inc_${catId}` : 'inc_uncategorized_income';
                    if (!m[key]) m[key] = 0;
                    m[key] += item.amount;
                }
            });
        });

        return {
            chartData: months,
            pieData: Object.entries(filteredExpenses).map(([catId, amount]) => {
                const cat = getCat(catId);
                return { name: cat.name, value: amount, color: cat.color };
            })
        };
    }, [data.transactions, data.recurringTransactions, data.categories, breakdownFilter]);

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


    return {
        netWorthStats,
        assetsByCurrency,
        evolutionData,
        allocationData,
        cryptoStats,
        sortedAccounts,
        chartData,
        pieData,
        projectionData,
        currentMonthMetrics,
        breakdownFilter,
        setBreakdownFilter,
        getAccountColor,
        data,
        formatCurrency
    };
}
