import { format, isSameMonth, isSameDay } from 'date-fns';
import { Plus } from 'lucide-react';
import { cn } from '../../lib/utils';
import { categorizeTransaction } from '../../lib/categorizer';

export function CalendarGrid({ daysInMonth, currentMonth, getItemsForDay, onDayClick }) {
    const weekDays = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

    return (
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
            <div className="grid grid-cols-7 border-b border-gray-100 bg-gray-50">
                {weekDays.map(day => (
                    <div key={day} className="py-3 text-center text-xs font-semibold text-gray-400 uppercase tracking-wider">
                        {day}
                    </div>
                ))}
            </div>
            <div className="grid grid-cols-7">
                {daysInMonth.map((day, dayIdx) => {
                    const items = getItemsForDay(day);

                    const hasItems = items.length > 0;
                    const isToday = isSameDay(day, new Date());
                    const isCurrentMonth = isSameMonth(day, currentMonth);

                    // Calculate totals separately for Income and Expense
                    const dailyIncome = items.filter(i => i.type === 'INCOME').reduce((s, i) => s + parseFloat(i.amount), 0);
                    const dailyExpense = items.filter(i => i.type === 'EXPENSE').reduce((s, i) => s + parseFloat(i.amount), 0);

                    return (
                        <div
                            key={day.toString()}
                            onClick={() => onDayClick(day)}
                            className={cn(
                                "min-h-[120px] p-2 border-b border-r border-gray-100 relative group transition-all cursor-pointer hover:bg-gray-50/80",
                                !isCurrentMonth && "bg-gray-100", // Darker background for outside month
                            )}
                        >
                            <div className="flex justify-between items-start mb-2 relative z-10">
                                <span className={cn(
                                    "text-sm font-medium w-7 h-7 flex items-center justify-center rounded-full transition-colors",
                                    isToday
                                        ? "bg-black text-white shadow-sm"
                                        : !isCurrentMonth ? "text-gray-400" : "text-gray-700"
                                )}>
                                    {format(day, 'd')}
                                </span>
                                {hasItems && (
                                    /* Small indicator dot or nothing in header, main content is below */
                                    <div />
                                )}
                            </div>

                            <div className="space-y-1 relative z-10">
                                {hasItems && (
                                    <div className="flex flex-col items-end gap-1 mt-0">
                                        {dailyIncome > 0 && (
                                            <div className="text-[10px] font-bold text-emerald-600 bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-100/50">
                                                +R$ {dailyIncome.toLocaleString()}
                                            </div>
                                        )}
                                        {dailyExpense > 0 && (
                                            <div className="text-[10px] font-bold text-red-600 bg-red-50 px-1.5 py-0.5 rounded border border-red-100/50">
                                                -R$ {dailyExpense.toLocaleString()}
                                            </div>
                                        )}
                                    </div>
                                )}
                            </div>

                            <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                                <div className="bg-black/10 text-black rounded-full p-2">
                                    <Plus size={24} strokeWidth={1.5} />
                                </div>
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
}
