import { AlertTriangle, TrendingDown, TrendingUp, Info, Plus, Minus } from 'lucide-react';
import { cn } from '../../lib/utils';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

export function InsightCard({ insight, formatCurrency, isExpanded, onToggle, comparisonData }) {
    const { type, title, message, amount, severity, categoryId, isProjected } = insight;

    const getIcon = () => {
        switch (type) {
            case 'alert': return <TrendingUp className="h-5 w-5 text-red-600" />;
            case 'warning': return <TrendingUp className="h-5 w-5 text-amber-500" />;
            case 'good': return <TrendingDown className="h-5 w-5 text-green-500" />;
            case 'info': return <Info className="h-5 w-5 text-blue-500" />;
            default: return <AlertTriangle className="h-5 w-5 text-gray-500" />;
        }
    };

    const getBgColor = () => {
        switch (type) {
            case 'alert': return 'bg-red-50 border-red-100 hover:border-red-200';
            case 'warning': return 'bg-amber-50 border-amber-100 hover:border-amber-200';
            case 'good': return 'bg-green-50 border-green-100 hover:border-green-200';
            case 'info': return 'bg-blue-50 border-blue-100 hover:border-blue-200';
            default: return 'bg-gray-50 border-gray-100';
        }
    };

    return (
        <div className={cn("rounded-lg border transition-all duration-200", getBgColor(), isExpanded ? "shadow-md ring-1 ring-black/5" : "")}>
            <div className="p-4 flex items-start gap-3">
                <div className="mt-1 flex-shrink-0">
                    {getIcon()}
                </div>
                <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2">
                        <h4 className="font-semibold text-sm text-gray-900 truncate">{title}</h4>
                        <div className="flex items-center gap-2 flex-shrink-0">
                            {isProjected && (
                                <span className="text-[10px] font-bold uppercase tracking-wider bg-amber-100 text-amber-700 px-1.5 py-0.5 rounded">Projected</span>
                            )}
                            {categoryId && onToggle && (
                                <button
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        onToggle();
                                    }}
                                    className="p-1 hover:bg-black/5 rounded text-gray-400 hover:text-gray-600 transition-colors"
                                    aria-label={isExpanded ? "Collapse details" : "Expand details"}
                                >
                                    {isExpanded ? <Minus className="h-4 w-4" /> : <Plus className="h-4 w-4" />}
                                </button>
                            )}
                        </div>
                    </div>
                    <p className="text-sm text-gray-600 mt-1 leading-relaxed">{message}</p>
                    {amount && (
                        <p className="text-xs font-medium text-gray-500 mt-2">
                            Impact: {formatCurrency(amount)}
                        </p>
                    )}
                </div>
            </div>

            {/* Expandable Comparison Section */}
            {isExpanded && comparisonData && (
                <div className="border-t border-black/5 bg-white/50 p-4 rounded-b-lg animate-in slide-in-from-top-2 duration-200">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {/* History Section (Left) */}
                        <div className="space-y-6">
                            {comparisonData.history.map((monthData, idx) => (
                                <div key={idx} className="space-y-3">
                                    <h5 className="text-xs font-semibold uppercase tracking-wider text-gray-500 border-b border-gray-200 pb-1">
                                        {comparisonData.type === 'average' ? `Month ${idx + 1}: ${monthData.monthName}` : `Previous Month (${monthData.monthName})`}
                                    </h5>
                                    {monthData.transactions.length > 0 ? (
                                        <ul className="space-y-2">
                                            {monthData.transactions.map((t, i) => (
                                                <li key={i} className="flex items-center text-xs gap-3">
                                                    <span className="text-gray-400 w-5 shrink-0 tabular-nums text-right">
                                                        {format(new Date(t.date), 'dd')}
                                                    </span>
                                                    <span className="text-gray-700 flex-1 truncate font-medium" title={t.description || t.name}>
                                                        {t.name || t.description || 'No description'}
                                                    </span>
                                                    <span className="font-medium text-gray-900 shrink-0 tabular-nums">
                                                        {formatCurrency(Number(t.amount))}
                                                    </span>
                                                </li>
                                            ))}
                                            <li className="pt-2 border-t border-gray-200 flex justify-between font-semibold text-xs">
                                                <span>Total</span>
                                                <span>{formatCurrency(monthData.total)}</span>
                                            </li>
                                        </ul>
                                    ) : (
                                        <div className="flex justify-between items-center pt-1">
                                            <p className="text-xs text-gray-400 italic">No transactions.</p>
                                            <span className="text-xs font-semibold">{formatCurrency(0)}</span>
                                        </div>
                                    )}
                                </div>
                            ))}
                        </div>

                        {/* Current Month */}
                        <div className="space-y-3">
                            <h5 className="text-xs font-semibold uppercase tracking-wider text-gray-500 border-b border-gray-200 pb-1">
                                Current Month ({comparisonData.current.monthName})
                            </h5>
                            {comparisonData.current.transactions.length > 0 ? (
                                <ul className="space-y-2">
                                    {comparisonData.current.transactions.map((t, i) => (
                                        <li key={i} className="flex items-center text-xs gap-3">
                                            <span className="text-gray-400 w-5 shrink-0 tabular-nums text-right">
                                                {format(new Date(t.date), 'dd')}
                                            </span>
                                            <div className="flex-1 min-w-0 flex items-center gap-1">
                                                <span className="text-gray-700 truncate font-medium" title={t.description || t.name}>
                                                    {t.name || t.description || 'No description'}
                                                </span>
                                                {t.status === 'PROJECTED' && (
                                                    <span className="text-[9px] bg-amber-100 text-amber-600 px-1 rounded flex-shrink-0">PROJ</span>
                                                )}
                                            </div>
                                            <span className="font-medium text-gray-900 shrink-0 tabular-nums">
                                                {formatCurrency(Number(t.amount))}
                                            </span>
                                        </li>
                                    ))}
                                    <li className="pt-2 border-t border-gray-200 flex justify-between font-semibold text-xs">
                                        <span>Total</span>
                                        <span>{formatCurrency(comparisonData.current.total)}</span>
                                    </li>
                                </ul>
                            ) : (
                                <p className="text-xs text-gray-400 italic">No transactions yet.</p>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
