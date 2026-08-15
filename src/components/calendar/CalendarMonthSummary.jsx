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
        <Card className="p-0 overflow-hidden bg-white border-slate-200/80 shadow-xs hover:shadow-md transition-all rounded-2xl">
            <div className="p-6 border-b border-slate-100">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
                    <div>
                        <h3 className="text-base font-bold text-slate-900">Resumo do Mês</h3>
                        <p className="text-xs text-slate-400">Totalização das transações deste período</p>
                    </div>
                    <div className="flex flex-wrap gap-2.5">
                        <div className="px-3 py-1.5 rounded-xl bg-emerald-50 border border-emerald-200/60 text-right">
                            <p className="text-[10px] text-emerald-600 font-bold uppercase tracking-wider">Receitas</p>
                            <p className="text-xs font-extrabold font-mono text-emerald-700">+{monthlyFinancials.income.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</p>
                        </div>
                        <div className="px-3 py-1.5 rounded-xl bg-rose-50 border border-rose-200/60 text-right">
                            <p className="text-[10px] text-rose-600 font-bold uppercase tracking-wider">Despesas</p>
                            <p className="text-xs font-extrabold font-mono text-rose-700">-{monthlyFinancials.expense.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</p>
                        </div>
                        <div className="px-3 py-1.5 rounded-xl bg-slate-900 text-white text-right shadow-xs">
                            <p className="text-[10px] text-slate-300 font-bold uppercase tracking-wider">Saldo do Mês</p>
                            <p className="text-xs font-extrabold font-mono text-white">
                                {monthlyFinancials.balance.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                            </p>
                        </div>
                    </div>
                </div>

                {/* Filters */}
                <div className="flex flex-col sm:flex-row gap-3">
                    <div className="relative flex-1">
                        <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" size={16} />
                        <Input
                            placeholder="Buscar lançamentos..."
                            value={filterName}
                            onChange={(e) => setFilterName(e.target.value)}
                            className="!pl-10 bg-slate-50/50 border-slate-200 focus:bg-white rounded-xl h-10 text-xs transition-all"
                        />
                    </div>
                    <div className="flex flex-wrap gap-2">
                        <div className="relative min-w-[110px]">
                            <Filter className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={13} />
                            <select
                                value={filterType}
                                onChange={(e) => setFilterType(e.target.value)}
                                className="w-full h-10 pl-8 pr-7 text-xs font-medium bg-slate-50/50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-slate-900/10 appearance-none cursor-pointer hover:bg-white transition-colors"
                            >
                                <option value="all">Tipo</option>
                                <option value="INCOME">Receitas</option>
                                <option value="EXPENSE">Despesas</option>
                            </select>
                            <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" size={13} />
                        </div>
                        <div className="relative min-w-[130px]">
                            <select
                                value={filterCategory}
                                onChange={(e) => setFilterCategory(e.target.value)}
                                className="w-full h-10 pl-3 pr-7 text-xs font-medium bg-slate-50/50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-slate-900/10 appearance-none cursor-pointer hover:bg-white transition-colors"
                            >
                                <option value="all">Categorias</option>
                                {uniqueCategories.map(cat => (
                                    <option key={cat.id} value={cat.id}>{cat.name}</option>
                                ))}
                            </select>
                            <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" size={13} />
                        </div>
                        <div className="relative min-w-[120px]">
                            <select
                                value={filterStatus}
                                onChange={(e) => setFilterStatus(e.target.value)}
                                className="w-full h-10 pl-3 pr-7 text-xs font-medium bg-slate-50/50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-slate-900/10 appearance-none cursor-pointer hover:bg-white transition-colors"
                            >
                                <option value="all">Status</option>
                                <option value="CONFIRMED">Confirmado</option>
                                <option value="PENDING">Pendente</option>
                                <option value="PROJECTED">Projetado</option>
                            </select>
                            <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" size={13} />
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
                                className="h-10 w-10 rounded-xl text-slate-400 hover:text-slate-900 hover:bg-slate-100"
                                title="Limpar filtros"
                            >
                                <X size={16} />
                            </Button>
                        )}
                    </div>
                </div>
            </div>

            <div className="overflow-x-auto">
                <table className="w-full text-sm">
                    <thead>
                        <tr className="border-b border-slate-100 bg-slate-50/60">
                            <th
                                className="text-left py-3 px-6 font-semibold text-slate-400 w-[110px] cursor-pointer hover:text-slate-900 group select-none transition-colors text-xs"
                                onClick={() => handleSort('date')}
                            >
                                <div className="flex items-center">
                                    Data
                                    {getSortIcon('date')}
                                </div>
                            </th>
                            <th
                                className="text-left py-3 px-4 font-semibold text-slate-400 cursor-pointer hover:text-slate-900 group select-none transition-colors text-xs"
                                onClick={() => handleSort('description')}
                            >
                                <div className="flex items-center">
                                    Descrição
                                    {getSortIcon('description')}
                                </div>
                            </th>
                            <th
                                className="text-center py-3 px-4 font-semibold text-slate-400 w-[140px] cursor-pointer hover:text-slate-900 group select-none transition-colors text-xs"
                                onClick={() => handleSort('category')}
                            >
                                <div className="flex items-center justify-center">
                                    Categoria
                                    {getSortIcon('category')}
                                </div>
                            </th>
                            <th className="text-center py-3 px-4 font-semibold text-slate-400 w-[100px] text-xs">Tipo</th>
                            <th
                                className="text-right py-3 px-5 font-semibold text-slate-400 w-[160px] cursor-pointer hover:text-slate-900 group select-none transition-colors text-xs"
                                onClick={() => handleSort('amount')}
                            >
                                <div className="flex items-center justify-end">
                                    Valor
                                    {getSortIcon('amount')}
                                </div>
                            </th>
                            <th
                                className="text-center py-3 px-5 font-semibold text-slate-400 w-[140px] cursor-pointer hover:text-slate-900 group select-none transition-colors text-xs"
                                onClick={() => handleSort('status')}
                            >
                                <div className="flex items-center justify-center">
                                    Status
                                    {getSortIcon('status')}
                                </div>
                            </th>
                            <th className="text-center py-3 px-4 font-semibold text-slate-400 w-[90px] text-xs">Ações</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                        {filteredAndSortedHistory.map((item, i) => {
                            let categoryName = 'Sem categoria';
                            let categoryColor = '#94a3b8';

                            if (item.categoryId) {
                                const cat = (categories || []).find(c => c.id === item.categoryId);
                                if (cat) {
                                    categoryName = cat.name;
                                    categoryColor = cat.color;
                                }
                            }

                            return (
                                <tr 
                                    key={i} 
                                    onClick={() => onEdit(item)}
                                    className="group hover:bg-slate-50/80 transition-colors cursor-pointer"
                                >
                                    <td className="py-3.5 px-6 text-slate-500 font-mono text-xs">
                                        {isValid(new Date(item.date)) ? format(new Date(item.date), 'dd/MM') : 'Invalid'}
                                    </td>
                                    <td className="py-3.5 px-4 font-semibold text-slate-900 text-xs">
                                        <div className="flex items-center gap-2">
                                            {(item.isRecurring || item.recurringTransactionId) && (
                                                <span className="px-1.5 py-0.5 bg-indigo-50 text-indigo-600 text-[10px] rounded font-bold uppercase tracking-wider border border-indigo-100/60">
                                                    Recorrente
                                                </span>
                                            )}
                                            {item.title || item.name}
                                        </div>
                                    </td>
                                    <td className="py-3.5 px-4 text-center">
                                        <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-slate-100/70 border border-slate-200/60">
                                            <div
                                                className="w-2 h-2 rounded-full"
                                                style={{ backgroundColor: categoryColor }}
                                            />
                                            <span className="text-xs font-medium text-slate-700">{categoryName}</span>
                                        </div>
                                    </td>
                                    <td className="py-3.5 px-4 text-center">
                                        <span className={cn(
                                            "text-[10px] font-bold px-2 py-0.5 rounded-md uppercase tracking-wider",
                                            item.type === 'INCOME' ? "bg-emerald-50 text-emerald-700 border border-emerald-200/60" : "bg-rose-50 text-rose-700 border border-rose-200/60"
                                        )}>
                                            {item.type === 'INCOME' ? 'Receita' : 'Despesa'}
                                        </span>
                                    </td>
                                    <td className={cn("py-3.5 px-5 text-right font-mono font-extrabold text-xs whitespace-nowrap", item.type === 'INCOME' ? "text-emerald-600" : "text-slate-900")}>
                                        {item.type === 'INCOME' ? '+' : '-'} {Math.abs(item.amount).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                                    </td>
                                    <td className="py-3.5 px-5 text-center whitespace-nowrap">
                                        <span className={cn(
                                            "text-[10px] font-bold px-2.5 py-1 rounded-md uppercase tracking-wider inline-block",
                                            (item.status === 'CONFIRMED' || item.status === 'PAID') 
                                                ? "bg-emerald-50 text-emerald-700 border border-emerald-200/60" 
                                                : "bg-amber-50 text-amber-700 border border-amber-200/60"
                                        )}>
                                            {item.status === 'PAID' ? 'CONFIRMADO' : (item.status === 'PROJECTED' ? 'PROJETADO' : 'CONFIRMADO')}
                                        </span>
                                    </td>
                                    <td className="py-3.5 px-4 text-center" onClick={e => e.stopPropagation()}>
                                        <div className="flex items-center justify-center gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity">
                                            {item.status === 'PROJECTED' && (
                                                <button
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        onEdit(item);
                                                    }}
                                                    className="p-1.5 text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50 rounded-lg transition-colors cursor-pointer"
                                                    title="Confirmar lançamento"
                                                >
                                                    <CheckCircle size={15} />
                                                </button>
                                            )}
                                            <button
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    onEdit(item);
                                                }}
                                                className="p-1.5 text-slate-400 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
                                                title="Editar detalhes"
                                            >
                                                <Edit2 size={15} />
                                            </button>
                                            <button
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    onDelete(item);
                                                }}
                                                className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
                                                title="Excluir"
                                            >
                                                <Trash2 size={15} />
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
