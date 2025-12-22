import { useDashboardData } from '../../hooks/useDashboardData';
import { DashboardCards } from '../dashboard/DashboardCards';
import { DashboardCurrencyCards } from '../dashboard/DashboardCurrencyCards';
import { DashboardAssetCharts } from '../dashboard/DashboardAssetCharts';
import { CryptoPortfolio } from '../dashboard/CryptoPortfolio';
import { DashboardRecentTransactions } from '../dashboard/DashboardRecentTransactions';
import { DashboardFinancialOverview } from '../dashboard/DashboardFinancialOverview';
import { CashFlowSankey } from '../dashboard/CashFlowSankey';

export function DashboardTab() {
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
        <div className="space-y-6">
            {/* Top Cards: Spending, Income, Net Worth */}
            <DashboardCards
                currentMonthMetrics={currentMonthMetrics}
                netWorthStats={netWorthStats}
                formatCurrency={formatCurrency}
            />

            {/* Assets by Currency */}
            <DashboardCurrencyCards
                assetsByCurrency={assetsByCurrency}
            />

            {/* Asset Evolution & Allocation */}
            <DashboardAssetCharts
                evolutionData={evolutionData}
                allocationData={allocationData}
                sortedAccounts={sortedAccounts}
                getAccountColor={getAccountColor}
                formatCurrency={formatCurrency}
            />

            {/* Crypto Portfolio Section */}
            <CryptoPortfolio
                cryptoStats={cryptoStats}
                formatCurrency={formatCurrency}
                getAccountColor={getAccountColor}
                data={data}
            />

            {/* Bottom Section: Transactions & Financial Overview */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

                {/* Transactions List */}
                <DashboardRecentTransactions
                    transactions={data.transactions}
                    formatCurrency={formatCurrency}
                />

                {/* Main Chart (Income vs Expense) & Pie Chart */}
                <DashboardFinancialOverview
                    chartData={chartData}
                    pieData={pieData}
                    breakdownFilter={breakdownFilter}
                    setBreakdownFilter={setBreakdownFilter}
                    categories={data.categories}
                    formatCurrency={formatCurrency}
                />
            </div >

            {/* Cash Flow Sankey (New) - Visualizes Income vs Expenses flow */}
            <CashFlowSankey
                transactions={data.transactions}
                categories={data.categories}
                formatCurrency={formatCurrency}
            />
        </div >
    );
}

