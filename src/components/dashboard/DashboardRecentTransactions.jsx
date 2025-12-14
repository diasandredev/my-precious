import { format } from 'date-fns';
import { Card } from '../ui/Card';
import { cn } from '../../lib/utils';

export function DashboardRecentTransactions({ transactions, formatCurrency }) {
    return (
        <Card className="lg:col-span-1 p-6 bg-white space-y-6 max-h-[500px] overflow-y-auto">
            <div className="flex items-center justify-between">
                <h3 className="text-lg font-bold text-gray-900">Transactions</h3>
                <p className="text-xs text-gray-400">Recent</p>
            </div>

            <div className="space-y-6">
                <TransactionList transactions={transactions} formatCurrency={formatCurrency} />
            </div>
        </Card>
    );
}

function TransactionList({ transactions, formatCurrency }) {
    if (!transactions || transactions.length === 0) {
        return <p className="text-sm text-gray-400">No recent transactions.</p>;
    }

    // Sort by date desc
    const sorted = [...transactions].sort((a, b) => new Date(b.date) - new Date(a.date));

    // Group by Today, Yesterday, Date
    const grouped = sorted.reduce((acc, t) => {
        const d = new Date(t.date);
        const today = new Date();
        const yesterday = new Date();
        yesterday.setDate(yesterday.getDate() - 1);

        let key = format(d, 'MMM d');
        if (d.toDateString() === today.toDateString()) key = 'TODAY';
        else if (d.toDateString() === yesterday.toDateString()) key = 'YESTERDAY';

        if (!acc[key]) acc[key] = [];
        acc[key].push(t);
        return acc;
    }, {});

    return Object.entries(grouped).map(([label, items]) => (
        <div key={label}>
            <div className="text-xs font-semibold text-gray-400 uppercase mb-3">{label}</div>
            <div className="space-y-4">
                {items.map(t => (
                    <TransactionItem
                        key={t.id}
                        icon={
                            <div className={cn("w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs",
                                t.type === 'INCOME' ? "bg-emerald-100 text-emerald-600" : "bg-blue-100 text-blue-600"
                            )}>
                                {t.title.substring(0, 2).toUpperCase()}
                            </div>
                        }
                        title={t.title}
                        subtitle={format(new Date(t.date), 'MMM d, h:mm a')}
                        amountDisplay={formatCurrency ? (t.type === 'EXPENSE' ? '-' : '+') + formatCurrency(t.amount) : (t.type === 'EXPENSE' ? '-' : '+') + `$${t.amount}`}
                        amountColor={t.type === 'INCOME' ? "text-emerald-500" : "text-gray-900"}
                        type={t.type}
                    />
                ))}
            </div>
        </div>
    ));
}

function TransactionItem({ icon, title, subtitle, amountDisplay, amountColor, type }) {
    return (
        <div className="flex items-center justify-between group">
            <div className="flex items-center gap-4">
                {icon}
                <div>
                    <h4 className="text-sm font-bold text-gray-900">{title}</h4>
                    <p className="text-xs text-gray-400">{subtitle}</p>
                </div>
            </div>
            <div className="text-right">
                <p className={cn("text-sm font-bold", amountColor)}>{amountDisplay}</p>
                <p className="text-xs text-gray-400 capitalize">{type.toLowerCase()}</p>
            </div>
        </div>
    );
}
