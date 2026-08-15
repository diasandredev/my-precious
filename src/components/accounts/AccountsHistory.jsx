import { History, Trash2, ChevronDown } from 'lucide-react';
import { Card } from '../ui/Card';
import { Button } from '../ui/Button';
import { cn } from '../../lib/utils';
import { format, parseISO } from 'date-fns';

export function AccountsHistory({
    sortedSnapshots,
    visibleSnapshots,
    data,
    selectedDate,
    isUpdateMode,
    handleEditSnapshot,
    handleDeleteSnapshot,
    historyPage,
    setHistoryPage,
    totalPages,
    formatCurrency
}) {
    return (
        <Card className="bg-white border-slate-200/80 shadow-xs hover:shadow-md transition-all p-6 rounded-2xl">
            <div className="flex items-center justify-between mb-4">
                <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                    <History size={18} className="text-slate-400" />
                    Histórico de Snapshots
                </h3>
                <span className="text-xs text-slate-400 font-medium">
                    {sortedSnapshots.length} registros
                </span>
            </div>

            <div className="space-y-2 min-h-[300px]">
                {visibleSnapshots.map(snap => (
                    <div
                        key={snap.id}
                        onClick={() => handleEditSnapshot(snap)}
                        className={cn(
                            "flex items-center justify-between p-3 rounded-xl cursor-pointer transition-all border",
                            snap.date === selectedDate && isUpdateMode
                                ? "bg-slate-900 text-white border-slate-900 shadow-sm"
                                : "hover:bg-slate-50 border-slate-100/80 group"
                        )}
                    >
                        <div>
                            <div className={cn(
                                "text-xs font-bold",
                                snap.date === selectedDate && isUpdateMode ? "text-white" : "text-slate-900"
                            )}>
                                {format(parseISO(snap.date), 'dd/MM/yyyy')}
                            </div>
                            <div className={cn(
                                "text-[11px]",
                                snap.date === selectedDate && isUpdateMode ? "text-slate-300" : "text-slate-400"
                            )}>
                                {Object.keys(snap.balances).length} contas
                            </div>
                        </div>

                        <div className="flex items-center gap-2.5">
                            <div className="text-right">
                                <div className={cn(
                                    "text-xs font-extrabold font-mono",
                                    snap.date === selectedDate && isUpdateMode ? "text-white" : "text-slate-900"
                                )}>
                                    {formatCurrency(Object.entries(snap.balances).reduce((total, [accId, bal]) => {
                                        const acc = data.accounts.find(a => a.id === accId);
                                        let r = 1;
                                        const currency = acc?.currency || 'BRL';
                                        if (acc && currency !== 'BRL') {
                                            r = snap.rates?.[currency] || 0;
                                        }
                                        return total + (bal * r);
                                    }, 0))}
                                </div>
                            </div>
                            <Button
                                variant="ghost"
                                size="icon"
                                onClick={(e) => handleDeleteSnapshot(e, snap.id)}
                                className={cn(
                                    "h-7 w-7 rounded-lg -mr-1 opacity-0 group-hover:opacity-100 transition-opacity",
                                    snap.date === selectedDate && isUpdateMode
                                        ? "text-slate-300 hover:text-white hover:bg-slate-800"
                                        : "text-slate-400 hover:text-rose-500 hover:bg-rose-50"
                                )}
                            >
                                <Trash2 size={13} />
                            </Button>
                        </div>
                    </div>
                ))}

                {data.snapshots.length === 0 && (
                    <p className="text-xs text-slate-400 text-center py-8">Nenhum histórico registrado.</p>
                )}
            </div>

            {/* Pagination Controls */}
            {totalPages > 1 && (
                <div className="flex justify-center items-center gap-1.5 mt-6 pt-4 border-t border-slate-100">
                    <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => setHistoryPage(p => Math.max(1, p - 1))}
                        disabled={historyPage === 1}
                        className="h-7 w-7 rounded-lg"
                    >
                        <ChevronDown size={14} className="rotate-90" />
                    </Button>

                    {Array.from({ length: totalPages }, (_, i) => i + 1).map(page => (
                        <Button
                            key={page}
                            variant={historyPage === page ? "default" : "ghost"}
                            size="sm"
                            onClick={() => setHistoryPage(page)}
                            className={cn(
                                "h-7 w-7 p-0 rounded-lg text-xs font-semibold",
                                historyPage === page ? "bg-slate-900 text-white" : "text-slate-500 hover:bg-slate-100"
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
                        className="h-7 w-7 rounded-lg"
                    >
                        <ChevronDown size={14} className="rotate-270" />
                    </Button>
                </div>
            )}
        </Card>
    );
}
