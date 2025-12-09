import { useState, useMemo } from 'react';
import { Plus, Edit2, Trash2, Wallet, TrendingUp, Building2, Bitcoin, Calendar, Save, History, ChevronDown } from 'lucide-react';
import { useData } from '../../contexts/DataContext';
import { Card, Button, Input, Label, Modal } from '../ui';
import { cn } from '../../lib/utils';
import { format, parseISO } from 'date-fns';

export function AccountsTab() {
    const { data, addAccount, updateAccount, deleteAccount, addSnapshot, formatCurrency } = useData();
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingAccount, setEditingAccount] = useState(null);

    // Balance update state
    const [isUpdateMode, setIsUpdateMode] = useState(false);
    const [selectedDate, setSelectedDate] = useState(format(new Date(), 'yyyy-MM-dd'));
    const [newBalances, setNewBalances] = useState({});

    // History Pagination
    const [historyPage, setHistoryPage] = useState(1);
    const ITEMS_PER_PAGE = 10;

    const [formData, setFormData] = useState({
        name: '',
        type: 'Bank',
        currency: 'BRL'
    });

    // Get latest balances for display
    const sortedSnapshots = useMemo(() => {
        return [...data.snapshots].sort((a, b) => new Date(b.date) - new Date(a.date));
    }, [data.snapshots]);

    const latestBalances = useMemo(() => {
        return sortedSnapshots[0] ? sortedSnapshots[0].balances : {};
    }, [sortedSnapshots]);

    const totalNetWorth = Object.values(latestBalances).reduce((a, b) => a + b, 0);

    const totalPages = Math.ceil(sortedSnapshots.length / ITEMS_PER_PAGE);

    const visibleSnapshots = useMemo(() => {
        const start = (historyPage - 1) * ITEMS_PER_PAGE;
        return sortedSnapshots.slice(start, start + ITEMS_PER_PAGE);
    }, [sortedSnapshots, historyPage]);

    const handleOpenModal = (account = null) => {
        if (account) {
            setEditingAccount(account);
            setFormData({ name: account.name, type: account.type, currency: account.currency });
        } else {
            setEditingAccount(null);
            setFormData({ name: '', type: 'Bank', currency: 'BRL' });
        }
        setIsModalOpen(true);
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        if (editingAccount) {
            updateAccount(editingAccount.id, formData);
        } else {
            addAccount(formData);
        }
        setIsModalOpen(false);
    };

    const handleDelete = (id) => {
        if (confirm('Are you sure you want to delete this account?')) {
            deleteAccount(id);
        }
    };

    const handleUpdateBalances = () => {
        // Pre-fill with latest balances
        setNewBalances(latestBalances);
        setIsUpdateMode(true);
        setSelectedDate(format(new Date(), 'yyyy-MM-dd'));
    };

    const handleEditSnapshot = (snapshot) => {
        setNewBalances(snapshot.balances);
        setSelectedDate(snapshot.date);
        setIsUpdateMode(true);
    };

    const saveBalances = () => {
        addSnapshot({
            date: selectedDate,
            balances: newBalances
        });
        setIsUpdateMode(false);
        // alert('Balances updated!');
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
        <div className="space-y-6">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h2 className="text-2xl font-bold tracking-tight text-gray-900">Accounts & Net Worth</h2>
                    <p className="text-gray-500">Manage your asset sources and track their value.</p>
                </div>

                <div className="flex gap-2">
                    {!isUpdateMode ? (
                        <>
                            <Button onClick={handleUpdateBalances} variant="outline" className="border-gray-200">
                                <Edit2 size={16} className="mr-2" />
                                Update Balances
                            </Button>
                            <Button onClick={() => handleOpenModal()} className="shadow-lg shadow-black/5">
                                <Plus size={18} className="mr-2" />
                                Add Account
                            </Button>
                        </>
                    ) : (
                        <>
                            <div className="flex items-center gap-2 bg-white px-3 py-2 rounded-md border border-gray-200 mr-2">
                                <Calendar size={16} className="text-gray-400" />
                                <input
                                    type="date"
                                    value={selectedDate}
                                    onChange={e => setSelectedDate(e.target.value)}
                                    className="text-sm border-none focus:outline-none"
                                />
                            </div>
                            <Button onClick={() => setIsUpdateMode(false)} variant="ghost">Cancel</Button>
                            <Button onClick={saveBalances} className="bg-emerald-600 hover:bg-emerald-700 text-white border-0 ring-0 focus:ring-0">
                                <Save size={18} className="mr-2" />
                                Save Snapshot
                            </Button>
                        </>
                    )}
                </div>
            </div>

            {/* Total Net Worth Card */}
            <Card className="p-6 bg-white border-gray-100 shadow-sm">
                <div className="flex items-center justify-between">
                    <div>
                        <p className="text-sm font-medium text-gray-400 uppercase tracking-wider">Total Net Worth</p>
                        <h3 className="text-4xl font-bold text-gray-900 mt-2">
                            {formatCurrency ? formatCurrency(totalNetWorth) : `$${totalNetWorth}`}
                        </h3>
                    </div>
                </div>
            </Card>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

                {/* Main Table */}
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
                                {data.accounts.map((account, idx) => (
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
                                                formatCurrency ? formatCurrency(latestBalances[account.id] || 0) : (latestBalances[account.id] || 0)
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
                                {data.accounts.length === 0 && (
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

                {/* History Sidebar */}
                <div className="lg:col-span-1 space-y-6">
                    <Card className="bg-white border-gray-100 shadow-sm p-6">
                        <div className="flex items-center justify-between mb-4">
                            <h3 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                                <History size={20} className="text-gray-400" />
                                History
                            </h3>
                            <span className="text-xs text-gray-400">
                                {sortedSnapshots.length} snapshots
                            </span>
                        </div>

                        <div className="space-y-2 min-h-[300px]">
                            {visibleSnapshots.map(snap => (
                                <div
                                    key={snap.id}
                                    onClick={() => handleEditSnapshot(snap)}
                                    className={cn(
                                        "flex items-center justify-between p-3 rounded-lg cursor-pointer transition-colors border",
                                        snap.date === selectedDate && isUpdateMode
                                            ? "bg-primary/5 border-primary/20"
                                            : "hover:bg-gray-50 border-transparent hover:border-gray-100"
                                    )}
                                >
                                    <div>
                                        <div className="text-sm font-medium text-gray-900">
                                            {format(parseISO(snap.date), 'MMMM d, yyyy')}
                                        </div>
                                        <div className="text-xs text-gray-400">
                                            {Object.keys(snap.balances).length} accounts
                                        </div>
                                    </div>
                                    <div className="text-right">
                                        <div className="text-sm font-bold text-gray-900">
                                            {formatCurrency(Object.values(snap.balances).reduce((a, b) => a + b, 0))}
                                        </div>
                                    </div>
                                </div>
                            ))}

                            {data.snapshots.length === 0 && (
                                <p className="text-sm text-gray-400 text-center py-4">No history available.</p>
                            )}
                        </div>

                        {/* Pagination Controls */}
                        {totalPages > 1 && (
                            <div className="flex justify-center items-center gap-2 mt-6 pt-4 border-t border-gray-50">
                                <Button
                                    variant="ghost"
                                    size="icon"
                                    onClick={() => setHistoryPage(p => Math.max(1, p - 1))}
                                    disabled={historyPage === 1}
                                    className="h-8 w-8"
                                >
                                    <ChevronDown size={16} className="rotate-90" />
                                </Button>

                                {Array.from({ length: totalPages }, (_, i) => i + 1).map(page => (
                                    <Button
                                        key={page}
                                        variant={historyPage === page ? "default" : "ghost"}
                                        size="sm"
                                        onClick={() => setHistoryPage(page)}
                                        className={cn(
                                            "h-8 w-8 p-0",
                                            historyPage === page ? "bg-gray-900 text-white hover:bg-gray-800" : "text-gray-500"
                                        )}
                                    >
                                        {page}
                                    </Button>
                                ))}

                                <Button
                                    variant="ghost"
                                    size="icon"
                                    onClick={() => setHistoryPage(p => Math.min(totalPages, p + 1))}
                                    disabled={historyPage === totalPages}
                                    className="h-8 w-8"
                                >
                                    <ChevronDown size={16} className="rotate-270" />
                                </Button>
                            </div>
                        )}
                    </Card>
                </div>
            </div>

            <Modal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                title={editingAccount ? 'Edit Account' : 'Add New Account'}
            >
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <Label>Account Name</Label>
                        <Input
                            value={formData.name}
                            onChange={e => setFormData({ ...formData, name: e.target.value })}
                            placeholder="e.g. Nubank, Binance"
                            required
                        />
                    </div>

                    <div>
                        <Label>Type</Label>
                        <select
                            className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                            value={formData.type}
                            onChange={e => setFormData({ ...formData, type: e.target.value })}
                        >
                            <option value="Bank">Bank Account</option>
                            <option value="Investment">Investment Broker</option>
                            <option value="Crypto">Crypto Wallet</option>
                            <option value="Other">Other</option>
                        </select>
                    </div>

                    <div>
                        <Label>Currency</Label>
                        <select
                            className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                            value={formData.currency}
                            onChange={e => setFormData({ ...formData, currency: e.target.value })}
                        >
                            <option value="BRL">BRL (R$)</option>
                            <option value="USD">USD ($)</option>
                            <option value="EUR">EUR (€)</option>
                            <option value="BTC">BTC (₿)</option>
                        </select>
                    </div>

                    <div className="flex justify-end gap-3 mt-6">
                        <Button type="button" variant="ghost" onClick={() => setIsModalOpen(false)}>
                            Cancel
                        </Button>
                        <Button type="submit">
                            {editingAccount ? 'Save Changes' : 'Create Account'}
                        </Button>
                    </div>
                </form>
            </Modal>
        </div>
    );
}
