
import { useState } from 'react';
import { useData } from '../../contexts/DataContext';
import { Card } from '../ui/Card';
import { Button } from '../ui/Button';
import { Plus, Edit2, Trash2, Repeat } from 'lucide-react';

import { FinancialItemModal } from '../calendar/FinancialItemModal'; // Reusing modal for editing definition

export function RecurringTransactionsList() {
    const { data, deleteRecurringTransaction, updateRecurringTransaction, addRecurringTransaction, formatCurrency } = useData();
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingItem, setEditingItem] = useState(null);
    const [formData, setFormData] = useState({
        title: '',
        amount: '',
        type: 'EXPENSE',
        categoryId: '',
        frequency: 'MONTHLY',
        startDate: new Date().toISOString().split('T')[0],
        endDate: '',
        isVariable: false
    });

    const recurringItems = data.recurringTransactions || [];

    const handleEdit = (item) => {
        setEditingItem(item);
        setFormData({
            title: item.title,
            amount: item.amount,
            type: item.type,
            categoryId: item.categoryId || '',
            frequency: item.frequency || 'MONTHLY',
            startDate: item.startDate,
            endDate: item.endDate || '',
            isVariable: item.isVariable || false
        });
        setIsModalOpen(true);
    };

    const handleDelete = async (id) => {
        if (confirm('Are you sure you want to delete this Recurring Transaction? ALL linked past and future transactions will be deleted.')) {
            await deleteRecurringTransaction(id);
        }
    };

    const handleAddNew = () => {
        setEditingItem(null);
        setFormData({
            title: '',
            amount: '',
            type: 'EXPENSE',
            categoryId: '',
            frequency: 'MONTHLY',
            startDate: new Date().toISOString().split('T')[0],
            endDate: '',
            isVariable: false
        });
        setIsModalOpen(true);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        const commonData = {
            title: formData.title,
            amount: parseFloat(formData.amount),
            type: formData.type,
            categoryId: formData.categoryId,
            frequency: formData.frequency,
            startDate: formData.startDate,
            endDate: formData.endDate || null,
            isVariable: formData.isVariable,
            isRecurring: true // Explicitly set
        };

        if (editingItem) {
            await updateRecurringTransaction(editingItem.id, commonData);
        } else {
            await addRecurringTransaction(commonData);
        }
        setIsModalOpen(false);
    };

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-3xl font-bold text-gray-900 tracking-tight flex items-center gap-2">
                        <Repeat className="h-8 w-8 text-indigo-600" />
                        Recurring Transactions
                    </h2>
                    <p className="text-gray-500">Manage your recurring income and expenses rules.</p>
                </div>
                <Button onClick={handleAddNew} className="flex items-center gap-2">
                    <Plus size={16} />
                    New Recurring
                </Button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {recurringItems.map(item => {
                    const category = (data.categories || []).find(c => c.id === item.categoryId);
                    return (
                        <Card key={item.id} className="p-6 relative group hover:shadow-md transition-shadow">
                            <div className="absolute top-4 right-4 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                <button onClick={() => handleEdit(item)} className="p-1.5 text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-md">
                                    <Edit2 size={16} />
                                </button>
                                <button onClick={() => handleDelete(item.id)} className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-md">
                                    <Trash2 size={16} />
                                </button>
                            </div>

                            <div className="flex items-start gap-4">
                                <div
                                    className="w-12 h-12 rounded-full flex items-center justify-center text-lg font-bold shrink-0"
                                    style={{ backgroundColor: category?.color ? `${category.color}20` : '#f3f4f6', color: category?.color || '#6b7280' }}
                                >
                                    {item.title.charAt(0).toUpperCase()}
                                </div>
                                <div>
                                    <h3 className="font-bold text-gray-900">{item.title}</h3>
                                    <p className="text-sm text-gray-500">{item.frequency} • {category?.name || 'Uncategorized'}</p>
                                    <div className="mt-2 flex items-baseline gap-1">
                                        <span className={`text-lg font-bold ${item.type === 'INCOME' ? 'text-emerald-600' : 'text-red-600'}`}>
                                            {item.type === 'INCOME' ? '+' : '-'}{formatCurrency(item.amount)}
                                        </span>
                                        {item.isVariable && <span className="text-xs text-amber-600 bg-amber-50 px-1.5 py-0.5 rounded font-medium">Variable</span>}
                                    </div>
                                    <p className="text-xs text-gray-400 mt-2">Starts {item.startDate}</p>
                                </div>
                            </div>
                        </Card>
                    );
                })}
            </div>

            <FinancialItemModal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                itemType="recurring" // Locked to recurring
                setItemType={() => { }} // Disable switching
                formData={formData}
                setFormData={setFormData}
                handleSubmit={handleSubmit}
                categories={data.categories}
                editingItem={editingItem}
            />
        </div>
    );
}
