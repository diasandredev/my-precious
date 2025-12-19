import { useState, useMemo } from 'react';
import { useData } from '../contexts/DataContext';
import { format } from 'date-fns';
import { fetchExchangeRates } from '../lib/currency';

export function useAccountsData() {
    const { data, addAccount, updateAccount, deleteAccount, addSnapshot, deleteSnapshot, formatCurrency } = useData();
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingAccount, setEditingAccount] = useState(null);
    const [isLoadingRates, setIsLoadingRates] = useState(false);

    // Balance update state
    const [isUpdateMode, setIsUpdateMode] = useState(false);
    const [selectedDate, setSelectedDate] = useState(format(new Date(), 'yyyy-MM-dd'));
    const [newBalances, setNewBalances] = useState({});

    // History Pagination
    const [historyPage, setHistoryPage] = useState(1);
    const ITEMS_PER_PAGE = 10;

    const [formData, setFormData] = useState({
        name: '',
        type: 'Bank',
        currency: 'BRL'
    });

    // Get latest balances for display
    const sortedSnapshots = useMemo(() => {
        return [...data.snapshots].sort((a, b) => new Date(b.date) - new Date(a.date));
    }, [data.snapshots]);

    const latestRates = useMemo(() => {
        return sortedSnapshots[0] ? sortedSnapshots[0].rates || {} : {};
    }, [sortedSnapshots]);

    const latestBalances = useMemo(() => {
        return sortedSnapshots[0] ? sortedSnapshots[0].balances : {};
    }, [sortedSnapshots]);

    const totalNetWorth = useMemo(() => {
        return Object.entries(latestBalances).reduce((total, [accountId, balance]) => {
            const account = data.accounts.find(a => a.id === accountId);
            if (!account) return total;

            const currency = account.currency || 'BRL';
            let rate = 1;
            if (currency !== 'BRL') {
                rate = latestRates[currency] || 0;
            }
            return total + (balance * rate);
        }, 0);
    }, [latestBalances, data.accounts, latestRates]);

    const totalPages = Math.ceil(sortedSnapshots.length / ITEMS_PER_PAGE);

    const visibleSnapshots = useMemo(() => {
        const start = (historyPage - 1) * ITEMS_PER_PAGE;
        return sortedSnapshots.slice(start, start + ITEMS_PER_PAGE);
    }, [sortedSnapshots, historyPage]);

    const handleOpenModal = (account = null) => {
        if (account) {
            setEditingAccount(account);
            setFormData({ name: account.name, type: account.type, currency: account.currency });
        } else {
            setEditingAccount(null);
            setFormData({ name: '', type: 'Bank', currency: 'BRL' });
        }
        setIsModalOpen(true);
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        if (editingAccount) {
            updateAccount(editingAccount.id, formData);
        } else {
            addAccount(formData);
        }
        setIsModalOpen(false);
    };

    const handleDelete = (id) => {
        if (confirm('Are you sure you want to delete this account?')) {
            deleteAccount(id);
        }
    };

    const handleDeleteSnapshot = (e, id) => {
        e.stopPropagation();
        if (confirm('Are you sure you want to delete this snapshot?')) {
            deleteSnapshot(id);
        }
    };

    const handleUpdateBalances = () => {
        // Pre-fill with latest balances
        setNewBalances(latestBalances);
        setIsUpdateMode(true);
        setSelectedDate(format(new Date(), 'yyyy-MM-dd'));
    };

    const handleEditSnapshot = (snapshot) => {
        setNewBalances(snapshot.balances);
        setSelectedDate(snapshot.date);
        setIsUpdateMode(true);
    };

    const saveBalances = async () => {
        setIsLoadingRates(true);
        try {
            // Identify active currencies from data.accounts
            const activeCurrencies = data.accounts
                .map(acc => acc.currency)
                .filter(c => c && c !== 'BRL'); // Filter out undefined/BRL

            // Check if we already have rates for this date
            const existingSnapshot = data.snapshots.find(s => s.date === selectedDate);

            let rates = {};

            if (activeCurrencies.length === 0) {
                // If only BRL, we don't need new rates. Use existing if available (re-saving).
                rates = existingSnapshot?.rates || {};
            } else {
                // Use optional chaining for safety, but typically we want to know if existingSnapshot is defined first
                const hasAllRates = existingSnapshot && activeCurrencies.every(c => existingSnapshot.rates?.[c]);

                if (hasAllRates) {
                    console.log("Using existing rates from snapshot");
                    rates = existingSnapshot.rates;
                } else {
                    rates = await fetchExchangeRates(selectedDate, activeCurrencies);
                }
            }

            addSnapshot({
                date: selectedDate,
                balances: newBalances,
                rates: rates
            });
            setIsUpdateMode(false);
        } catch (error) {
            console.error("Error saving snapshot:", error);
            alert("Failed to update snapshot (Rate Fetch Error).");
        } finally {
            setIsLoadingRates(false);
        }
    };

    return {
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
        ITEMS_PER_PAGE,
        formData,
        setFormData,
        sortedSnapshots, // needed?
        latestRates, // needed?
        latestBalances, // needed for table
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
        formatCurrency // from context
    };
}
