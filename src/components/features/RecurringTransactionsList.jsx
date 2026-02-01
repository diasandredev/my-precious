import { useState, useMemo } from 'react';
import { useData } from '../../contexts/DataContext';
import { Card } from '../ui/Card';
import { Edit2, Trash2, Repeat, ArrowUp, ArrowDown } from 'lucide-react';
import { getIcon } from '../../lib/icons';

export function RecurringTransactionsList({ onEdit, onDelete }) {
    const { data, formatCurrency } = useData();
    const recurringItems = data.recurringTransactions || [];

    // --- Stats Calculation ---
    const stats = useMemo(() => {
        let income = 0;
        let expenses = 0;

        recurringItems.forEach(item => {
            const amount = Number(item.amount);
            // Rough estimation for weekly/biweekly to monthly
            let monthlyAmount = amount;
            if (item.frequency === 'WEEKLY') monthlyAmount = amount * 4;
            if (item.frequency === 'BIWEEKLY') monthlyAmount = amount * 2;
            if (item.frequency === 'YEARLY') monthlyAmount = amount / 12;

            if (item.type === 'INCOME') {
                income += monthlyAmount;
            } else {
                expenses += monthlyAmount;
            }
        });

        return { income, expenses, total: income - expenses };
    }, [recurringItems]);

    return (
        <div className="space-y-6">
            {/* 1. Summary Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Card className="p-4 flex items-center justify-between border-l-4 border-l-emerald-500">
                    <div>
                        <p className="text-xs font-bold text-gray-400 uppercase tracking-wider">Monthly Income</p>
                        <p className="text-xl font-bold text-emerald-600 mt-1">+{formatCurrency(stats.income)}</p>
                    </div>
                    <div className="bg-emerald-50 p-2 rounded-full">
                        <ArrowUp size={20} className="text-emerald-500" />
                    </div>
                </Card>
                <Card className="p-4 flex items-center justify-between border-l-4 border-l-red-500">
                    <div>
                        <p className="text-xs font-bold text-gray-400 uppercase tracking-wider">Monthly Expenses</p>
                        <p className="text-xl font-bold text-red-600 mt-1">-{formatCurrency(stats.expenses)}</p>
                    </div>
                    <div className="bg-red-50 p-2 rounded-full">
                        <ArrowDown size={20} className="text-red-500" />
                    </div>
                </Card>
                <Card className="p-4 flex items-center justify-between border-l-4 border-l-gray-500">
                    <div>
                        <p className="text-xs font-bold text-gray-400 uppercase tracking-wider">Net Recurring</p>
                        <p className={`text-xl font-bold mt-1 ${stats.total >= 0 ? 'text-gray-900' : 'text-red-600'}`}>
                            {formatCurrency(stats.total)}
                        </p>
                    </div>
                    <div className="bg-gray-100 p-2 rounded-full">
                        <Repeat size={20} className="text-gray-500" />
                    </div>
                </Card>
            </div>

            {/* 2. Transactions Table */}
            <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
                <table className="w-full text-sm text-left">
                    <thead className="bg-gray-50 text-gray-500 font-medium border-b border-gray-100">
                        <tr>
                            <th className="px-6 py-3 w-12"></th>
                            <th className="px-6 py-3">Description</th>
                            <th className="px-6 py-3">Frequency</th>
                            <th className="px-6 py-3">Start Date</th>
                            <th className="px-6 py-3 text-right">Amount</th>
                            <th className="px-6 py-3 w-24"></th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                        {recurringItems.length === 0 ? (
                            <tr>
                                <td colSpan="6" className="px-6 py-8 text-center text-gray-400">
                                    No recurring rules defined. Click "New Rule" to start.
                                </td>
                            </tr>
                        ) : (
                            recurringItems.map(item => {
                                const category = (data.categories || []).find(c => c.id === item.categoryId);
                                const Icon = getIcon(category?.icon || 'Tag');

                                return (
                                    <tr key={item.id} className="hover:bg-gray-50/50 group transition-colors">
                                        <td className="px-6 py-4">
                                            <div
                                                className="w-8 h-8 rounded-full flex items-center justify-center shrink-0"
                                                style={{ backgroundColor: category?.color ? `${category.color}20` : '#f3f4f6' }}
                                            >
                                                <Icon size={14} style={{ color: category?.color || '#6b7280' }} />
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="font-medium text-gray-900">{item.title}</div>
                                            <div className="text-xs text-gray-400">{category?.name || 'Uncategorized'}</div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <span className="inline-flex items-center px-2 py-1 rounded-md bg-gray-100 text-xs font-medium text-gray-600">
                                                {{
                                                    'MONTHLY': 'Monthly',
                                                    'YEARLY': 'Yearly',
                                                    'WEEKLY': 'Weekly',
                                                    'BIWEEKLY': 'Bi-weekly',
                                                    'LAST_BUSINESS_DAY_OF_MONTH': 'Last business day'
                                                }[item.frequency] || item.frequency}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 text-gray-500 font-mono text-xs">
                                            {item.startDate ? item.startDate.split('-').reverse().join('/') : '-'}
                                        </td>
                                        <td className="px-6 py-4 text-right font-medium">
                                            <div className={item.type === 'INCOME' ? 'text-emerald-600' : 'text-red-600'}>
                                                {item.type === 'INCOME' ? '+' : '-'}{formatCurrency(item.amount)}
                                            </div>
                                            {item.isVariable && (
                                                <span className="text-[10px] text-amber-600 bg-amber-50 px-1 rounded uppercase tracking-wide">Variable</span>
                                            )}
                                        </td>
                                        <td className="px-6 py-4 text-right">
                                            <div className="flex items-center justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                                <button
                                                    onClick={() => onEdit(item)}
                                                    className="p-1.5 text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-md transition-colors"
                                                    title="Edit Rule"
                                                >
                                                    <Edit2 size={14} />
                                                </button>
                                                <button
                                                    onClick={() => onDelete(item.id)}
                                                    className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-md transition-colors"
                                                    title="Delete Rule"
                                                >
                                                    <Trash2 size={14} />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                );
                            })
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
}
