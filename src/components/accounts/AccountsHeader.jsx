import { Edit2, Plus, Calendar, Save } from 'lucide-react';
import { Button } from '../ui/Button';
import { SyncStatus } from '../features/SyncStatus';
import { PageHeader } from '../layout/PageHeader';

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
    return (
        <PageHeader
            title="Accounts & Net Worth"
            description="Manage your asset sources and track their value."
        >
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
        </PageHeader>
    );
}

