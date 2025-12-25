import { format } from 'date-fns';
import { Card } from '../ui/Card';
import { cn } from '../../lib/utils';
import { getIcon } from '../../lib/icons';

// Helper to parse date string YYYY-MM-DD as local date without timezone offset issues
const parseLocalDate = (dateStr) => {
    if (!dateStr) return new Date();
    const [year, month, day] = dateStr.split('-').map(Number);
    return new Date(year, month - 1, day);
};

export function DashboardRecentTransactions({ transactions, categories, formatCurrency, className }) {
    return (
        <Card className={cn("pl-5 pb-0 pt-0 pr-0 bg-white space-y-3 overflow-hidden flex flex-col rounded-none shadow-none", className)}>
            <div className="flex items-center justify-between shrink-0 mt-6 mb-4 pr-6">
                <h3 className="text-lg font-bold text-gray-900">Transactions</h3>
                <p className="text-xs text-gray-400">Recent</p>
            </div>

            <div className="space-y-4 overflow-y-auto flex-1 pr-1 custom-scrollbar">
                <TransactionList transactions={transactions} categories={categories} formatCurrency={formatCurrency} />
            </div>
        </Card>
    );
}

function TransactionList({ transactions, categories, formatCurrency }) {
    if (!transactions || transactions.length === 0) {
        return <p className="text-sm text-gray-400">No recent transactions.</p>;
    }

    // Filter transactions: only show until the end of next month
    const today = new Date();
    const endOfNextMonth = new Date(today.getFullYear(), today.getMonth() + 2, 0); // Last day of next month

    const filteredTransactions = transactions.filter(t => {
        const tDate = parseLocalDate(t.date);
        return tDate <= endOfNextMonth;
    });

    if (filteredTransactions.length === 0) {
        return <p className="text-sm text-gray-400">No transactions to display.</p>;
    }

    // Sort by date desc
    const sorted = [...filteredTransactions].sort((a, b) => parseLocalDate(b.date) - parseLocalDate(a.date));

    // Group by Today, Yesterday, Date
    const grouped = sorted.reduce((acc, t) => {
        const d = parseLocalDate(t.date);

        // Reset time portion of today/yesterday for accurate comparison
        const todayDate = new Date();
        todayDate.setHours(0, 0, 0, 0);

        const yesterdayDate = new Date();
        yesterdayDate.setDate(yesterdayDate.getDate() - 1);
        yesterdayDate.setHours(0, 0, 0, 0);

        let key = format(d, 'dd/MM/yyyy'); // Updated format

        // Check if it matches today/yesterday exactly
        if (d.getTime() === todayDate.getTime()) key = 'TODAY';
        else if (d.getTime() === yesterdayDate.getTime()) key = 'YESTERDAY';

        if (!acc[key]) acc[key] = [];
        acc[key].push(t);
        return acc;
    }, {});

    return Object.entries(grouped).map(([label, items]) => (
        <div key={label}>
            <div className="text-xs font-semibold text-gray-400 uppercase mb-3">{label}</div>
            <div className="space-y-4">
                {items.map(t => {
                    const category = categories?.find(c => c.id === t.categoryId);
                    const Icon = category?.icon ? getIcon(category.icon) : null;
                    const color = category?.color || (t.type === 'INCOME' ? '#10b981' : '#3b82f6');
                    const tDate = parseLocalDate(t.date);

                    return (
                        <TransactionItem
                            key={t.id}
                            icon={
                                Icon ? (
                                    <div
                                        className="w-8 h-8 rounded-full flex items-center justify-center"
                                        style={{ backgroundColor: `${color}20`, color: color }}
                                    >
                                        <Icon size={16} />
                                    </div>
                                ) : (
                                    <div className={cn("w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs",
                                        t.type === 'INCOME' ? "bg-emerald-100 text-emerald-600" : "bg-blue-100 text-blue-600"
                                    )}>
                                        {t.title.substring(0, 2).toUpperCase()}
                                    </div>
                                )
                            }
                            title={t.title}
                            subtitle={format(tDate, 'dd/MM/yyyy')} // Updated format
                            amountDisplay={formatCurrency ? (t.type === 'EXPENSE' ? '-' : '+') + formatCurrency(t.amount) : (t.type === 'EXPENSE' ? '-' : '+') + `$${t.amount}`}
                            amountColor={t.type === 'INCOME' ? "text-emerald-500" : "text-gray-900"}
                            type={t.type}
                            status={t.status}
                        />
                    );
                })}
            </div>
        </div>
    ));
}

function TransactionItem({ icon, title, subtitle, amountDisplay, amountColor, type, status }) {
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
                <div className="flex items-center justify-end gap-1">
                    <p className="text-xs text-gray-400 capitalize">{type.toLowerCase()}</p>
                    <span className="text-xs text-gray-300">•</span>
                    <p className={cn(
                        "text-xs font-medium capitalize",
                        status === 'PROJECTED' ? "text-amber-500" : "text-emerald-500"
                    )}>
                        {status === 'PROJECTED' ? 'Projected' : 'Confirmed'}
                    </p>
                </div>
            </div>
        </div>
    );
}
