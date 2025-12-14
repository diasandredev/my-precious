import { Building2, TrendingUp, Bitcoin, Wallet, Edit2, Trash2 } from 'lucide-react';
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
            <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                    <thead>
                        <tr className="border-b border-gray-100 bg-gray-50/50">
                            <th className="p-4 text-xs font-semibold text-gray-400 uppercase w-12">#</th>
                            <th className="p-4 text-xs font-semibold text-gray-400 uppercase">Account Name</th>
                            <th className="p-4 text-xs font-semibold text-gray-400 uppercase">Type</th>
                            <th className="p-4 text-xs font-semibold text-gray-400 uppercase text-right">Balance</th>
                            <th className="p-4 text-xs font-semibold text-gray-400 uppercase text-right w-24">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-50">
                        {accounts.map((account, idx) => (
                            <tr key={account.id} className="hover:bg-gray-50/80 transition-colors group">
                                <td className="p-4 text-gray-400 text-sm">{idx + 1}</td>
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
                        {accounts.length === 0 && (
                            <tr>
                                <td colSpan={5} className="p-8 text-center text-gray-400 text-sm">
                                    No accounts found. Create one to get started.
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>
        </Card>
    );
}
