import { Card } from '../ui/Card';
import { cn } from '../../lib/utils';

export function DashboardCurrencyCards({ assetsByCurrency }) {
    return (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5 mb-4">
            {assetsByCurrency.map(item => (
                <div key={item.currency} className="p-4 bg-white rounded-2xl border border-slate-200/80 shadow-xs hover:shadow-md transition-all flex items-center gap-3.5">
                    <div className={cn("w-11 h-11 rounded-xl flex items-center justify-center text-lg font-bold font-mono shadow-inner shrink-0",
                        item.currency === 'BRL' ? "bg-emerald-50 text-emerald-700 border border-emerald-100" :
                            item.currency === 'USD' ? "bg-blue-50 text-blue-700 border border-blue-100" : "bg-purple-50 text-purple-700 border border-purple-100"
                    )}>
                        {item.symbol}
                    </div>
                    <div className="min-w-0">
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Saldo Total ({item.currency})</p>
                        <h3 className="text-lg font-extrabold text-slate-900 font-mono tracking-tight truncate">
                            {item.symbol} {item.amount.toLocaleString(item.currency === 'BRL' ? 'pt-BR' : 'en-US', { minimumFractionDigits: 2 })}
                        </h3>
                    </div>
                </div>
            ))}
        </div>
    );
}
