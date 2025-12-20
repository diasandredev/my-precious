import { useState, useMemo } from 'react';
import { format, isValid } from 'date-fns';
import { Edit2, Trash2, CheckCircle, Search, Filter, ChevronDown, ArrowUpDown, ArrowUp, ArrowDown, X } from 'lucide-react';
import { Card } from '../ui/Card';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { cn } from '../../lib/utils';

export function CalendarMonthSummary({ monthlyFinancials, categories, onEdit, onDelete }) {
    const [filterName, setFilterName] = useState('');
    const [filterType, setFilterType] = useState('all');
    const [filterCategory, setFilterCategory] = useState('all');
    const [filterStatus, setFilterStatus] = useState('all');
    const [sortConfig, setSortConfig] = useState({ key: 'date', direction: 'asc' });

    if (!monthlyFinancials) return null;

    // Derived Data for Filters
    const uniqueCategories = useMemo(() => {
        if (!categories) return [];
        // Only show categories present in the current month history
        const usedCategoryIds = new Set(monthlyFinancials.history.map(item => item.categoryId).filter(Boolean));
        return categories.filter(c => usedCategoryIds.has(c.id));
    }, [categories, monthlyFinancials.history]);

    // Filter and Sort
    const filteredAndSortedHistory = useMemo(() => {
        let result = [...monthlyFinancials.history];

        // Filtering
        if (filterName) {
            const lowerFilter = filterName.toLowerCase();
            result = result.filter(item =>
                (item.title || item.name || '').toLowerCase().includes(lowerFilter)
            );
        }
        if (filterType !== 'all') {
            result = result.filter(item => item.type === filterType);
        }
        if (filterCategory !== 'all') {
            result = result.filter(item => item.categoryId === filterCategory);
        }
        if (filterStatus !== 'all') {
            result = result.filter(item => {
                // Normalize status: If item has no status, assume 'CONFIRMED' for logic if needed, or just match exact?
                // Most items have status.
                const s = item.status || 'CONFIRMED';
                return s === filterStatus;
            });
        }

        // Sorting
        result.sort((a, b) => {
            let aValue, bValue;

            switch (sortConfig.key) {
                case 'date':
                    aValue = new Date(a.date).getTime();
                    bValue = new Date(b.date).getTime();
                    break;
                case 'description':
                    aValue = (a.title || a.name || '').toLowerCase();
                    bValue = (b.title || b.name || '').toLowerCase();
                    break;
                case 'category':
                    const catA = (categories || []).find(c => c.id === a.categoryId)?.name || 'Uncategorized';
                    const catB = (categories || []).find(c => c.id === b.categoryId)?.name || 'Uncategorized';
                    aValue = catA.toLowerCase();
                    bValue = catB.toLowerCase();
                    break;
                case 'amount':
                    aValue = a.amount;
                    bValue = b.amount;
                    break;
                case 'status':
                    aValue = (a.status || '').toLowerCase();
                    bValue = (b.status || '').toLowerCase();
                    break;
                default:
                    return 0;
            }

            if (aValue < bValue) return sortConfig.direction === 'asc' ? -1 : 1;
            if (aValue > bValue) return sortConfig.direction === 'asc' ? 1 : -1;
            return 0;
        });

        return result;
    }, [monthlyFinancials.history, filterName, filterType, filterCategory, filterStatus, sortConfig, categories]);

    const handleSort = (key) => {
        setSortConfig(current => ({
            key,
            direction: current.key === key && current.direction === 'desc' ? 'asc' : 'desc'
        }));
    };

    const getSortIcon = (key) => {
        if (sortConfig.key !== key) return <ArrowUpDown size={14} className="ml-1 text-gray-300" />;
        return sortConfig.direction === 'asc'
            ? <ArrowUp size={14} className="ml-1 text-black" />
            : <ArrowDown size={14} className="ml-1 text-black" />;
    };

    return (
        <Card className="p-0 overflow-hidden bg-white border-gray-100 shadow-sm">
            <div className="p-6 border-b border-gray-100">
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

                {/* Filters */}
                <div className="flex flex-col sm:flex-row gap-4">
                    <div className="relative flex-1">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
                        <Input
                            placeholder="Search transactions..."
                            value={filterName}
                            onChange={(e) => setFilterName(e.target.value)}
                            className="pl-9 bg-gray-50 border-gray-200 focus:bg-white transition-all"
                        />
                    </div>
                    <div className="flex gap-2">
                        <div className="relative min-w-[120px]">
                            <Filter className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={14} />
                            <select
                                value={filterType}
                                onChange={(e) => setFilterType(e.target.value)}
                                className="w-full h-10 pl-9 pr-8 text-sm bg-gray-50 border border-gray-200 rounded-md focus:outline-none focus:ring-2 focus:ring-black/5 appearance-none cursor-pointer hover:bg-white transition-colors"
                            >
                                <option value="all">All Types</option>
                                <option value="INCOME">Income</option>
                                <option value="EXPENSE">Expense</option>
                            </select>
                            <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" size={14} />
                        </div>
                        <div className="relative min-w-[140px]">
                            <select
                                value={filterCategory}
                                onChange={(e) => setFilterCategory(e.target.value)}
                                className="w-full h-10 pl-3 pr-8 text-sm bg-gray-50 border border-gray-200 rounded-md focus:outline-none focus:ring-2 focus:ring-black/5 appearance-none cursor-pointer hover:bg-white transition-colors"
                            >
                                <option value="all">All Categories</option>
                                {uniqueCategories.map(cat => (
                                    <option key={cat.id} value={cat.id}>{cat.name}</option>
                                ))}
                            </select>
                            <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" size={14} />
                        </div>
                        <div className="relative min-w-[140px]">
                            <select
                                value={filterStatus}
                                onChange={(e) => setFilterStatus(e.target.value)}
                                className="w-full h-10 pl-3 pr-8 text-sm bg-gray-50 border border-gray-200 rounded-md focus:outline-none focus:ring-2 focus:ring-black/5 appearance-none cursor-pointer hover:bg-white transition-colors"
                            >
                                <option value="all">All Status</option>
                                <option value="CONFIRMED">Confirmed</option>
                                <option value="PENDING">Pending</option>
                                <option value="PROJECTED">Projected</option>
                            </select>
                            <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" size={14} />
                        </div>

                        {(filterName || filterType !== 'all' || filterCategory !== 'all' || filterStatus !== 'all') && (
                            <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => {
                                    setFilterName('');
                                    setFilterType('all');
                                    setFilterCategory('all');
                                    setFilterStatus('all');
                                }}
                                className="h-10 w-10 text-gray-400 hover:text-gray-900 hover:bg-gray-100"
                                title="Clear all filters"
                            >
                                <X size={18} />
                            </Button>
                        )}
                    </div>
                </div>
            </div>

            <div className="overflow-x-auto">
                <table className="w-full text-sm">
                    <thead>
                        <tr className="border-b border-gray-100 bg-gray-50/50">
                            <th
                                className="text-left py-3 px-6 font-semibold text-gray-400 w-[120px] cursor-pointer hover:text-black group select-none transition-colors"
                                onClick={() => handleSort('date')}
                            >
                                <div className="flex items-center">
                                    Date
                                    {getSortIcon('date')}
                                </div>
                            </th>
                            <th
                                className="text-left py-3 font-semibold text-gray-400 cursor-pointer hover:text-black group select-none transition-colors"
                                onClick={() => handleSort('description')}
                            >
                                <div className="flex items-center">
                                    Description
                                    {getSortIcon('description')}
                                </div>
                            </th>
                            <th
                                className="text-center py-3 font-semibold text-gray-400 w-[150px] cursor-pointer hover:text-black group select-none transition-colors"
                                onClick={() => handleSort('category')}
                            >
                                <div className="flex items-center justify-center">
                                    Category
                                    {getSortIcon('category')}
                                </div>
                            </th>
                            <th className="text-center py-3 font-semibold text-gray-400 w-[100px]">Type</th>
                            <th
                                className="text-right py-3 font-semibold text-gray-400 w-[120px] cursor-pointer hover:text-black group select-none transition-colors"
                                onClick={() => handleSort('amount')}
                            >
                                <div className="flex items-center justify-end">
                                    Amount
                                    {getSortIcon('amount')}
                                </div>
                            </th>
                            <th
                                className="text-center py-3 font-semibold text-gray-400 w-[80px] cursor-pointer hover:text-black group select-none transition-colors"
                                onClick={() => handleSort('status')}
                            >
                                <div className="flex items-center justify-center">
                                    Status
                                    {getSortIcon('status')}
                                </div>
                            </th>
                            <th className="text-center py-3 font-semibold text-gray-400 w-[80px]">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-50">
                        {filteredAndSortedHistory.map((item, i) => {
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
                                    <td className="py-3 px-6 text-gray-500 font-mono text-xs">
                                        {isValid(new Date(item.date)) ? format(new Date(item.date), 'dd/MM') : 'Invalid'}
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
                                    <td className={cn("py-3 text-right font-mono font-medium", item.type === 'INCOME' ? "text-emerald-600" : "text-red-600")}>
                                        {item.type === 'INCOME' ? '+' : '-'} {Math.abs(item.amount).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                                    </td>
                                    <td className="py-3 text-center">
                                        <span className={cn(
                                            "text-[10px] font-bold uppercase",
                                            (item.status === 'CONFIRMED' || item.status === 'PAID') ? "text-emerald-500" : "text-amber-500"
                                        )}>
                                            {item.status === 'PAID' ? 'CONFIRMED' : (item.status || 'CONFIRMED')}
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
                        {filteredAndSortedHistory.length === 0 && (
                            <tr>
                                <td colSpan={7} className="p-8 text-center text-gray-400 text-sm">
                                    No transactions found matching your filters.
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>
        </Card>
    );
}
