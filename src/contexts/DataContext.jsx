import { createContext, useContext, useState, useEffect } from 'react';
import { v4 as uuidv4 } from 'uuid';

const DataContext = createContext();

const STORAGE_KEY = 'my_precious_data_v1';

const initialData = {
    accounts: [],
    snapshots: [],
    fixedExpenses: [],
};

export function DataProvider({ children }) {
    const [data, setData] = useState(() => {
        const saved = localStorage.getItem(STORAGE_KEY);
        const parsed = saved ? JSON.parse(saved) : initialData;
        // Migration/Initialization for new fields
        return {
            ...initialData,
            ...parsed,
            fixedItems: parsed.fixedItems || [], // Replaces fixedExpenses eventually
            transactions: parsed.transactions || [],
            settings: parsed.settings || { mainCurrency: 'BRL' } // Default settings
        };
    });

    useEffect(() => {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
    }, [data]);

    // --- Actions ---

    // Settings
    const updateSettings = (newSettings) => {
        setData(prev => ({
            ...prev,
            settings: { ...prev.settings, ...newSettings }
        }));
    };

    // Helper to format currency based on settings
    const formatCurrency = (value) => {
        const currency = data.settings.mainCurrency || 'BRL';
        return new Intl.NumberFormat(
            currency === 'BRL' ? 'pt-BR' : 'en-US',
            { style: 'currency', currency: currency }
        ).format(value);
    };

    // Accounts
    const addAccount = (account) => {
        setData(prev => ({
            ...prev,
            accounts: [...prev.accounts, {
                ...account,
                id: account.id || uuidv4(),
                createdAt: account.createdAt || new Date().toISOString()
            }]
        }));
    };

    const updateAccount = (id, updates) => {
        setData(prev => ({
            ...prev,
            accounts: prev.accounts.map(acc => acc.id === id ? { ...acc, ...updates } : acc)
        }));
    };

    const deleteAccount = (id) => {
        setData(prev => ({
            ...prev,
            accounts: prev.accounts.filter(acc => acc.id !== id)
        }));
    };

    // Snapshots (Balance History)
    const addSnapshot = (snapshot) => {
        setData(prev => {
            const existingIndex = prev.snapshots.findIndex(s => s.date === snapshot.date);
            if (existingIndex >= 0) {
                const newSnapshots = [...prev.snapshots];
                newSnapshots[existingIndex] = { ...newSnapshots[existingIndex], ...snapshot };
                return { ...prev, snapshots: newSnapshots };
            }
            return {
                ...prev,
                snapshots: [...prev.snapshots, { ...snapshot, id: snapshot.id || uuidv4() }]
            };
        });
    };

    // Legacy Fixed Expenses (Keep for now or migrate? Let's keep for backward compat but use new system)
    const addFixedExpense = (expense) => {
        // Auto-migrate to new fixedItems if possible, or just keep as is.
        // For now, let's just add to the legacy array to not break current UI, 
        // BUT we should probably start using fixedItems.
        setData(prev => ({
            ...prev,
            fixedExpenses: [...prev.fixedExpenses, { ...expense, id: uuidv4() }]
        }));
    };

    const deleteFixedExpense = (id) => {
        setData(prev => ({
            ...prev,
            fixedExpenses: prev.fixedExpenses.filter(exp => exp.id !== id)
        }));
    };

    // --- NEW Financial Actions ---

    // Fixed Items (Recurring Income/Expense)
    const addFixedItem = (item) => {
        setData(prev => ({
            ...prev,
            fixedItems: [...prev.fixedItems, { ...item, id: item.id || uuidv4() }]
        }));
    };

    const updateFixedItem = (id, updates) => {
        setData(prev => ({
            ...prev,
            fixedItems: prev.fixedItems.map(item => item.id === id ? { ...item, ...updates } : item)
        }));
    };

    const deleteFixedItem = (id) => {
        setData(prev => ({
            ...prev,
            fixedItems: prev.fixedItems.filter(item => item.id !== id)
        }));
    };

    // Transactions (One-time or realized fixed items)
    const addTransaction = (transaction) => {
        setData(prev => ({
            ...prev,
            transactions: [...prev.transactions, { ...transaction, id: transaction.id || uuidv4() }]
        }));
    };

    const updateTransaction = (id, updates) => {
        setData(prev => ({
            ...prev,
            transactions: prev.transactions.map(t => t.id === id ? { ...t, ...updates } : t)
        }));
    };

    const deleteTransaction = (id) => {
        setData(prev => ({
            ...prev,
            transactions: prev.transactions.filter(t => t.id !== id)
        }));
    };

    return (
        <DataContext.Provider value={{
            data,
            addAccount,
            updateAccount,
            deleteAccount,
            addSnapshot,
            addFixedExpense,
            deleteFixedExpense,
            // New exports
            addFixedItem,
            updateFixedItem,
            deleteFixedItem,
            addTransaction,
            updateTransaction,
            deleteTransaction,
            // Settings
            updateSettings,
            formatCurrency
        }}>
            {children}
        </DataContext.Provider>
    );
}

export function useData() {
    return useContext(DataContext);
}
