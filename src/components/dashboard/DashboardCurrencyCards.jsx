import { Card } from '../ui/Card';
import { cn } from '../../lib/utils';

export function DashboardCurrencyCards({ assetsByCurrency }) {
    return (
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
    );
}
