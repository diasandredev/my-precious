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
                                : "hover:bg-gray-50 border-transparent hover:border-gray-100 group"
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

                        <div className="flex items-center gap-3">
                            <div className="text-right">
                                <div className="text-sm font-bold text-gray-900">
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
                                className="h-8 w-8 text-gray-400 hover:text-red-500 hover:bg-red-50 -mr-2 opacity-0 group-hover:opacity-100 transition-opacity"
                            >
                                <Trash2 size={14} />
                            </Button>
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
    );
}
