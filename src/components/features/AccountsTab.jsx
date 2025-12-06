import { useState } from 'react';
import { Plus, Edit2, Trash2, Wallet, TrendingUp, Building2, Bitcoin } from 'lucide-react';
import { useData } from '../../contexts/DataContext';
import { Card, Button, Input, Label, Modal } from '../ui';
import { cn } from '../../lib/utils';

export function AccountsTab() {
    const { data, addAccount, updateAccount, deleteAccount } = useData();
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingAccount, setEditingAccount] = useState(null);

    const [formData, setFormData] = useState({
        name: '',
        type: 'Bank',
        currency: 'BRL'
    });

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

    const getIcon = (type) => {
        switch (type) {
            case 'Bank': return <Building2 className="text-blue-400" />;
            case 'Investment': return <TrendingUp className="text-green-400" />;
            case 'Crypto': return <Bitcoin className="text-orange-400" />;
            default: return <Wallet className="text-purple-400" />;
        }
    };

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <h2 className="text-3xl font-bold tracking-tight text-foreground">Your Accounts</h2>
                <Button onClick={() => handleOpenModal()}>
                    <Plus size={18} className="mr-2" />
                    Add Account
                </Button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {data.accounts.map(account => (
                    <Card key={account.id} className="relative group hover:border-primary/50 transition-colors">
                        <div className="p-6">
                            <div className="flex items-start justify-between mb-4">
                                <div className="p-2 rounded-lg bg-accent border">
                                    {getIcon(account.type)}
                                </div>
                                <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                    <Button variant="ghost" size="icon" onClick={() => handleOpenModal(account)} className="h-8 w-8">
                                        <Edit2 size={16} />
                                    </Button>
                                    <Button variant="ghost" size="icon" onClick={() => handleDelete(account.id)} className="h-8 w-8 text-destructive hover:text-destructive">
                                        <Trash2 size={16} />
                                    </Button>
                                </div>
                            </div>

                            <div>
                                <h3 className="text-lg font-semibold text-foreground">{account.name}</h3>
                                <p className="text-sm text-muted-foreground">{account.type} • {account.currency}</p>
                            </div>
                        </div>
                    </Card>
                ))}

                {data.accounts.length === 0 && (
                    <div className="col-span-full py-12 text-center text-muted-foreground border border-dashed rounded-xl">
                        <p>No accounts found. Add one to get started.</p>
                    </div>
                )}
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
