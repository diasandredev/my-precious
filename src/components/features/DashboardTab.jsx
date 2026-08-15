import { useNavigate } from 'react-router-dom';
import { useDashboardData } from '../../hooks/useDashboardData';
import { Helmet } from 'react-helmet-async';
import { PageHeader } from '../layout/PageHeader';
import { DashboardCards } from '../dashboard/DashboardCards';
import { DashboardCurrencyCards } from '../dashboard/DashboardCurrencyCards';
import { DashboardAssetCharts } from '../dashboard/DashboardAssetCharts';
import { CryptoPortfolio, CryptoAllocation } from '../dashboard/CryptoPortfolio';
import { DashboardRecentTransactions } from '../dashboard/DashboardRecentTransactions';
import { DashboardFinancialOverview } from '../dashboard/DashboardFinancialOverview';
import { DashboardExpensesBreakdown } from '../dashboard/DashboardExpensesBreakdown';
import { CashFlowSankey } from '../dashboard/CashFlowSankey';

export function DashboardTab() {
    const navigate = useNavigate();
    // ... data fetching ...
    const {
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
    } = useDashboardData();

    return (
        <div className="flex h-full w-full overflow-hidden">
            <Helmet>
                <title>Dashboard - Precious</title>
                <meta name="description" content="Overview of your financial health, including net worth, recent transactions, and asset allocation." />
                <link rel="canonical" href="https://my-precious-app.com/" />
            </Helmet>

            {/* Left Column: Scrollable Dashboard Content */}
            <div className="flex-1 h-full overflow-y-auto p-4 sm:p-6 lg:p-8 space-y-6 custom-scrollbar">
                <PageHeader
                    title="Painel Geral"
                    description="Visão consolidada do seu patrimônio, fluxo de caixa e alocação de ativos."
                />

                <div className="space-y-4 max-w-7xl">
                    <DashboardCards
                        currentMonthMetrics={currentMonthMetrics}
                        netWorthStats={netWorthStats}
                        formatCurrency={formatCurrency}
                    />

                    {/* Assets by Currency */}
                    <DashboardCurrencyCards
                        assetsByCurrency={assetsByCurrency}
                    />

                    {/* Asset Evolution & Assets */}
                    <DashboardAssetCharts
                        evolutionData={evolutionData}
                        allocationData={allocationData}
                        sortedAccounts={sortedAccounts}
                        getAccountColor={getAccountColor}
                        formatCurrency={formatCurrency}
                    />

                    {/* Crypto Portfolio Main Chart */}
                    <CryptoPortfolio
                        cryptoStats={cryptoStats}
                        formatCurrency={formatCurrency}
                        getAccountColor={getAccountColor}
                        data={data}
                    />

                    {/* Main Chart (Income vs Expense) */}
                    <DashboardFinancialOverview
                        chartData={chartData}
                        categories={data.categories}
                        formatCurrency={formatCurrency}
                    />

                    {/* Split Row: Expenses Breakdown & Crypto Allocation */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <DashboardExpensesBreakdown
                            pieData={pieData}
                            breakdownFilter={breakdownFilter}
                            setBreakdownFilter={setBreakdownFilter}
                            chartData={chartData}
                            formatCurrency={formatCurrency}
                        />
                        <CryptoAllocation
                            cryptoStats={cryptoStats}
                            formatCurrency={formatCurrency}
                            getAccountColor={getAccountColor}
                        />
                    </div>

                    {/* Cash Flow Sankey */}
                    <CashFlowSankey
                        transactions={data.transactions}
                        recurringTransactions={data.recurringTransactions}
                        categories={data.categories}
                        formatCurrency={formatCurrency}
                    />

                    {/* Mobile fallback for smaller viewports (< lg) */}
                    <div className="lg:hidden pt-4">
                        <DashboardRecentTransactions
                            transactions={data.transactions}
                            categories={data.categories}
                            formatCurrency={formatCurrency}
                            className="rounded-2xl border border-slate-200/80 shadow-xs"
                        />
                    </div>
                </div>
            </div>

            {/* Right Column: Fixed Lateral Panel (No padding on top, unboxed, flush to screen top/bottom) */}
            <aside className="hidden lg:flex w-80 xl:w-96 shrink-0 h-full border-l border-slate-200/80 bg-white/95 backdrop-blur-md flex-col z-10">
                <DashboardRecentTransactions
                    transactions={data.transactions}
                    categories={data.categories}
                    formatCurrency={formatCurrency}
                    className="h-full"
                />
            </aside>
        </div>
    );
}
