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

            {/* Total Net Worth Card */}
            <Card className="p-6 bg-white border-gray-100 shadow-sm">
                <div className="flex items-center justify-between">
                    <div>
                        <p className="text-sm font-medium text-gray-400 uppercase tracking-wider">Total Net Worth</p>
                        <h3 className="text-4xl font-bold text-gray-900 mt-2">
                            {formatCurrency ? formatCurrency(totalNetWorth) : `$${totalNetWorth}`}
                        </h3>
                    </div>
                </div>
            </Card>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
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
