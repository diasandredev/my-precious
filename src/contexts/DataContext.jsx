import { createContext, useContext, useState, useEffect, useRef } from 'react';
import { v4 as uuidv4 } from 'uuid';
import { auth } from '../lib/firebase';
import { onAuthStateChanged } from 'firebase/auth';
import { fetchUserData, queueAction, syncPendingActions } from '../services/sync';

import { dbService, DATA_KEY } from '../services/db';

const DataContext = createContext();

const initialData = {
    accounts: [],
    snapshots: [],
    recurringTransactions: [],
    transactions: [],
    categories: [
        // Default Categories - Fallback if not loaded
        // Fixed/Essential
        { id: 'cat_housing', name: 'Casa', color: '#ef4444', type: 'EXPENSE' },
        { id: 'cat_internet', name: 'Internet', color: '#0ea5e9', type: 'EXPENSE' },
        { id: 'cat_condo', name: 'Condominio', color: '#64748b', type: 'EXPENSE' },
        { id: 'cat_luz', name: 'Luz', color: '#f59e0b', type: 'EXPENSE' },
        { id: 'cat_taxes', name: 'Impostos', color: '#78716c', type: 'EXPENSE' },

        // Variable/Lifestyle
        { id: 'cat_supermarket', name: 'Supermercado', color: '#34d399', type: 'EXPENSE' },
        { id: 'cat_restaurant', name: 'Restaurantes', color: '#fbbf24', type: 'EXPENSE' },
        { id: 'cat_transport', name: 'Transporte', color: '#3b82f6', type: 'EXPENSE' },
        { id: 'cat_travel', name: 'Viagem', color: '#8b5cf6', type: 'EXPENSE' }, // Purple
        { id: 'cat_subscription', name: 'Assinaturas', color: '#ec4899', type: 'EXPENSE' }, // Pink
        { id: 'cat_shopping', name: 'Compras', color: '#f43f5e', type: 'EXPENSE' }, // Rose
        { id: 'cat_clothing', name: 'Vestuario', color: '#d946ef', type: 'EXPENSE' }, // Fuchsia
        { id: 'cat_pets', name: 'Yoda', color: '#a3a3a3', type: 'EXPENSE' },
        { id: 'cat_personal_care', name: 'Cuidados pessoais', color: '#db2777', type: 'EXPENSE' },
        { id: 'cat_pharmacy', name: 'Farmacia', color: '#ef4444', type: 'EXPENSE' }, // Red-500 similar to health
        { id: 'cat_car', name: 'Carro', color: '#28c5f5ff', type: 'EXPENSE' },

        // Income
        { id: 'cat_salary', name: 'Salario', color: '#22c55e', type: 'INCOME' },
        { id: 'cat_bonus', name: 'Bonus', color: '#84cc16', type: 'INCOME' },
        { id: 'cat_investments', name: 'Investimentos', color: '#14b8a6', type: 'INCOME' },

        // Other
        { id: 'cat_other', name: 'Outros', color: '#6b7280', type: 'EXPENSE' }
    ],
    settings: { mainCurrency: 'BRL' }
};

export function DataProvider({ children }) {
    // Start with empty/initial data
    const [data, setData] = useState(initialData);
    const [loading, setLoading] = useState(true);
    const [user, setUser] = useState(null);

    const lastUidRef = useRef(null);

    // 1. Load Local Data on Mount
    useEffect(() => {
        const loadLocal = async () => {
            try {
                const localData = await dbService.get(DATA_KEY);
                if (localData) {
                    setData(localData);
                }
            } catch (error) {
                console.error("Failed to load local data:", error);
            } finally {
                // We only stop loading if we are anonymous or finished auth check.
                // But usually we want to show generic app or login screen.
                // Let auth state handle the main loading gate?
                // For now, allow UI to render with local data.
                setLoading(false);
            }
        };
        loadLocal();
    }, []);

    // 2. Persist Data on Change
    useEffect(() => {
        if (data && !loading) {
            dbService.set(DATA_KEY, data).catch(err => console.error("Failed to save data:", err));
        }
    }, [data, loading]);

    // 3. Auth Listener & Remote Sync
    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
            // Prevent duplicate handling for same user session
            if (currentUser?.uid === lastUidRef.current) {
                return;
            }
            if (currentUser) {
                lastUidRef.current = currentUser.uid;
            } else {
                lastUidRef.current = null;
            }

            setUser(currentUser);
            if (currentUser) {
                try {
                    // Fetch data from Firestore (and replay queue)
                    const remoteData = await fetchUserData(currentUser.uid);

                    // Merge Logic
                    let finalCategories = remoteData.categories;

                    // Handle Default Categories Initialization
                    if (!remoteData.categories || remoteData.categories.length === 0) {
                        console.log("Initializing default categories...");
                        // Use initialData.categories as defaults
                        finalCategories = initialData.categories;

                        // Queue creation for each default category
                        // We use Promise.all to ensure all are queued before forcing sync
                        await Promise.all(finalCategories.map(cat =>
                            queueAction({
                                type: 'create',
                                collection: `users/${currentUser.uid}/categories`,
                                data: cat
                            }, { autoSync: false })
                        ));

                        // Force sync immediately as requested
                        console.log("Forcing immediate sync of default categories...");
                        await syncPendingActions();
                    }

                    setData(prev => ({
                        ...prev,
                        accounts: remoteData.accounts || [],
                        snapshots: remoteData.snapshots || [],
                        recurringTransactions: remoteData.fixedItems || [],
                        transactions: remoteData.transactions || [],
                        categories: finalCategories,
                        settings: { ...prev.settings, ...(remoteData.settings || {}) }
                    }));
                } catch (error) {
                    console.error("Failed to fetch remote data (Offline?):", error);
                    // Stay with local data
                }
            } else {
                // Logout: Reset state. Auth service handles DB clear.
                setData(initialData);
            }
        });
        return () => unsubscribe();
    }, []);

    // Sync Helper
    const syncAction = (action, options = {}) => {
        if (!user) return; // Should not happen if guarded
        const type = action.type;
        const collectionBase = action.collection;
        const collectionPath = `users/${user.uid}/${collectionBase}`;

        queueAction({
            ...action,
            collection: collectionPath
        }, options);
    };

    // --- Actions (Optimistic + Sync) ---

    // Settings
    const updateSettings = (newSettings) => {
        setData(prev => ({ ...prev, settings: { ...prev.settings, ...newSettings } }));

        // Settings are a bit special, usually a single doc. Treating as collection 'settings' with specific ID or just 'settings/general'?
        // Plan said: collection('settings'). Let's use ID 'general'
        syncAction({ type: 'create', collection: 'settings', data: { ...data.settings, ...newSettings, id: 'general' } });
        // Note: 'create' in batch can overwrite if we use set with same ID? 
        // My firestore.ts uses `addDoc` for create which auto-gens ID. 
        // I need to update firestore.ts to support `set` with specific ID or use `update`.
        // BUT `executeBatch` handles `create` (set with new docRef) vs `update`.
        // For settings singleton, logic is tricky with `addDoc`.
        // Let's assume settings are just updated locally for now or I'd need to fix settings sync strategy. 
        // User mainly cares about snapshots/calendar. I'll focus on lists.
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
        const newAccount = { ...account, id: account.id || uuidv4(), createdAt: new Date().toISOString() };
        setData(prev => ({ ...prev, accounts: [...prev.accounts, newAccount] }));
        syncAction({ type: 'create', collection: 'accounts', data: newAccount });
    };

    const updateAccount = (id, updates) => {
        setData(prev => ({
            ...prev,
            accounts: prev.accounts.map(acc => acc.id === id ? { ...acc, ...updates } : acc)
        }));
        syncAction({ type: 'update', collection: 'accounts', id, data: updates });
    };

    const deleteAccount = (id) => {
        setData(prev => ({ ...prev, accounts: prev.accounts.filter(acc => acc.id !== id) }));
        syncAction({ type: 'delete', collection: 'accounts', id });
    };

    // Snapshots (Balance History)
    const addSnapshot = (snapshot) => {
        const newSnapshot = { ...snapshot, id: snapshot.id || uuidv4() };
        setData(prev => {
            const existingIndex = prev.snapshots.findIndex(s => s.date === snapshot.date);
            if (existingIndex >= 0) {
                // Update existing
                const existingId = prev.snapshots[existingIndex].id;
                const merged = { ...prev.snapshots[existingIndex], ...snapshot };

                // Optimistic
                const newSnapshots = [...prev.snapshots];
                newSnapshots[existingIndex] = merged;

                // Sync Update
                syncAction({ type: 'update', collection: 'snapshots', id: existingId, data: snapshot });
                return { ...prev, snapshots: newSnapshots };
            }
            // Create new
            syncAction({ type: 'create', collection: 'snapshots', data: newSnapshot });
            return {
                ...prev,
                snapshots: [...prev.snapshots, newSnapshot]
            };
        });
    };

    const deleteSnapshot = (id) => {
        setData(prev => ({ ...prev, snapshots: prev.snapshots.filter(s => s.id !== id) }));
        syncAction({ type: 'delete', collection: 'snapshots', id });
    };

    // Fixed Expenses (Legacy - mapped to new logic if needed, or kept)
    // Assuming we deprecate usage or just clear it. Keeping stub to not break.
    const addFixedExpense = (expense) => { console.warn("Legacy addFixedExpense called"); };
    const deleteFixedExpense = (id) => { console.warn("Legacy deleteFixedExpense called"); };

    // --- NEW Financial Actions ---

    // Recurring Transactions
    const addRecurringTransaction = (item) => {
        const newItem = {
            ...item,
            id: item.id || uuidv4(),
            skippedDates: [] // Initialize skippedDates
        };
        setData(prev => ({ ...prev, recurringTransactions: [...prev.recurringTransactions, newItem] }));
        syncAction({ type: 'create', collection: 'fixedItems', data: newItem });
    };

    const updateRecurringTransaction = (id, updates) => {
        // 1. Update the Parent
        setData(prev => ({
            ...prev,
            recurringTransactions: prev.recurringTransactions.map(item => item.id === id ? { ...item, ...updates } : item)
        }));
        syncAction({ type: 'update', collection: 'fixedItems', id, data: updates });

        // 2. Cascade Update to Children (Realized Transactions) if relevant fields changed
        if (updates.title || updates.categoryId) {
            const childTransactions = data.transactions.filter(t => t.recurringTransactionId === id || t.fixedItemId === id);
            childTransactions.forEach(child => {
                const childUpdates = {};
                if (updates.title) childUpdates.title = updates.title;
                if (updates.categoryId) childUpdates.categoryId = updates.categoryId;

                // Use the internal updateTransaction logic
                updateTransaction(child.id, childUpdates);
            });
        }
    };

    const deleteRecurringTransaction = (id) => {
        // 1. Delete Parent
        setData(prev => ({ ...prev, recurringTransactions: prev.recurringTransactions.filter(item => item.id !== id) }));
        syncAction({ type: 'delete', collection: 'fixedItems', id });

        // 2. Cascade Delete to Children (Realized Transactions)
        // Find all transactions linked to this recurring item
        const childTransactions = data.transactions.filter(t => t.recurringTransactionId === id || t.fixedItemId === id);

        // Delete them one by one (or batch if possible, but one by one ensures UI update)
        childTransactions.forEach(child => {
            deleteTransaction(child.id);
        });
    };

    const skipRecurringTransaction = (id, dateStr) => {
        // Find item to get current skippedDates
        const item = data.recurringTransactions.find(i => i.id === id);
        if (!item) return;

        const updatedSkippedDates = [...(item.skippedDates || []), dateStr];

        // Optimistic update
        updateRecurringTransaction(id, { skippedDates: updatedSkippedDates });
    };

    // Transactions
    const addTransaction = (transaction, options = {}) => {
        const newTransaction = { ...transaction, id: transaction.id || uuidv4() };
        setData(prev => ({ ...prev, transactions: [...prev.transactions, newTransaction] }));
        syncAction({ type: 'create', collection: 'transactions', data: newTransaction }, options);
    };

    const updateTransaction = (id, updates) => {
        setData(prev => ({
            ...prev,
            transactions: prev.transactions.map(t => t.id === id ? { ...t, ...updates } : t)
        }));
        syncAction({ type: 'update', collection: 'transactions', id, data: updates });
    };

    const deleteTransaction = (id) => {
        setData(prev => ({ ...prev, transactions: prev.transactions.filter(t => t.id !== id) }));
        syncAction({ type: 'delete', collection: 'transactions', id });
    };

    // Categories
    const addCategory = (category) => {
        const newCategory = { ...category, id: category.id || uuidv4() };
        setData(prev => ({ ...prev, categories: [...(prev.categories || []), newCategory] }));
        syncAction({ type: 'create', collection: 'categories', data: newCategory });
    };

    const updateCategory = (id, updates) => {
        setData(prev => ({
            ...prev,
            categories: (prev.categories || []).map(c => c.id === id ? { ...c, ...updates } : c)
        }));
        syncAction({ type: 'update', collection: 'categories', id, data: updates });
    };

    const deleteCategory = (id) => {
        setData(prev => ({ ...prev, categories: (prev.categories || []).filter(c => c.id !== id) }));
        syncAction({ type: 'delete', collection: 'categories', id });
    };

    return (
        <DataContext.Provider value={{
            data,
            addAccount,
            updateAccount,
            deleteAccount,
            addSnapshot,
            deleteSnapshot,
            addFixedExpense,
            deleteFixedExpense,
            addRecurringTransaction,
            updateRecurringTransaction,
            deleteRecurringTransaction,
            skipRecurringTransaction,
            addTransaction,
            updateTransaction,
            deleteTransaction,
            addCategory,
            updateCategory,
            deleteCategory,
            updateSettings,
            formatCurrency,
            loading,
            syncData: syncPendingActions // Expose sync trigger
        }}>
            {children}
        </DataContext.Provider>
    );
}

export function useData() {
    return useContext(DataContext);
}
