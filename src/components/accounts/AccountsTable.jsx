import { useState, useMemo } from 'react';
import { Building2, TrendingUp, Bitcoin, Wallet, Edit2, Trash2, Search, Filter, ChevronDown, ArrowUpDown, ArrowUp, ArrowDown, X } from 'lucide-react';
import { Card } from '../ui/Card';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';

export function AccountsTable({
    accounts,
    latestBalances,
    latestRates,
    isUpdateMode,
    newBalances,
    setNewBalances,
    handleOpenModal,
    handleDelete,
    formatCurrency
}) {
    const [filterName, setFilterName] = useState('');
    const [filterType, setFilterType] = useState('all');
    const [filterCurrency, setFilterCurrency] = useState('all');
    const [sortConfig, setSortConfig] = useState({ key: 'balance', direction: 'desc' });

    const uniqueTypes = useMemo(() => {
        const types = new Set(accounts.map(a => a.type));
        return ['all', ...Array.from(types)];
    }, [accounts]);

    const uniqueCurrencies = useMemo(() => {
        const currencies = new Set(accounts.map(a => a.currency || 'BRL'));
        return ['all', ...Array.from(currencies)];
    }, [accounts]);

    const getBrlBalance = (account) => {
        const balance = latestBalances[account.id] || 0;
        if ((account.currency || 'BRL') === 'BRL') return balance;
        return balance * (latestRates[account.currency] || 0);
    };

    const filteredAndSortedAccounts = useMemo(() => {
        let result = [...accounts];

        // Filtering
        if (filterName) {
            result = result.filter(a => a.name.toLowerCase().includes(filterName.toLowerCase()));
        }
        if (filterType !== 'all') {
            result = result.filter(a => a.type === filterType);
        }
        if (filterCurrency !== 'all') {
            result = result.filter(a => (a.currency || 'BRL') === filterCurrency);
        }

        // Sorting
        result.sort((a, b) => {
            let aValue, bValue;

            switch (sortConfig.key) {
                case 'name':
                    aValue = a.name.toLowerCase();
                    bValue = b.name.toLowerCase();
                    break;
                case 'type':
                    aValue = a.type.toLowerCase();
                    bValue = b.type.toLowerCase();
                    break;
                case 'balance':
                    aValue = getBrlBalance(a);
                    bValue = getBrlBalance(b);
                    break;
                default:
                    return 0;
            }

            if (aValue < bValue) return sortConfig.direction === 'asc' ? -1 : 1;
            if (aValue > bValue) return sortConfig.direction === 'asc' ? 1 : -1;
            return 0;
        });

        return result;
    }, [accounts, filterName, filterType, filterCurrency, sortConfig, latestBalances, latestRates]);

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

    const getIcon = (type) => {
        switch (type) {
            case 'Bank': return <Building2 size={18} className="text-blue-500" />;
            case 'Investment': return <TrendingUp size={18} className="text-emerald-500" />;
            case 'Crypto': return <Bitcoin size={18} className="text-orange-500" />;
            default: return <Wallet size={18} className="text-purple-500" />;
        }
    };

    return (
        <Card className="lg:col-span-2 bg-white border-gray-100 shadow-sm overflow-hidden h-fit">
            <div className="p-4 border-b border-gray-100 bg-white flex flex-col sm:flex-row gap-4">
                <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
                    <Input
                        placeholder="Search accounts..."
                        value={filterName}
                        onChange={(e) => setFilterName(e.target.value)}
                        className="pl-9 bg-gray-50 border-gray-200 focus:bg-white transition-all"
                    />
                </div>
                <div className="flex gap-2">
                    <div className="relative min-w-[140px]">
                        <Filter className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={14} />
                        <select
                            value={filterType}
                            onChange={(e) => setFilterType(e.target.value)}
                            className="w-full h-10 pl-9 pr-8 text-sm bg-gray-50 border border-gray-200 rounded-md focus:outline-none focus:ring-2 focus:ring-black/5 appearance-none cursor-pointer hover:bg-white transition-colors"
                        >
                            <option value="all">All Types</option>
                            {uniqueTypes.filter(t => t !== 'all').map(type => (
                                <option key={type} value={type}>{type}</option>
                            ))}
                        </select>
                        <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" size={14} />
                    </div>
                    <div className="relative min-w-[120px]">
                        <select
                            value={filterCurrency}
                            onChange={(e) => setFilterCurrency(e.target.value)}
                            className="w-full h-10 pl-3 pr-8 text-sm bg-gray-50 border border-gray-200 rounded-md focus:outline-none focus:ring-2 focus:ring-black/5 appearance-none cursor-pointer hover:bg-white transition-colors"
                        >
                            <option value="all">All Currencies</option>
                            {uniqueCurrencies.filter(c => c !== 'all').map(currency => (
                                <option key={currency} value={currency}>{currency}</option>
                            ))}
                        </select>
                        <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" size={14} />
                    </div>

                    {(filterName || filterType !== 'all' || filterCurrency !== 'all') && (
                        <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => {
                                setFilterName('');
                                setFilterType('all');
                                setFilterCurrency('all');
                            }}
                            className="h-10 w-10 text-gray-400 hover:text-gray-900 hover:bg-gray-100"
                            title="Clear all filters"
                        >
                            <X size={18} />
                        </Button>
                    )}
                </div>
            </div>

            <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                    <thead>
                        <tr className="border-b border-gray-100 bg-gray-50/50">
                            <th className="p-4 text-xs font-semibold text-gray-400 uppercase w-12 text-center">#</th>
                            <th
                                className="p-4 text-xs font-semibold text-gray-400 uppercase cursor-pointer hover:text-black group select-none transition-colors"
                                onClick={() => handleSort('name')}
                            >
                                <div className="flex items-center">
                                    Account Name
                                    {getSortIcon('name')}
                                </div>
                            </th>
                            <th
                                className="p-4 text-xs font-semibold text-gray-400 uppercase cursor-pointer hover:text-black group select-none transition-colors"
                                onClick={() => handleSort('type')}
                            >
                                <div className="flex items-center">
                                    Type
                                    {getSortIcon('type')}
                                </div>
                            </th>
                            <th
                                className="p-4 text-xs font-semibold text-gray-400 uppercase text-right cursor-pointer hover:text-black group select-none transition-colors"
                                onClick={() => handleSort('balance')}
                            >
                                <div className="flex items-center justify-end">
                                    Balance
                                    {getSortIcon('balance')}
                                </div>
                            </th>
                            <th className="p-4 text-xs font-semibold text-gray-400 uppercase text-right w-24">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-50">
                        {filteredAndSortedAccounts.map((account, idx) => (
                            <tr key={account.id} className="hover:bg-gray-50/80 transition-colors group">
                                <td className="p-4 text-gray-400 text-sm text-center">{idx + 1}</td>
                                <td className="p-4">
                                    <div className="flex items-center gap-3">
                                        <div className="p-2 rounded-lg bg-gray-100 group-hover:bg-white transition-colors">
                                            {getIcon(account.type)}
                                        </div>
                                        <div>
                                            <div className="font-bold text-gray-900">{account.name}</div>
                                            <div className="text-xs text-gray-400 font-mono">{account.currency}</div>
                                        </div>
                                    </div>
                                </td>
                                <td className="p-4">
                                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                                        {account.type}
                                    </span>
                                </td>
                                <td className="p-4 text-right font-mono font-medium text-gray-900">
                                    {isUpdateMode ? (
                                        <Input
                                            type="number"
                                            step="any"
                                            value={newBalances[account.id] || ''}
                                            onChange={(e) => setNewBalances({ ...newBalances, [account.id]: parseFloat(e.target.value) || 0 })}
                                            className="text-right h-8 w-32 ml-auto"
                                            placeholder="0.00"
                                        />
                                    ) : (
                                        <div>
                                            <div>
                                                {(account.currency || 'BRL') === 'BRL'
                                                    ? (formatCurrency ? formatCurrency(latestBalances[account.id] || 0) : (latestBalances[account.id] || 0))
                                                    : new Intl.NumberFormat('en-US', {
                                                        style: 'currency',
                                                        currency: account.currency,
                                                        minimumFractionDigits: ['BTC', 'ETH', 'BNB', 'XRP'].includes(account.currency) ? 4 : 2,
                                                        maximumFractionDigits: ['BTC', 'ETH', 'BNB', 'XRP'].includes(account.currency) ? 4 : 2
                                                    }).format(latestBalances[account.id] || 0)
                                                }
                                            </div>
                                            {(account.currency || 'BRL') !== 'BRL' && (
                                                <div className="text-xs text-gray-400">
                                                    ≈ {formatCurrency((latestBalances[account.id] || 0) * (latestRates[account.currency] || 0))}
                                                </div>
                                            )}
                                        </div>
                                    )}
                                </td>
                                <td className="p-4 text-right">
                                    <div className="flex justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                        <Button variant="ghost" size="icon" onClick={() => handleOpenModal(account)} className="h-8 w-8 text-gray-400 hover:text-gray-900">
                                            <Edit2 size={14} />
                                        </Button>
                                        <Button variant="ghost" size="icon" onClick={() => handleDelete(account.id)} className="h-8 w-8 text-gray-400 hover:text-red-500 hover:bg-red-50">
                                            <Trash2 size={14} />
                                        </Button>
                                    </div>
                                </td>
                            </tr>
                        ))}
                        {filteredAndSortedAccounts.length === 0 && (
                            <tr>
                                <td colSpan={5} className="p-8 text-center text-gray-400 text-sm">
                                    No accounts found matching your filters.
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>
        </Card>
    );
}
