import { Edit2, Plus, Calendar, Save } from 'lucide-react';
import { Button } from '../ui/Button';
import { SyncStatus } from '../features/SyncStatus'; // Ensure path is correct, might be ../../features/SyncStatus if inside components/accounts

export function AccountsHeader({
    isUpdateMode,
    setIsUpdateMode,
    selectedDate,
    setSelectedDate,
    handleUpdateBalances,
    handleOpenModal,
    saveBalances,
    isLoadingRates
}) {
    // Determine path to SyncStatus. If this file is in src/components/accounts, 
    // and SyncStatus is in src/components/features, then import is correct as ../features/SyncStatus?
    // Wait, components/accounts -> .. -> components -> features -> SyncStatus.
    // So import { SyncStatus } from '../features/SyncStatus'; is WRONG.
    // It should be '../features/SyncStatus' relative to 'components/accounts'? No.
    // 'components/accounts' is sibling to 'components/features'.
    // So '../features/SyncStatus' is correct.
    // BUT SyncStatus export is named or default?
    // In AccountsTab original: import { SyncStatus } from './SyncStatus'; (same dir).
    // So SyncStatus is probably a named export in SyncStatus.jsx or default.
    // In Step 97 (AccountsTab read), line 9: import { SyncStatus } from './SyncStatus';
    // So it is in components/features/SyncStatus.jsx.
    // From components/accounts, it is ../features/SyncStatus.

    return (
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
                <h2 className="text-2xl font-bold tracking-tight text-gray-900">Accounts & Net Worth</h2>
                <p className="text-gray-500">Manage your asset sources and track their value.</p>
            </div>

            <div className="flex gap-2 items-center">
                <SyncStatus />
                {!isUpdateMode ? (
                    <>
                        <Button onClick={handleUpdateBalances} variant="outline" className="border-gray-200">
                            <Edit2 size={16} className="mr-2" />
                            Update Balances
                        </Button>
                        <Button onClick={() => handleOpenModal()} className="shadow-lg shadow-black/5">
                            <Plus size={18} className="mr-2" />
                            Add Account
                        </Button>
                    </>
                ) : (
                    <>
                        <div className="flex items-center gap-2 bg-white px-3 py-2 rounded-md border border-gray-200 mr-2">
                            <Calendar size={16} className="text-gray-400" />
                            <input
                                type="date"
                                value={selectedDate}
                                onChange={e => setSelectedDate(e.target.value)}
                                className="text-sm border-none focus:outline-none"
                            />
                        </div>
                        <Button onClick={() => setIsUpdateMode(false)} variant="ghost">Cancel</Button>
                        <Button onClick={saveBalances} disabled={isLoadingRates} className="bg-emerald-600 hover:bg-emerald-700 text-white border-0 ring-0 focus:ring-0">
                            <Save size={18} className="mr-2" />
                            {isLoadingRates ? 'Saving...' : 'Save Snapshot'}
                        </Button>
                    </>
                )}
            </div>
        </div>
    );
}
