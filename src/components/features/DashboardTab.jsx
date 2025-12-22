import { useDashboardData } from '../../hooks/useDashboardData';
import { DashboardCards } from '../dashboard/DashboardCards';
import { DashboardCurrencyCards } from '../dashboard/DashboardCurrencyCards';
import { DashboardAssetCharts } from '../dashboard/DashboardAssetCharts';
import { CryptoPortfolio, CryptoAllocation } from '../dashboard/CryptoPortfolio';
import { DashboardRecentTransactions } from '../dashboard/DashboardRecentTransactions';
import { DashboardFinancialOverview } from '../dashboard/DashboardFinancialOverview';
import { DashboardExpensesBreakdown } from '../dashboard/DashboardExpensesBreakdown';
import { CashFlowSankey } from '../dashboard/CashFlowSankey';

export function DashboardTab() {
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
        <div className="space-y-4">
            {/* Top Cards: Spending, Income, Net Worth */}
            <DashboardCards
                currentMonthMetrics={currentMonthMetrics}
                netWorthStats={netWorthStats}
                formatCurrency={formatCurrency}
            />

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
                {/* Left Column: Transactions (Takes 1/3) */}
                <div className="lg:col-span-4 space-y-4">
                    <DashboardRecentTransactions
                        transactions={data.transactions}
                        formatCurrency={formatCurrency}
                        className="min-h-[500px] max-h-[calc(100vh-2rem)] sticky top-0"
                    />
                </div>

                {/* Right Column: Charts & Data (Takes 2/3) */}
                <div className="lg:col-span-8 space-y-4">
                    {/* Assets by Currency */}
                    <DashboardCurrencyCards
                        assetsByCurrency={assetsByCurrency}
                    />

                    {/* Main Chart (Income vs Expense) - Full Width */}
                    <DashboardFinancialOverview
                        chartData={chartData}
                        categories={data.categories}
                        formatCurrency={formatCurrency}
                    />

                    {/* Asset Evolution & Assets (Inside component they are stacked) - Full Width */}
                    <DashboardAssetCharts
                        evolutionData={evolutionData}
                        allocationData={allocationData}
                        sortedAccounts={sortedAccounts}
                        getAccountColor={getAccountColor}
                        formatCurrency={formatCurrency}
                    />

                    {/* Crypto Portfolio Main Chart - Full Width */}
                    <CryptoPortfolio
                        cryptoStats={cryptoStats}
                        formatCurrency={formatCurrency}
                        getAccountColor={getAccountColor}
                        data={data}
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
                        categories={data.categories}
                        formatCurrency={formatCurrency}
                    />
                </div>
            </div>
        </div>
    );
}

