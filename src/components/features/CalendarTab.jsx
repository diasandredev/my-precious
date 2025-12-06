import { useState } from 'react';
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameDay, addMonths, subMonths, isToday, getDate, startOfWeek, endOfWeek } from 'date-fns';
import { ChevronLeft, ChevronRight, Plus, Trash2, Settings, Calendar as CalendarIcon, DollarSign } from 'lucide-react';
import { useData } from '../../contexts/DataContext';
import { Button, Input, Label, Modal, Card } from '../ui';
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

    const monthStart = startOfMonth(currentMonth);
    const monthEnd = endOfMonth(monthStart);
    const startDate = startOfWeek(monthStart);
    const endDate = endOfWeek(monthEnd);

    const calendarDays = eachDayOfInterval({
        start: startDate,
        end: endDate
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
        // Only show expenses for days in the current month to avoid confusion, 
        // or show them if they match the day number? 
        // Fixed expenses are usually "Day X of every month".
        // So we should check if the day is in the currently viewed month, 
        // OR just match the day number if we assume it applies to all displayed days.
        // But typically fixed expenses are monthly.
        // Let's only show for days within the current month view to keep it clean,
        // or if it's the padding days, show for that month?
        // Simpler: Match day number.
        return data.fixedExpenses.filter(expense => expense.dayDue === dayNum);
    };

    const totalFixedExpenses = data.fixedExpenses.reduce((acc, curr) => acc + curr.amount, 0);

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

                <Button onClick={() => setIsModalOpen(true)} className="gap-2 shadow-lg shadow-primary/20">
                    <Plus size={18} />
                    <span>New Expense</span>
                </Button>
            </div>

            {/* Grid Calendar View */}
            <Card className="p-1 bg-card/50 backdrop-blur-sm border-border/50">
                <div className="grid grid-cols-7 mb-1">
                    {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
                        <div key={day} className="p-4 text-center text-sm font-semibold text-muted-foreground uppercase tracking-wider">
                            {day}
                        </div>
                    ))}
                </div>
                <div className="grid grid-cols-7 gap-px bg-border rounded-lg overflow-hidden border border-border">
                    {calendarDays.map((day, dayIdx) => {
                        const expenses = getExpensesForDay(day);
                        const isCurrentMonth = day.getMonth() === currentMonth.getMonth();
                        const isCurrentDay = isToday(day);

                        return (
                            <div
                                key={day.toString()}
                                className={cn(
                                    "min-h-[120px] p-2 transition-colors relative group flex flex-col gap-1",
                                    !isCurrentMonth ? "bg-[rgb(36,37,55)] text-muted-foreground/50" : "bg-background",
                                    isCurrentMonth && "hover:bg-[#35374C]"
                                )}
                                onClick={() => {
                                    setFormData(prev => ({ ...prev, dayDue: getDate(day).toString() }));
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
                                    {expenses.length > 0 && (
                                        <span className="text-[10px] font-bold text-muted-foreground">
                                            {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(expenses.reduce((a, b) => a + b.amount, 0))}
                                        </span>
                                    )}
                                </div>

                                <div className="flex-1 flex flex-col gap-1 mt-1 overflow-y-auto custom-scrollbar max-h-[80px]">
                                    {expenses.map(expense => (
                                        <div
                                            key={expense.id}
                                            className="text-xs p-1.5 rounded bg-card border border-border/50 truncate group/item hover:border-primary/50 transition-colors flex items-center justify-between"
                                            title={`${expense.name} - R$ ${expense.amount}`}
                                            onClick={(e) => e.stopPropagation()}
                                        >
                                            <span className="truncate flex-1">{expense.name}</span>
                                            <button
                                                onClick={(e) => { e.stopPropagation(); deleteFixedExpense(expense.id); }}
                                                className="opacity-0 group-hover/item:opacity-100 text-destructive hover:bg-destructive/10 p-0.5 rounded ml-1"
                                            >
                                                <Trash2 size={10} />
                                            </button>
                                        </div>
                                    ))}
                                </div>
                                <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 pointer-events-none">
                                    <Plus className="text-muted-foreground/50 w-8 h-8" />
                                </div>
                            </div>
                        );
                    })}
                </div>
            </Card>

            {/* Fixed Expenses List Section */}
            < div className="space-y-4" >
                <div className="flex items-center justify-between">
                    <h3 className="text-xl font-bold text-foreground flex items-center gap-2">
                        <DollarSign className="text-primary" />
                        Fixed Expenses List
                    </h3>
                    <div className="text-sm text-muted-foreground bg-card px-3 py-1 rounded-full border">
                        Total Monthly: <span className="text-foreground font-bold">{new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(totalFixedExpenses)}</span>
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {data.fixedExpenses.sort((a, b) => a.dayDue - b.dayDue).map(expense => (
                        <Card key={expense.id} className="p-4 flex items-center justify-between group hover:border-primary/50 transition-all">
                            <div className="flex items-center gap-4">
                                <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold">
                                    {expense.dayDue}
                                </div>
                                <div>
                                    <div className="font-semibold text-foreground">{expense.name}</div>
                                    <div className="text-sm text-muted-foreground">{expense.frequency}</div>
                                </div>
                            </div>
                            <div className="flex items-center gap-3">
                                <div className="font-mono font-medium text-foreground">
                                    {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(expense.amount)}
                                </div>
                                <Button
                                    variant="ghost"
                                    size="icon"
                                    onClick={() => deleteFixedExpense(expense.id)}
                                    className="opacity-0 group-hover:opacity-100 text-destructive hover:text-destructive hover:bg-destructive/10 h-8 w-8"
                                >
                                    <Trash2 size={16} />
                                </Button>
                            </div>
                        </Card>
                    ))}

                    {data.fixedExpenses.length === 0 && (
                        <div className="col-span-full py-8 text-center text-muted-foreground border border-dashed border-border rounded-xl bg-card/50">
                            No fixed expenses registered. Click "New Expense" to add one.
                        </div>
                    )}
                </div>
            </div >

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
        </div >
    );
}
