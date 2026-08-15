import { useAccountsData } from '../../hooks/useAccountsData';
import { Helmet } from 'react-helmet-async';
import { AccountsHeader } from '../accounts/AccountsHeader';
import { AccountsTable } from '../accounts/AccountsTable';
import { AccountsHistory } from '../accounts/AccountsHistory';
import { AccountModal } from '../accounts/AccountModal';
import { Card } from '../ui';

export function AccountsTab() {
    const {
        data,
        isModalOpen,
        setIsModalOpen,
        editingAccount,
        isLoadingRates,
        isUpdateMode,
        setIsUpdateMode,
        selectedDate,
        setSelectedDate,
        newBalances,
        setNewBalances,
        historyPage,
        setHistoryPage,
        formData,
        setFormData,
        sortedSnapshots,
        latestRates,
        latestBalances,
        totalNetWorth,
        totalPages,
        visibleSnapshots,
        handleOpenModal,
        handleSubmit,
        handleDelete,
        handleDeleteSnapshot,
        handleUpdateBalances,
        handleEditSnapshot,
        saveBalances,
        formatCurrency
    } = useAccountsData();

    return (
        <div className="space-y-6">
            <Helmet>
                <title>Accounts - Precious</title>
                <meta name="description" content="Manage your bank accounts, investments, and track historical balances." />
                <link rel="canonical" href="https://my-precious-app.com/accounts" />
            </Helmet>

            <AccountsHeader
                isUpdateMode={isUpdateMode}
                setIsUpdateMode={setIsUpdateMode}
                selectedDate={selectedDate}
                setSelectedDate={setSelectedDate}
                handleUpdateBalances={handleUpdateBalances}
                handleOpenModal={handleOpenModal}
                saveBalances={saveBalances}
                isLoadingRates={isLoadingRates}
            />

            {/* Total Net Worth Hero Card */}
            <div className="p-6 bg-gradient-to-br from-slate-900 to-slate-800 text-white rounded-2xl shadow-md border border-slate-700/60 relative overflow-hidden">
                <div className="absolute top-0 right-0 w-80 h-80 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />
                <div className="relative z-10 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div className="space-y-1">
                        <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Patrimônio Líquido Consolidado</p>
                        <h3 className="text-3xl sm:text-4xl font-extrabold text-white font-mono tracking-tight">
                            {formatCurrency ? formatCurrency(totalNetWorth) : `$${totalNetWorth}`}
                        </h3>
                    </div>
                    <div className="flex items-center gap-2 bg-slate-800/80 px-4 py-2 rounded-xl border border-slate-700 text-xs text-slate-300 font-medium">
                        <span>{data.accounts?.length || 0} contas conectadas</span>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
                <AccountsTable
                    accounts={data.accounts}
                    latestBalances={latestBalances}
                    latestRates={latestRates}
                    isUpdateMode={isUpdateMode}
                    newBalances={newBalances}
                    setNewBalances={setNewBalances}
                    handleOpenModal={handleOpenModal}
                    handleDelete={handleDelete}
                    formatCurrency={formatCurrency}
                />

                <AccountsHistory
                    sortedSnapshots={sortedSnapshots}
                    visibleSnapshots={visibleSnapshots}
                    data={data}
                    selectedDate={selectedDate}
                    isUpdateMode={isUpdateMode}
                    handleEditSnapshot={handleEditSnapshot}
                    handleDeleteSnapshot={handleDeleteSnapshot}
                    historyPage={historyPage}
                    setHistoryPage={setHistoryPage}
                    totalPages={totalPages}
                    formatCurrency={formatCurrency}
                />
            </div>

            <AccountModal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                editingAccount={editingAccount}
                formData={formData}
                setFormData={setFormData}
                handleSubmit={handleSubmit}
            />
        </div>
    );
}
