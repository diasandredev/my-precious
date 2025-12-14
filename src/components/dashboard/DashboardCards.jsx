import { format } from 'date-fns';
import { TrendingUp, TrendingDown } from 'lucide-react';
import { Card } from '../ui/Card';
import { cn } from '../../lib/utils';

export function DashboardCards({ currentMonthMetrics, netWorthStats, formatCurrency }) {
    return (
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
    );
}
