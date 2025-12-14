import { format, isValid } from 'date-fns';
import { Edit2, Trash2, CheckCircle } from 'lucide-react';
import { Card } from '../ui/Card';
import { cn } from '../../lib/utils';
import { categorizeTransaction } from '../../lib/categorizer';

export function CalendarMonthSummary({ monthlyFinancials, categories, onEdit, onDelete }) {
    if (!monthlyFinancials) return null;

    return (
        <Card className="p-6">
            <div className="flex items-center justify-between mb-6">
                <h3 className="text-lg font-bold text-gray-900">Month Summary</h3>
                <div className="flex gap-4">
                    <div className="text-right">
                        <p className="text-xs text-gray-400 uppercase">Income</p>
                        <p className="font-bold text-emerald-600">+{monthlyFinancials.income.toLocaleString()}</p>
                    </div>
                    <div className="text-right">
                        <p className="text-xs text-gray-400 uppercase">Expenses</p>
                        <p className="font-bold text-red-600">-{monthlyFinancials.expense.toLocaleString()}</p>
                    </div>
                    <div className="text-right pl-4 border-l">
                        <p className="text-xs text-gray-400 uppercase">Balance</p>
                        <p className={cn("font-bold", monthlyFinancials.balance >= 0 ? "text-emerald-600" : "text-red-600")}>
                            {monthlyFinancials.balance.toLocaleString()}
                        </p>
                    </div>
                </div>
            </div>

            <div className="overflow-x-auto">
                <table className="w-full text-sm">
                    <thead>
                        <tr className="border-b border-gray-100">
                            <th className="text-left py-3 font-semibold text-gray-400 w-[120px]">Date</th>
                            <th className="text-left py-3 font-semibold text-gray-400">Description</th>
                            <th className="text-center py-3 font-semibold text-gray-400 w-[150px]">Category</th>
                            <th className="text-center py-3 font-semibold text-gray-400 w-[100px]">Type</th>
                            <th className="text-right py-3 font-semibold text-gray-400 w-[120px]">In</th>
                            <th className="text-right py-3 font-semibold text-gray-400 w-[120px]">Out</th>
                            <th className="text-center py-3 font-semibold text-gray-400 w-[80px]">Status</th>
                            <th className="text-center py-3 font-semibold text-gray-400 w-[80px]">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-50">
                        {monthlyFinancials.history.map((item, i) => {
                            let categoryName = 'Uncategorized';
                            let categoryColor = '#9ca3af';

                            if (item.categoryId) {
                                const cat = (categories || []).find(c => c.id === item.categoryId);
                                if (cat) {
                                    categoryName = cat.name;
                                    categoryColor = cat.color;
                                }
                            }

                            return (
                                <tr key={i} className="group hover:bg-gray-50/50 transition-colors">
                                    <td className="py-3 text-gray-500 font-mono text-xs">
                                        {isValid(item.date) ? format(item.date, 'dd/MM') : 'Invalid'}
                                    </td>
                                    <td className="py-3 font-medium text-gray-900">
                                        <div className="flex items-center gap-2">
                                            {(item.isRecurring || item.recurringTransactionId) && (
                                                <span className="px-1.5 py-0.5 bg-indigo-50 text-indigo-600 text-[10px] rounded font-semibold uppercase tracking-wider">
                                                    Recurring
                                                </span>
                                            )}
                                            {item.title || item.name}
                                        </div>
                                    </td>
                                    <td className="py-3 text-center">
                                        <div className="inline-flex items-center gap-1.5 px-2 py-1 rounded-full bg-gray-100/50">
                                            <div
                                                className="w-2 h-2 rounded-full"
                                                style={{ backgroundColor: categoryColor }}
                                            />
                                            <span className="text-xs text-gray-600">{categoryName}</span>
                                        </div>
                                    </td>
                                    <td className="py-3 text-center">
                                        <span className={cn(
                                            "text-[10px] font-bold px-2 py-1 rounded-full uppercase tracking-wider",
                                            item.type === 'INCOME' ? "bg-emerald-100 text-emerald-700" : "bg-red-100 text-red-700"
                                        )}>
                                            {item.type}
                                        </span>
                                    </td>
                                    <td className="py-3 text-right font-mono font-medium text-emerald-600">
                                        {item.type === 'INCOME' ? `R$ ${item.amount.toLocaleString()}` : ''}
                                    </td>
                                    <td className="py-3 text-right font-mono font-medium text-red-600">
                                        {item.type === 'EXPENSE' ? `R$ ${item.amount.toLocaleString()}` : ''}
                                    </td>
                                    <td className="py-3 text-center">
                                        <span className={cn(
                                            "text-[10px] font-bold uppercase",
                                            item.status === 'PAID' ? "text-emerald-500" : "text-amber-500"
                                        )}>
                                            {item.status || 'PAID'}
                                        </span>
                                    </td>
                                    <td className="py-3 text-center">
                                        <div className="flex items-center justify-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                            <button
                                                onClick={() => onEdit(item)}
                                                className={cn(
                                                    "p-1 rounded-md transition-colors",
                                                    item.status === 'PROJECTED'
                                                        ? "text-emerald-500 hover:text-emerald-700 hover:bg-emerald-50"
                                                        : "text-gray-400 hover:text-indigo-600 hover:bg-indigo-50"
                                                )}
                                                title={item.status === 'PROJECTED' ? "Confirm" : "Edit"}
                                            >
                                                {item.status === 'PROJECTED' ? <CheckCircle size={14} /> : <Edit2 size={14} />}
                                            </button>
                                            <button
                                                onClick={() => onDelete(item)}
                                                className="p-1 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-md transition-colors"
                                                title="Delete"
                                            >
                                                <Trash2 size={14} />
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            );
                        })}
                    </tbody>
                </table>
            </div>
        </Card>
    );
}

