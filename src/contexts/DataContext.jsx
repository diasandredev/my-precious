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
        return saved ? JSON.parse(saved) : initialData;
    });

    useEffect(() => {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
    }, [data]);

    // --- Actions ---

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
    // Snapshot structure: { id, date: 'YYYY-MM-DD', balances: { accountId: amount } }
    const addSnapshot = (snapshot) => {
        setData(prev => {
            // Check if snapshot for this date already exists
            const existingIndex = prev.snapshots.findIndex(s => s.date === snapshot.date);
            if (existingIndex >= 0) {
                // Update existing
                const newSnapshots = [...prev.snapshots];
                newSnapshots[existingIndex] = { ...newSnapshots[existingIndex], ...snapshot };
                return { ...prev, snapshots: newSnapshots };
            }
            // Add new
            return {
                ...prev,
                snapshots: [...prev.snapshots, { ...snapshot, id: snapshot.id || uuidv4() }]
            };
        });
    };

    // Fixed Expenses
    const addFixedExpense = (expense) => {
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

    return (
        <DataContext.Provider value={{
            data,
            addAccount,
            updateAccount,
            deleteAccount,
            addSnapshot,
            addFixedExpense,
            deleteFixedExpense
        }}>
            {children}
        </DataContext.Provider>
    );
}

export function useData() {
    return useContext(DataContext);
}
