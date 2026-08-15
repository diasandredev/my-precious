import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { TrendingUp, TrendingDown, ArrowDownLeft, ArrowUpRight, Wallet } from 'lucide-react';
import { Card } from '../ui/Card';
import { cn } from '../../lib/utils';

export function DashboardCards({ currentMonthMetrics, netWorthStats, formatCurrency }) {
    const monthName = format(new Date(), 'MMMM');
    const isPositiveChange = netWorthStats.percentChange >= 0;

    return (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5 mb-4">

            {/* Total Spendings (Current Month) */}
            <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-xs hover:shadow-md transition-all relative overflow-hidden group">
                <div className="flex justify-between items-start mb-3">
                    <div className="space-y-1">
                        <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Gastos do Mês</span>
                        <div className="flex items-baseline gap-2">
                            <h3 className="text-2xl font-extrabold text-slate-900 font-mono tracking-tight">
                                {formatCurrency(currentMonthMetrics.expense)}
                            </h3>
                        </div>
                    </div>
                    <div className="w-10 h-10 rounded-xl bg-rose-50 border border-rose-100 flex items-center justify-center text-rose-600 shadow-xs">
                        <ArrowDownLeft size={20} strokeWidth={2.2} />
                    </div>
                </div>
                <div className="flex items-center gap-1.5 text-xs text-slate-400">
                    <span className="inline-block w-1.5 h-1.5 rounded-full bg-rose-500" />
                    <span>Total de saídas em <strong className="text-slate-600 capitalize">{monthName}</strong></span>
                </div>
            </div>

            {/* Income / Savings */}
            <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-xs hover:shadow-md transition-all relative overflow-hidden group">
                <div className="flex justify-between items-start mb-3">
                    <div className="space-y-1">
                        <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Receitas do Mês</span>
                        <div className="flex items-baseline gap-2">
                            <h3 className="text-2xl font-extrabold text-slate-900 font-mono tracking-tight">
                                {formatCurrency(currentMonthMetrics.income)}
                            </h3>
                        </div>
                    </div>
                    <div className="w-10 h-10 rounded-xl bg-emerald-50 border border-emerald-100 flex items-center justify-center text-emerald-600 shadow-xs">
                        <ArrowUpRight size={20} strokeWidth={2.2} />
                    </div>
                </div>
                <div className="flex items-center gap-1.5 text-xs text-slate-400">
                    <span className="inline-block w-1.5 h-1.5 rounded-full bg-emerald-500" />
                    <span>Total de entradas em <strong className="text-slate-600 capitalize">{monthName}</strong></span>
                </div>
            </div>

            {/* Total Net Worth Trend */}
            <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-xs hover:shadow-md transition-all relative overflow-hidden group">
                <div className="flex justify-between items-start mb-3">
                    <div className="space-y-1">
                        <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Patrimônio Líquido</span>
                        <div className="flex items-baseline gap-2 flex-wrap">
                            <h3 className="text-2xl font-extrabold text-slate-900 font-mono tracking-tight">
                                {formatCurrency(netWorthStats.currentTotal)}
                            </h3>
                            <span className={cn(
                                "text-[11px] font-bold px-2 py-0.5 rounded-full flex items-center gap-0.5",
                                isPositiveChange ? "text-emerald-700 bg-emerald-50 border border-emerald-200/60" : "text-rose-700 bg-rose-50 border border-rose-200/60"
                            )}>
                                {isPositiveChange ? <TrendingUp size={12} strokeWidth={2.5} /> : <TrendingDown size={12} strokeWidth={2.5} />}
                                {Math.abs(netWorthStats.percentChange).toFixed(1)}%
                            </span>
                        </div>
                    </div>
                    <div className="w-10 h-10 rounded-xl bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-600 shadow-xs">
                        <Wallet size={20} strokeWidth={2.2} />
                    </div>
                </div>
                <div className="flex items-center gap-1.5 text-xs text-slate-400">
                    <span>Variação comparada ao mês anterior</span>
                </div>
            </div>

        </div>
    );
}
