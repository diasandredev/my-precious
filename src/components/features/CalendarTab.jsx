import { useState } from 'react';
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameDay, addMonths, subMonths, isToday, getDate } from 'date-fns';
import { ChevronLeft, ChevronRight, Plus, Trash2, Settings } from 'lucide-react';
import { useData } from '../../contexts/DataContext';
import { Button, Input, Label, Modal } from '../ui';
import { cn } from '../../lib/utils';

export function CalendarTab() {
    const { data, addFixedExpense, deleteFixedExpense } = useData();
    const [currentMonth, setCurrentMonth] = useState(new Date());
    const [isModalOpen, setIsModalOpen] = useState(false);

    const [formData, setFormData] = useState({
        name: '',
        amount: '',
        dayDue: '1',
        frequency: 'Monthly'
    });

    const daysInMonth = eachDayOfInterval({
        start: startOfMonth(currentMonth),
        end: endOfMonth(currentMonth)
    });

    const handlePrevMonth = () => setCurrentMonth(subMonths(currentMonth, 1));
    const handleNextMonth = () => setCurrentMonth(addMonths(currentMonth, 1));

    const handleSubmit = (e) => {
        e.preventDefault();
        addFixedExpense({
            name: formData.name,
            amount: parseFloat(formData.amount),
            dayDue: parseInt(formData.dayDue),
            frequency: formData.frequency
        });
        setIsModalOpen(false);
        setFormData({ name: '', amount: '', dayDue: '1', frequency: 'Monthly' });
    };

    const getExpensesForDay = (day) => {
        const dayNum = getDate(day);
        return data.fixedExpenses.filter(expense => expense.dayDue === dayNum);
    };

    return (
        <div className="h-full flex flex-col">
            {/* Calendar Header */}
            <div className="flex items-center justify-between mb-8 px-2">
                <div className="flex items-center gap-4">
                    <h2 className="text-4xl font-bold text-primary tracking-tight">
                        {format(currentMonth, 'MMMM yyyy')}
                    </h2>
                    <div className="flex items-center gap-1 bg-card rounded-full p-1 border">
                        <Button variant="ghost" size="icon" onClick={handlePrevMonth} className="h-8 w-8 rounded-full">
                            <ChevronLeft size={18} />
                        </Button>
                        <Button variant="ghost" size="icon" onClick={handleNextMonth} className="h-8 w-8 rounded-full">
                            <ChevronRight size={18} />
                        </Button>
                    </div>
                </div>

                <div className="flex items-center gap-3">
                    <Button onClick={() => setIsModalOpen(true)} className="gap-2">
                        <Plus size={18} />
                        <span>New Expense</span>
                    </Button>
                    <Button variant="ghost" size="icon" className="text-muted-foreground hover:text-foreground">
                        <Settings size={20} />
                    </Button>
                </div>
            </div>

            {/* Column-based Calendar View */}
            <div className="flex-1 overflow-x-auto pb-4 custom-scrollbar">
                <div className="flex gap-px h-full min-w-max bg-border border-t">
                    {daysInMonth.map(day => {
                        const expenses = getExpensesForDay(day);
                        const isCurrentDay = isToday(day);

                        return (
                            <div
                                key={day.toString()}
                                className={cn(
                                    "flex flex-col w-[240px] bg-background h-full group relative transition-colors",
                                    isCurrentDay && "bg-primary/5"
                                )}
                            >
                                {/* Day Header */}
                                <div className={cn(
                                    "p-4 border-b",
                                    isCurrentDay ? "border-primary/30" : "border-border"
                                )}>
                                    <div className="flex items-baseline justify-between mb-1">
                                        <span className={cn(
                                            "text-2xl font-bold",
                                            isCurrentDay ? "text-primary" : "text-foreground"
                                        )}>
                                            {format(day, 'd')}
                                        </span>
                                        <span className="text-sm font-medium text-muted-foreground uppercase tracking-wider">
                                            {format(day, 'EEE')}
                                        </span>
                                    </div>
                                    {isCurrentDay && (
                                        <div className="h-0.5 w-full bg-primary mt-2 shadow-[0_0_10px_hsl(var(--primary))]" />
                                    )}
                                </div>

                                {/* Day Content */}
                                <div className="flex-1 p-3 space-y-3 overflow-y-auto">
                                    {expenses.map(expense => (
                                        <div
                                            key={expense.id}
                                            className="group/card relative p-3 rounded-lg bg-card border hover:border-primary/50 hover:bg-accent transition-all cursor-pointer shadow-sm"
                                        >
                                            <div className="flex items-start justify-between mb-2">
                                                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-primary/10 text-primary border border-primary/20 uppercase tracking-wider">
                                                    Bill
                                                </span>
                                                <button
                                                    onClick={(e) => { e.stopPropagation(); deleteFixedExpense(expense.id); }}
                                                    className="opacity-0 group-hover/card:opacity-100 text-destructive hover:bg-destructive/10 p-1 rounded transition-all"
                                                >
                                                    <Trash2 size={14} />
                                                </button>
                                            </div>

                                            <h4 className="text-sm font-medium text-foreground mb-1 truncate" title={expense.name}>
                                                {expense.name}
                                            </h4>
                                            <p className="text-xs text-muted-foreground font-mono">
                                                {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(expense.amount)}
                                            </p>
                                        </div>
                                    ))}

                                    {/* Empty State Placeholder on Hover */}
                                    <div className="opacity-0 group-hover:opacity-100 transition-opacity flex justify-center pt-4">
                                        <Button
                                            variant="outline"
                                            size="icon"
                                            onClick={() => {
                                                setFormData(prev => ({ ...prev, dayDue: getDate(day).toString() }));
                                                setIsModalOpen(true);
                                            }}
                                            className="rounded-full border-dashed border-muted-foreground/50 text-muted-foreground hover:text-primary hover:border-primary"
                                        >
                                            <Plus size={16} />
                                        </Button>
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>

            <Modal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                title="Add Fixed Expense"
            >
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <Label>Expense Name</Label>
                        <Input
                            value={formData.name}
                            onChange={e => setFormData({ ...formData, name: e.target.value })}
                            placeholder="e.g. Rent, Netflix"
                            required
                        />
                    </div>

                    <div>
                        <Label>Amount (R$)</Label>
                        <Input
                            type="number"
                            step="0.01"
                            value={formData.amount}
                            onChange={e => setFormData({ ...formData, amount: e.target.value })}
                            placeholder="0.00"
                            required
                        />
                    </div>

                    <div>
                        <Label>Day of Month Due</Label>
                        <Input
                            type="number"
                            min="1"
                            max="31"
                            value={formData.dayDue}
                            onChange={e => setFormData({ ...formData, dayDue: e.target.value })}
                            required
                        />
                    </div>

                    <div className="flex justify-end gap-3 mt-6">
                        <Button type="button" variant="ghost" onClick={() => setIsModalOpen(false)}>
                            Cancel
                        </Button>
                        <Button type="submit">
                            Add Expense
                        </Button>
                    </div>
                </form>
            </Modal>
        </div>
    );
}
