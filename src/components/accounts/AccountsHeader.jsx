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
            title="Contas & Patrimônio"
            description="Gerencie suas contas bancárias, corretoras e carteiras crypto."
        >
            <div className="flex flex-wrap gap-2.5 items-center">
                <SyncStatus />
                {!isUpdateMode ? (
                    <>
                        <Button onClick={handleUpdateBalances} variant="outline" className="border-slate-200 bg-white hover:bg-slate-50 rounded-xl text-slate-700 text-xs font-semibold shadow-xs">
                            <Edit2 size={15} className="mr-1.5 text-slate-500" />
                            Atualizar Saldos
                        </Button>
                        <Button onClick={() => handleOpenModal()} className="bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-semibold shadow-sm">
                            <Plus size={16} className="mr-1.5" />
                            Nova Conta
                        </Button>
                    </>
                ) : (
                    <>
                        <div className="flex items-center gap-2 bg-white px-3 py-1.5 rounded-xl border border-slate-200 shadow-xs">
                            <Calendar size={15} className="text-slate-400" />
                            <input
                                type="date"
                                value={selectedDate}
                                onChange={e => setSelectedDate(e.target.value)}
                                className="text-xs font-semibold text-slate-700 border-none focus:outline-none bg-transparent"
                            />
                        </div>
                        <Button onClick={() => setIsUpdateMode(false)} variant="ghost" className="rounded-xl text-xs">Cancelar</Button>
                        <Button onClick={saveBalances} disabled={isLoadingRates} className="bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-semibold shadow-sm">
                            <Save size={16} className="mr-1.5" />
                            {isLoadingRates ? 'Salvando...' : 'Salvar Snapshot'}
                        </Button>
                    </>
                )}
            </div>
        </PageHeader>
    );
}

