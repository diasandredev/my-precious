import { format, isSameMonth, isSameDay } from 'date-fns';
import { Plus } from 'lucide-react';
import { cn } from '../../lib/utils';
import { categorizeTransaction } from '../../lib/categorizer';

export function CalendarGrid({ daysInMonth, currentMonth, getItemsForDay, onDayClick }) {
    const weekDays = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];

    return (
        <div className="bg-white rounded-2xl shadow-xs border border-slate-200/80 overflow-hidden mb-6">
            <div className="grid grid-cols-7 border-b border-slate-100 bg-slate-50/75">
                {weekDays.map(day => (
                    <div key={day} className="py-3 text-center text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                        {day}
                    </div>
                ))}
            </div>
            <div className="grid grid-cols-7 divide-x divide-y divide-slate-100">
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
                                "min-h-[115px] p-2 relative group transition-all cursor-pointer hover:bg-slate-50/80",
                                !isCurrentMonth && "bg-slate-50/40 text-slate-400",
                            )}
                        >
                            <div className="flex justify-between items-start mb-1.5 relative z-10">
                                <span className={cn(
                                    "text-xs font-bold w-6 h-6 flex items-center justify-center rounded-lg transition-all font-mono",
                                    isToday
                                        ? "bg-slate-900 text-white shadow-xs shadow-slate-900/20"
                                        : !isCurrentMonth ? "text-slate-300" : "text-slate-700"
                                )}>
                                    {format(day, 'd')}
                                </span>
                            </div>

                            <div className="space-y-1 relative z-10">
                                {hasItems && (
                                    <div className="flex flex-col items-end gap-1 mt-0.5">
                                        {dailyIncome > 0 && (
                                            <div className="text-[10px] font-extrabold font-mono text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded-md border border-emerald-200/60 shadow-xs">
                                                +R$ {dailyIncome.toLocaleString('pt-BR')}
                                            </div>
                                        )}
                                        {dailyExpense > 0 && (
                                            <div className="text-[10px] font-extrabold font-mono text-rose-700 bg-rose-50 px-1.5 py-0.5 rounded-md border border-rose-200/60 shadow-xs">
                                                -R$ {dailyExpense.toLocaleString('pt-BR')}
                                            </div>
                                        )}
                                    </div>
                                )}
                            </div>

                            <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity bg-slate-900/5 backdrop-blur-[1px] rounded-lg m-1">
                                <div className="bg-slate-900 text-white rounded-full p-1.5 shadow-sm">
                                    <Plus size={16} strokeWidth={2.5} />
                                </div>
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
}
