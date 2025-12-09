import { useState, useMemo } from 'react';
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameDay, addMonths, subMonths, isToday, getDate, startOfWeek, endOfWeek } from 'date-fns';
import { ChevronLeft, ChevronRight, Plus, Trash2, Settings, Calendar as CalendarIcon, DollarSign, Repeat, ArrowRightLeft } from 'lucide-react';
import { useData } from '../../contexts/DataContext';
import { Button, Input, Label, Modal, Card } from '../ui';
import { cn } from '../../lib/utils';
import { getFinancialsForMonth } from '../../lib/financialPeriodUtils';

export function CalendarTab() {
    const { data, addFixedItem, deleteFixedItem, addTransaction, deleteTransaction, updateFixedItem, updateTransaction } = useData();
    const [currentMonth, setCurrentMonth] = useState(new Date());
    const [isModalOpen, setIsModalOpen] = useState(false);

    // Modal State
    const [isEditing, setIsEditing] = useState(false);
    const [isConfirming, setIsConfirming] = useState(false); // New state for confirmation context
    const [editingId, setEditingId] = useState(null); // ID of transaction or fixed item being edited
    const [itemType, setItemType] = useState('one-time'); // 'one-time' | 'recurring'
    const [formData, setFormData] = useState({
        title: '',
        amount: '',
        date: new Date().toISOString().split('T')[0], // For one-time
        startDate: new Date().toISOString().split('T')[0], // For recurring
        endDate: '', // Optional end date
        frequency: 'MONTHLY', // 'WEEKLY', 'BIWEEKLY', 'MONTHLY', 'YEARLY'
        type: 'EXPENSE', // 'INCOME', 'EXPENSE'

        isVariable: false,
        fixedItemId: null // To link transaction to fixed item
    });

    const monthStart = startOfMonth(currentMonth);
    const monthEnd = endOfMonth(monthStart);
    const startDate = startOfWeek(monthStart);
    const endDate = endOfWeek(monthEnd);

    const calendarDays = eachDayOfInterval({
        start: startDate,
        end: endDate
    });

    // Calculate financials for the view
    const monthlyFinancials = useMemo(() => {
        return getFinancialsForMonth(currentMonth, data.fixedItems, data.transactions, data.fixedExpenses);
    }, [currentMonth, data.fixedItems, data.transactions, data.fixedExpenses]);

    const handlePrevMonth = () => setCurrentMonth(subMonths(currentMonth, 1));
    const handleNextMonth = () => setCurrentMonth(addMonths(currentMonth, 1));

    const handleConfirmItem = (item) => {
        // If it's a projected item, we want to convert it to a transaction
        setFormData({
            title: item.name,
            amount: item.amount,
            date: format(item.date, 'yyyy-MM-dd'),
            startDate: format(item.date, 'yyyy-MM-dd'),
            endDate: '',
            frequency: 'MONTHLY',
            type: item.type,
            isVariable: false, // Once confirmed, it's a fixed amount transaction
            fixedItemId: item.fixedItemId // Capture the ID for deduplication
        });
        setItemType('one-time'); // We are creating a transaction instance
        setIsEditing(false); // We are "adding" a new transaction based on projection
        setIsConfirming(true); // We are confirming a projection
        setIsModalOpen(true);
    };

    const handleEditItem = (item) => {
        // Populate form with item data
        setFormData({
            title: item.name,
            amount: item.amount,
            date: format(new Date(item.date), 'yyyy-MM-dd'), // Handle legacy/string dates
            startDate: item.originalItem?.startDate || format(new Date(item.date), 'yyyy-MM-dd'),
            frequency: item.originalItem?.frequency || 'MONTHLY',
            type: item.type,
            isVariable: item.isVariable || false
        });

        if (item.fixedItemId || item.status === 'PROJECTED') {
            // It's a recurring item instance
            setItemType('recurring');
            setEditingId(item.fixedItemId || item.originalItem?.id);
        } else {
            // It's a one-time transaction
            setItemType('one-time');
            setEditingId(item.id);
        }

        setIsEditing(true);
        setIsConfirming(false);
        setIsModalOpen(true);
    };

    const handleSubmit = (e) => {
        e.preventDefault();

        const amount = parseFloat(formData.amount);

        if (isEditing) {
            if (itemType === 'recurring') {
                if (editingId && !editingId.toString().startsWith('legacy')) {
                    updateFixedItem(editingId, {
                        title: formData.title,
                        amount: formData.isVariable ? 0 : amount,
                        type: formData.type,
                        frequency: formData.frequency,
                        startDate: formData.startDate,
                        endDate: formData.endDate,
                        isVariable: formData.isVariable
                    });
                }
            } else {
                if (updateTransaction) {
                    updateTransaction(editingId, {
                        title: formData.title,
                        amount: amount,
                        type: formData.type,
                        date: formData.date,
                        isPaid: true
                    });
                }
            }
        } else {
            // Creating new
            if (itemType === 'recurring') {
                addFixedItem({
                    title: formData.title,
                    amount: formData.isVariable ? 0 : amount,
                    type: formData.type,
                    frequency: formData.frequency,
                    startDate: formData.startDate,
                    endDate: formData.endDate,
                    isVariable: formData.isVariable
                });
            } else {
                addTransaction({
                    title: formData.title,
                    amount: amount,
                    type: formData.type,
                    date: formData.date,
                    isPaid: true,
                    fixedItemId: formData.fixedItemId // Pass the link
                });
            }
        }


        setIsModalOpen(false);
        resetForm();
    };

    const resetForm = () => {
        setFormData({
            title: '',
            amount: '',
            date: new Date().toISOString().split('T')[0],
            startDate: new Date().toISOString().split('T')[0],
            endDate: '',
            frequency: 'MONTHLY',
            type: 'EXPENSE',
            isVariable: false,
            fixedItemId: null
        });
        setItemType('one-time');
        setIsEditing(false);
        setIsConfirming(false);
        setEditingId(null);
    };

    const getItemsForDay = (day) => {
        return monthlyFinancials.filter(item => isSameDay(item.date, day));
    };

    // Calculate totals
    const totalIncome = monthlyFinancials
        .filter(i => i.type === 'INCOME')
        .reduce((acc, curr) => acc + (curr.amount || 0), 0);

    const totalExpense = monthlyFinancials
        .filter(i => i.type === 'EXPENSE')
        .reduce((acc, curr) => acc + (curr.amount || 0), 0);

    const balance = totalIncome - totalExpense;

    return (
        <div className="space-y-8 pb-8">
            {/* Calendar Header */}
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                    <h2 className="text-3xl font-bold text-primary tracking-tight flex items-center gap-2">
                        <CalendarIcon className="h-8 w-8" />
                        {format(currentMonth, 'MMMM yyyy')}
                    </h2>
                    <div className="flex items-center gap-1 bg-card rounded-md p-1 border">
                        <Button variant="ghost" size="icon" onClick={handlePrevMonth} className="h-8 w-8">
                            <ChevronLeft size={18} />
                        </Button>
                        <Button variant="ghost" size="icon" onClick={handleNextMonth} className="h-8 w-8">
                            <ChevronRight size={18} />
                        </Button>
                    </div>
                </div>

                <div className="flex items-center gap-4">
                    <div className="text-right hidden md:block">
                        <div className="text-xs text-muted-foreground uppercase font-bold tracking-wider">Balance</div>
                        <div className={cn("text-xl font-bold font-mono", balance >= 0 ? "text-green-500" : "text-red-500")}>
                            {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(balance)}
                        </div>
                    </div>
                    <Button onClick={() => { resetForm(); setIsModalOpen(true); }} className="gap-2 shadow-lg shadow-primary/20">
                        <Plus size={18} />
                        <span>Add Item</span>
                    </Button>
                </div>
            </div>

            {/* Grid Calendar View */}
            <Card className="p-0 bg-white border-none shadow-none">
                <div className="grid grid-cols-7 mb-1 bg-white">
                    {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
                        <div key={day} className="p-4 text-center text-sm font-semibold text-muted-foreground uppercase tracking-wider">
                            {day}
                        </div>
                    ))}
                </div>
                <div className="grid grid-cols-7 gap-px bg-gray-200 rounded-lg overflow-hidden border border-gray-200 shadow-sm">
                    {calendarDays.map((day, dayIdx) => {
                        const items = getItemsForDay(day);
                        const isCurrentMonth = day.getMonth() === currentMonth.getMonth();
                        const isCurrentDay = isToday(day);

                        const dayBalance = items.reduce((acc, curr) => {
                            return acc + (curr.type === 'INCOME' ? curr.amount : -curr.amount);
                        }, 0);

                        return (
                            <div
                                key={day.toString()}
                                className={cn(
                                    "min-h-[120px] p-2 transition-colors relative group flex flex-col gap-1 border-r border-b border-gray-100",
                                    !isCurrentMonth ? "bg-gray-50/50 text-gray-300" : "bg-white",
                                    isCurrentMonth && "hover:bg-gray-50"
                                )}
                                onClick={() => {
                                    resetForm(); // Reset previous state first
                                    setFormData(prev => ({
                                        ...prev,
                                        date: format(day, 'yyyy-MM-dd'),
                                        startDate: format(day, 'yyyy-MM-dd')
                                    }));
                                    setIsModalOpen(true);
                                }}
                            >
                                <div className="flex items-center justify-between">
                                    <span className={cn(
                                        "text-sm font-semibold h-7 w-7 flex items-center justify-center rounded-full",
                                        isCurrentDay ? "bg-primary text-primary-foreground" : "text-foreground",
                                        !isCurrentMonth && "text-muted-foreground"
                                    )}>
                                        {format(day, 'd')}
                                    </span>
                                    {items.length > 0 && (
                                        <span className={cn(
                                            "text-[10px] font-bold",
                                            dayBalance >= 0 ? "text-green-500" : "text-red-400"
                                        )}>
                                            {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(dayBalance)}
                                        </span>
                                    )}
                                </div>

                                <div className="flex-1 flex flex-col gap-1 mt-1 overflow-y-auto custom-scrollbar max-h-[80px]">
                                    {items.map(item => (
                                        <div
                                            key={item.id}
                                            className={cn(
                                                "text-xs p-1.5 rounded border truncate group/item transition-all duration-200 flex items-center justify-between cursor-pointer",
                                                "hover:scale-[1.02] hover:shadow-sm hover:brightness-105",
                                                item.type === 'INCOME'
                                                    ? "bg-green-500/10 border-green-500/20 text-green-500"
                                                    : "bg-red-500/10 border-red-500/20 text-red-500",
                                                item.status === 'PROJECTED' && "opacity-70 border-dashed"
                                            )}
                                            title={`${item.name} - R$ ${item.amount}`}
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                if (item.status === 'PROJECTED') {
                                                    handleConfirmItem(item);
                                                } else {
                                                    handleEditItem(item);
                                                }
                                            }}
                                        >
                                            <span className="truncate flex-1 font-medium">
                                                {item.isVariable && item.status === 'PROJECTED' ? '~' : ''}{item.name}
                                            </span>
                                            <button
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    if (item.fixedItemId) deleteFixedItem(item.fixedItemId);
                                                    else deleteTransaction(item.id);
                                                }}
                                                className="opacity-0 group-hover/item:opacity-100 p-0.5 rounded ml-1 hover:bg-black/20"
                                            >
                                                <Trash2 size={10} />
                                            </button>
                                        </div>
                                    ))}
                                </div>

                            </div>
                        );
                    })}
                </div>
            </Card>

            {/* Financial Summary Table */}
            <div className="space-y-4">
                <div className="flex items-center justify-between">
                    <h3 className="text-xl font-bold text-foreground flex items-center gap-2">
                        <ArrowRightLeft className="text-primary" />
                        Month Summary
                    </h3>
                </div>

                <Card className="overflow-hidden border-border/50">
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                            <thead className="bg-muted/50 text-muted-foreground">
                                <tr>
                                    <th className="px-4 py-3 text-left font-medium">Date</th>
                                    <th className="px-4 py-3 text-left font-medium">Description</th>
                                    <th className="px-4 py-3 text-left font-medium">Type</th>
                                    <th className="px-4 py-3 text-right font-medium">In</th>
                                    <th className="px-4 py-3 text-right font-medium">Out</th>
                                    <th className="px-4 py-3 text-center font-medium">Status</th>
                                    <th className="px-4 py-3 text-center font-medium">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-border/50">
                                {monthlyFinancials.length === 0 ? (
                                    <tr>
                                        <td colSpan={7} className="px-4 py-8 text-center text-muted-foreground">
                                            No financial activity this month.
                                        </td>
                                    </tr>
                                ) : (
                                    monthlyFinancials.map(item => (
                                        <tr key={item.id} className="hover:bg-muted/30 transition-colors">
                                            <td className="px-4 py-3 font-mono text-muted-foreground">
                                                {format(item.date, 'dd/MM')}
                                            </td>
                                            <td className="px-4 py-3 font-medium text-foreground">
                                                {item.name}
                                                {item.isVariable && <span className="ml-2 text-[10px] bg-blue-500/10 text-blue-500 px-1 py-0.5 rounded">VAR</span>}
                                            </td>
                                            <td className="px-4 py-3">
                                                <span className={cn(
                                                    "px-2 py-0.5 rounded text-[10px] font-bold uppercase",
                                                    item.type === 'INCOME' ? "bg-green-500/10 text-green-500" : "bg-red-500/10 text-red-500"
                                                )}>
                                                    {item.type}
                                                </span>
                                            </td>
                                            <td className="px-4 py-3 text-right font-mono text-green-500/90">
                                                {item.type === 'INCOME' && new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(item.amount)}
                                            </td>
                                            <td className="px-4 py-3 text-right font-mono text-red-500/90">
                                                {item.type === 'EXPENSE' && new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(item.amount)}
                                            </td>
                                            <td className="px-4 py-3 text-center">
                                                <span className={cn(
                                                    "text-[10px] uppercase font-bold",
                                                    item.status === 'PAID' ? "text-green-500" : "text-amber-500"
                                                )}>
                                                    {item.status}
                                                </span>
                                            </td>
                                            <td className="px-4 py-3 text-center">
                                                {item.status === 'PROJECTED' && (
                                                    <Button
                                                        variant="ghost"
                                                        size="sm"
                                                        className="h-6 text-[10px] px-2 bg-primary/10 hover:bg-primary/20 text-primary"
                                                        onClick={() => handleConfirmItem(item)}
                                                    >
                                                        Confirm
                                                    </Button>
                                                )}
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                            <tfoot className="bg-muted/50 font-bold">
                                <tr>
                                    <td colSpan={3} className="px-4 py-3 text-right">Totals</td>
                                    <td className="px-4 py-3 text-right text-green-500">
                                        {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(totalIncome)}
                                    </td>
                                    <td className="px-4 py-3 text-right text-red-500">
                                        {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(totalExpense)}
                                    </td>
                                    <td className="px-4 py-3 text-center">
                                        {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(balance)}
                                    </td>
                                </tr>
                            </tfoot>
                        </table>
                    </div>
                </Card>
            </div>

            <Modal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                title={isConfirming ? `Confirm ${formData.title || 'Item'}` : (isEditing ? "Edit Financial Item" : "Add Financial Item")}
            >
                <form onSubmit={handleSubmit} className="space-y-4">
                    {/* Type Selector - Hide when confirming */}
                    {!isConfirming && (
                        <div className="grid grid-cols-2 gap-2 bg-muted p-1 rounded-lg mb-4">
                            <button
                                type="button"
                                onClick={() => setItemType('one-time')}
                                className={cn(
                                    "py-2 text-sm font-medium rounded-md transition-all",
                                    itemType === 'one-time' ? "bg-background shadow text-foreground" : "text-muted-foreground hover:text-foreground"
                                )}
                            >
                                One-time
                            </button>
                            <button
                                type="button"
                                onClick={() => setItemType('recurring')}
                                className={cn(
                                    "py-2 text-sm font-medium rounded-md transition-all",
                                    itemType === 'recurring' ? "bg-background shadow text-foreground" : "text-muted-foreground hover:text-foreground"
                                )}
                            >
                                Recurring
                            </button>
                        </div>
                    )}

                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <Label>Transaction Type</Label>
                            <select
                                className="w-full flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-base ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 md:text-sm"
                                value={formData.type}
                                onChange={e => setFormData({ ...formData, type: e.target.value })}
                            >
                                <option value="EXPENSE">Expense</option>
                                <option value="INCOME">Income</option>
                            </select>
                        </div>
                        <div>
                            <Label>Amount (R$)</Label>
                            <Input
                                type="number"
                                step="0.01"
                                value={formData.amount}
                                onChange={e => setFormData({ ...formData, amount: e.target.value })}
                                placeholder="0.00"
                                disabled={itemType === 'recurring' && formData.isVariable}
                                required={!(itemType === 'recurring' && formData.isVariable)}
                            />
                        </div>
                    </div>

                    <div>
                        <Label>Name / Description</Label>
                        <Input
                            value={formData.title}
                            onChange={e => setFormData({ ...formData, title: e.target.value })}
                            placeholder="e.g. Grocery, Salary, Rent"
                            required
                        />
                    </div>

                    {itemType === 'one-time' ? (
                        <div>
                            <Label>Date</Label>
                            <Input
                                type="date"
                                value={formData.date}
                                onChange={e => setFormData({ ...formData, date: e.target.value })}
                                required
                            />
                        </div>
                    ) : (
                        <div className="space-y-4">
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <Label>Frequency</Label>
                                    <select
                                        className="w-full flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-base ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 md:text-sm"
                                        value={formData.frequency}
                                        onChange={e => setFormData({ ...formData, frequency: e.target.value })}
                                    >
                                        <option value="WEEKLY">Weekly</option>
                                        <option value="BIWEEKLY">Bi-weekly (14 days)</option>
                                        <option value="MONTHLY">Monthly</option>
                                        <option value="YEARLY">Yearly</option>
                                    </select>
                                </div>
                                <div>
                                    <Label>Start Date</Label>
                                    <Input
                                        type="date"
                                        value={formData.startDate}
                                        onChange={e => setFormData({ ...formData, startDate: e.target.value })}
                                        required
                                    />
                                </div>
                                <div>
                                    <Label>End Date (Optional)</Label>
                                    <Input
                                        type="date"
                                        value={formData.endDate}
                                        onChange={e => setFormData({ ...formData, endDate: e.target.value })}
                                        placeholder="Optional"
                                    />
                                </div>
                            </div>

                            <div className="flex items-center gap-2">
                                <input
                                    type="checkbox"
                                    id="isVariable"
                                    checked={formData.isVariable}
                                    onChange={e => setFormData({ ...formData, isVariable: e.target.checked })}
                                    className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary"
                                />
                                <Label htmlFor="isVariable" className="mb-0">Variable Price? (Confirm amount monthly)</Label>
                            </div>
                        </div>
                    )}

                    <div className="flex justify-end gap-3 mt-6">
                        <Button type="button" variant="ghost" onClick={() => setIsModalOpen(false)}>
                            Cancel
                        </Button>
                        <Button type="submit">
                            {isConfirming ? 'Confirm & Save' : (itemType === 'one-time' ? 'Add Transaction' : 'Create Recurring Item')}
                        </Button>
                    </div>
                </form>
            </Modal>
        </div>
    );
}
