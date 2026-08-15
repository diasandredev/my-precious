import { useState, useMemo } from 'react';
import { Helmet } from 'react-helmet-async';
import { format, addMonths } from 'date-fns';
import { TrendingUp } from 'lucide-react';
import { useData } from '../../contexts/DataContext';
import { Input, Label } from '../ui';
import { cn } from '../../lib/utils';
import { getFinancialsForMonth } from '../../lib/financialPeriodUtils';
import { WealthProjectionChart } from './WealthProjectionChart';
import { PageHeader } from '../layout/PageHeader';

export function ProjectionsTab() {
    const { data, addSnapshot, formatCurrency } = useData();
    const [yieldRate, setYieldRate] = useState(1.16);

    // --- Projection Logic ---
    const projectionData = useMemo(() => {
        // 1. Find latest snapshot for starting point
        const sortedSnapshots = [...data.snapshots].sort((a, b) => new Date(b.date) - new Date(a.date));
        const latestSnapshot = sortedSnapshots[0];

        if (!latestSnapshot) return [];

        const getSnapshotTotal = (snapshot) => {
            if (!snapshot) return 0;
            return Object.entries(snapshot.balances).reduce((total, [accId, bal]) => {
                const acc = data.accounts.find(a => a.id === accId);
                let rate = 1;
                const currency = acc?.currency || 'BRL';
                if (acc && currency !== 'BRL') {
                    rate = snapshot.rates?.[currency] || 0;
                }
                return total + (bal * rate);
            }, 0);
        };

        let currentBalance = getSnapshotTotal(latestSnapshot);
        let currentDate = new Date(latestSnapshot.date);

        // --- Calculate Average Variable Expenses (Last 3 Months) ---
        const calculateAvgVariableExpenses = () => {
            const today = new Date();
            let totalVariableExpenses = 0;
            let monthsCounted = 0;

            // Look back 6 months (from previous month)
            for (let i = 1; i <= 6; i++) {
                const targetMonthDate = addMonths(today, -i); // e.g., Nov, Oct, Sep
                const startM = new Date(targetMonthDate.getFullYear(), targetMonthDate.getMonth(), 1);
                const endM = new Date(targetMonthDate.getFullYear(), targetMonthDate.getMonth() + 1, 0);

                const monthlyVariableExpenses = data.transactions
                    .filter(t => {
                        const tDate = new Date(t.date);
                        return tDate >= startM && tDate <= endM &&
                            t.type === 'EXPENSE' &&
                            !t.recurringTransactionId &&
                            !t.fixedItemId;
                    })
                    .reduce((sum, t) => sum + (Number(t.amount) || 0), 0);

                totalVariableExpenses += monthlyVariableExpenses;
                monthsCounted++;
            }

            return monthsCounted > 0 ? totalVariableExpenses / monthsCounted : 0;
        };

        const avgVariableExpenses = calculateAvgVariableExpenses();

        // -----------------------------------------------------------

        const dataPoints = [];

        // Initial Values
        const initialPrincipal = currentBalance;
        let runningBalance = currentBalance;
        let accumulatedSavings = 0;
        let accumulatedYield = 0;

        // --- GAP CALCULATION (Snapshot Date -> End of Month) ---
        // Capture any income/expenses that happen AFTER the snapshot but BEFORE the next month starts.
        // This ensures "future bonus income" in the current month is included.
        const gapFinancials = getFinancialsForMonth(currentDate, data.recurringTransactions, data.transactions, data.fixedExpenses);

        let gapIncome = 0;
        let gapExpense = 0;

        gapFinancials.forEach(item => {
            const itemDate = new Date(item.date);
            // Only count items AFTER the snapshot date
            if (itemDate > currentDate) {
                if (item.type === 'INCOME') {
                    gapIncome += (item.amount || 0);
                } else if (item.type === 'EXPENSE') {
                    gapExpense += (item.amount || 0);
                }
            }
        });

        const gapNet = gapIncome - gapExpense;
        accumulatedSavings += gapNet;
        runningBalance += gapNet;
        // -------------------------------------------------------

        // Initial Point
        dataPoints.push({
            month: format(currentDate, 'MMM yy'),
            initialPrincipal: initialPrincipal,
            accumulatedSavings: accumulatedSavings, // Includes gap savings
            totalYield: 0,
            total: runningBalance,
            avgVariableExpenses: avgVariableExpenses // Store for reference
        });

        for (let i = 1; i <= 12; i++) {
            // Move to next month
            currentDate = addMonths(currentDate, 1);

            // Calculate Net Transactions for this month (Active Savings)
            const financials = getFinancialsForMonth(currentDate, data.recurringTransactions, data.transactions, data.fixedExpenses);

            const income = financials
                .filter(f => f.type === 'INCOME')
                .reduce((sum, item) => sum + (item.amount || 0), 0);

            const recurringExpense = financials
                .filter(f => f.type === 'EXPENSE')
                .reduce((sum, item) => sum + (item.amount || 0), 0);

            const totalExpense = recurringExpense + avgVariableExpenses;
            const netChange = income - totalExpense;

            // Calculate Yield on the TOTAL existing balance (Compound Interest)
            // Yield applies to: Principal + Previous Savings + Previous Yield
            const yieldAmount = runningBalance * (yieldRate / 100);

            // Update Accumulators
            accumulatedSavings += netChange;
            accumulatedYield += yieldAmount;

            // Update Running Total
            runningBalance += netChange + yieldAmount;

            dataPoints.push({
                month: format(currentDate, 'MMM yy'),
                initialPrincipal: initialPrincipal,
                accumulatedSavings: accumulatedSavings,
                totalYield: accumulatedYield,
                total: runningBalance,
                avgVariableExpenses: avgVariableExpenses,
                monthlyIncome: income,
                monthlyRecurringExpenses: recurringExpense,
                monthlyYield: yieldAmount,         // Added for Breakdown Chart
                monthlyNetSavings: netChange       // Added for Breakdown Chart
            });
        }

        return dataPoints;

    }, [data.snapshots, data.fixedItems, data.transactions, data.fixedExpenses, yieldRate, data.recurringTransactions]);


    return (
        <div className="space-y-6 pb-12">
            <Helmet>
                <title>Projections - Precious</title>
                <meta name="description" content="Forecast your future wealth based on recurring patterns and average spending habits." />
                <link rel="canonical" href="https://my-precious-app.com/projections" />
            </Helmet>
            <PageHeader
                title="Projeções Financeiras"
                description="Simule o crescimento patrimonial com base em receitas recorrentes, despesas médias e juros compostos."
            >
                <div className="flex items-center gap-3 bg-white p-2.5 rounded-2xl border border-slate-200/80 shadow-xs">
                    <div className="flex items-center gap-2.5 px-2">
                        <Label htmlFor="yield" className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-0">Rendimento Mensal</Label>
                        <div className="relative w-24">
                            <Input
                                id="yield"
                                type="number"
                                step="0.05"
                                value={yieldRate}
                                onChange={(e) => setYieldRate(parseFloat(e.target.value) || 0)}
                                className="h-9 text-right pr-6 font-extrabold font-mono text-emerald-600 border-slate-200 rounded-xl"
                            />
                            <span className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 text-xs font-bold">%</span>
                        </div>
                    </div>
                </div>
            </PageHeader>

            {/* Summary Cards */}
            {projectionData.length > 0 && (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                    <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs hover:shadow-md transition-all">
                        <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1">Patrimônio em 1 Ano</p>
                        <p className="text-2xl font-extrabold font-mono text-slate-900 tracking-tight">
                            {formatCurrency(projectionData[projectionData.length - 1].total)}
                        </p>
                        <p className="text-xs text-slate-400 mt-1 font-mono">
                            Atual: {formatCurrency(projectionData[0].total)}
                        </p>
                    </div>
                    <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs hover:shadow-md transition-all">
                        <p className="text-[11px] font-bold text-emerald-600 uppercase tracking-wider mb-1">Renda Passiva (Juros)</p>
                        <p className="text-2xl font-extrabold font-mono text-emerald-600 tracking-tight">
                            +{formatCurrency(projectionData[projectionData.length - 1].totalYield)}
                        </p>
                        <p className="text-xs text-slate-400 mt-1">
                            Total de juros acumulados
                        </p>
                    </div>
                    <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs hover:shadow-md transition-all">
                        <p className="text-[11px] font-bold text-blue-600 uppercase tracking-wider mb-1">Poupança Ativa</p>
                        <p className="text-2xl font-extrabold font-mono text-blue-600 tracking-tight">
                            {formatCurrency(projectionData[projectionData.length - 1].accumulatedSavings)}
                        </p>
                        <p className="text-xs text-slate-400 mt-1 font-mono">
                            Média {formatCurrency(projectionData[projectionData.length - 1].accumulatedSavings / 12)} / mês
                        </p>
                    </div>
                    <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs hover:shadow-md transition-all">
                        <p className="text-[11px] font-bold text-amber-600 uppercase tracking-wider mb-1">Média Gastos Variáveis</p>
                        <p className="text-2xl font-extrabold font-mono text-amber-600 tracking-tight">
                            {formatCurrency(projectionData[0].avgVariableExpenses)}
                        </p>
                        <p className="text-xs text-slate-400 mt-1">
                            Base: últimos 6 meses
                        </p>
                    </div>
                </div>
            )}

            {/* Main Projection Chart */}
            <WealthProjectionChart data={projectionData} />

            {/* Methodology / Explanation */}
            {projectionData.length > 0 && (
                <div className="bg-white rounded-2xl p-6 border border-slate-200/80 shadow-xs space-y-4">
                    <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider">Como esta projeção é calculada?</h4>
                    <div className="space-y-3 text-xs text-slate-600">
                        <div className="flex flex-col sm:flex-row sm:items-center gap-3 p-3 rounded-xl bg-slate-50 border border-slate-100">
                            <span className="bg-white px-2.5 py-1 rounded-lg border border-slate-200 font-mono text-xs font-bold text-slate-800 text-center shrink-0">Ponto de Partida</span>
                            <span>
                                Saldo total consolidado do último snapshot: <strong className="text-slate-900 font-mono">{formatCurrency(projectionData[0].total)}</strong>.
                            </span>
                        </div>
                        <div className="flex flex-col sm:flex-row sm:items-start gap-3 p-3 rounded-xl bg-blue-50/50 border border-blue-100/60 text-blue-900">
                            <span className="bg-white px-2.5 py-1 rounded-lg border border-blue-200 font-mono text-xs font-bold text-blue-700 text-center shrink-0">Poupança Ativa</span>
                            <div>
                                <p className="mb-1">Estimativa de fluxo líquido mensal:</p>
                                <ul className="list-disc pl-4 space-y-0.5 text-blue-800">
                                    <li>(+) Receitas Recorrentes (Média: {formatCurrency(projectionData[1]?.monthlyIncome || 0)})</li>
                                    <li>(-) Despesas Recorrentes (Média: {formatCurrency(projectionData[1]?.monthlyRecurringExpenses || 0)})</li>
                                    <li>(-) Gastos Variáveis ({formatCurrency(projectionData[0].avgVariableExpenses)})</li>
                                </ul>
                            </div>
                        </div>
                        <div className="flex flex-col sm:flex-row sm:items-center gap-3 p-3 rounded-xl bg-emerald-50/50 border border-emerald-100/60 text-emerald-900">
                            <span className="bg-white px-2.5 py-1 rounded-lg border border-emerald-200 font-mono text-xs font-bold text-emerald-700 text-center shrink-0">Juros Compostos</span>
                            <span>
                                Rendimento mensal estimado de <strong className="text-emerald-700 font-bold">{yieldRate}% a.m.</strong> aplicado sobre todo o saldo acumulado.
                            </span>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
