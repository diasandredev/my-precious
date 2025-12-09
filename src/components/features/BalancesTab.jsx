import { useState, useEffect } from 'react';
import { format, parseISO } from 'date-fns';
import { Save, Calendar } from 'lucide-react';
import { useData } from '../../contexts/DataContext';
import { Card, Button, Input } from '../ui';
import { cn } from '../../lib/utils';

export function BalancesTab() {
    const { data, addSnapshot } = useData();
    const [selectedDate, setSelectedDate] = useState(format(new Date(), 'yyyy-MM-dd'));
    const [balances, setBalances] = useState({});

    // Load existing balances when date changes
    useEffect(() => {
        const snapshot = data.snapshots.find(s => s.date === selectedDate);
        if (snapshot) {
            setBalances(snapshot.balances);
        } else {
            setBalances({});
        }
    }, [selectedDate, data.snapshots]);

    const handleBalanceChange = (accountId, value) => {
        setBalances(prev => ({
            ...prev,
            [accountId]: parseFloat(value) || 0
        }));
    };

    const handleSave = () => {
        addSnapshot({
            date: selectedDate,
            balances: balances
        });
        alert('Balances saved!');
    };

    const totalAssets = Object.values(balances).reduce((a, b) => a + b, 0);

    return (
        <div className="space-y-6">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <h2 className="text-2xl font-bold tracking-tight text-gray-900">Balance Snapshots</h2>

                <div className="flex items-center gap-4 bg-white p-2 rounded-lg border border-gray-200">
                    <Calendar className="text-gray-400" size={20} />
                    <input
                        type="date"
                        value={selectedDate}
                        onChange={(e) => setSelectedDate(e.target.value)}
                        className="bg-transparent border-none text-gray-900 focus:outline-none font-sans"
                    />
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-2 space-y-4">
                    <Card className="p-6 bg-white border-gray-100 shadow-sm">
                        <div className="flex items-center justify-between mb-6">
                            <h3 className="text-lg font-bold text-gray-900">Enter Balances</h3>
                            <Button onClick={handleSave} className="shadow-lg shadow-primary/20">
                                <Save size={18} className="mr-2" />
                                Save Snapshot
                            </Button>
                        </div>

                        <div className="space-y-4">
                            {data.accounts.map(account => (
                                <div key={account.id} className="flex items-center gap-4 p-3 rounded-lg hover:bg-gray-50 transition-colors border border-transparent hover:border-gray-100">
                                    <div className="flex-1">
                                        <div className="font-bold text-gray-900">{account.name}</div>
                                        <div className="text-xs text-gray-500">{account.type}</div>
                                    </div>
                                    <div className="w-48">
                                        <div className="relative">
                                            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm">
                                                {account.currency === 'BRL' ? 'R$' : account.currency === 'USD' ? '$' : account.currency === 'EUR' ? '€' : '₿'}
                                            </span>
                                            <Input
                                                type="number"
                                                step="any"
                                                className="pl-8 text-right font-mono border-gray-200 focus-visible:ring-primary/20"
                                                value={balances[account.id] || ''}
                                                onChange={(e) => handleBalanceChange(account.id, e.target.value)}
                                                placeholder="0.00"
                                            />
                                        </div>
                                    </div>
                                </div>
                            ))}

                            {data.accounts.length === 0 && (
                                <div className="text-center py-8 text-gray-400">
                                    No accounts found. Go to the Accounts tab to add some.
                                </div>
                            )}
                        </div>
                    </Card>
                </div>

                <div className="space-y-6">
                    <Card className="p-6 bg-white shadow-lg shadow-gray-200/50 border-none">
                        <h3 className="text-sm font-medium text-gray-400 mb-2">Total Net Worth</h3>
                        <div className="text-3xl font-bold text-gray-900">
                            {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(totalAssets)}
                        </div>
                        <p className="text-xs text-gray-400 mt-2">
                            For {format(parseISO(selectedDate), 'MMMM d, yyyy')}
                        </p>
                    </Card>

                    <Card className="p-6 bg-white border-gray-100 shadow-sm">
                        <h3 className="text-sm font-medium text-gray-400 mb-4 uppercase tracking-wider">History</h3>
                        <div className="space-y-2 max-h-[300px] overflow-y-auto pr-2 custom-scrollbar">
                            {[...data.snapshots].sort((a, b) => new Date(b.date) - new Date(a.date)).map(snap => (
                                <button
                                    key={snap.id}
                                    onClick={() => setSelectedDate(snap.date)}
                                    className={cn(
                                        "w-full flex items-center justify-between p-3 rounded-lg text-sm transition-colors",
                                        snap.date === selectedDate
                                            ? "bg-primary/5 text-primary border border-primary/20 font-medium"
                                            : "hover:bg-gray-50 text-gray-600"
                                    )}
                                >
                                    <span>{format(parseISO(snap.date), 'MMM d, yyyy')}</span>
                                    <span className="font-mono text-xs text-gray-400">
                                        {Object.keys(snap.balances).length} accs
                                    </span>
                                </button>
                            ))}
                            {data.snapshots.length === 0 && (
                                <div className="text-center py-4 text-xs text-gray-400">
                                    No history yet.
                                </div>
                            )}
                        </div>
                    </Card>
                </div>
            </div>
        </div>
    );
}
