import { useState, useEffect } from 'react';
import { RefreshCw, Check as CheckIcon } from 'lucide-react';
import { cn } from '../../lib/utils';
import { syncPendingActions, getPendingActionCount } from '../../services/sync';

export function SyncStatus() {
    const [pendingCount, setPendingCount] = useState(0);
    const [isSyncing, setIsSyncing] = useState(false);

    useEffect(() => {
        const interval = setInterval(async () => {
            setPendingCount(await getPendingActionCount());
        }, 1000);
        return () => clearInterval(interval);
    }, []);

    const handleSync = async () => {
        setIsSyncing(true);
        await syncPendingActions();
        setPendingCount(await getPendingActionCount());
        setIsSyncing(false);
    };

    return (
        <button
            onClick={handleSync}
            className={cn(
                "group flex items-center justify-center gap-0 text-sm font-medium transition-all duration-300 ease-in-out px-2 py-2 rounded-full shadow-sm border",
                pendingCount > 0
                    ? "bg-amber-50 text-amber-600 border-amber-200 hover:bg-amber-100"
                    : "bg-white text-emerald-600 border-gray-200 hover:bg-gray-50"
            )}
            title={pendingCount > 0 ? `${pendingCount} unsaved changes` : "Synced"}
        >
            <div className="flex-shrink-0 flex items-center justify-center">
                {pendingCount > 0 ? (
                    <RefreshCw size={18} className={cn(isSyncing && "animate-spin")} />
                ) : (
                    <CheckIcon size={18} />
                )}
            </div>
            <span className="overflow-hidden whitespace-nowrap max-w-0 opacity-0 group-hover:max-w-[250px] group-hover:opacity-100 transition-all duration-500 ease-in-out">
                <span className="pl-2 block">
                    {isSyncing
                        ? "Syncing..."
                        : pendingCount > 0
                            ? `${pendingCount} unsaved changes`
                            : "Synced less than a minute ago"}
                </span>
            </span>
        </button>
    );
}
