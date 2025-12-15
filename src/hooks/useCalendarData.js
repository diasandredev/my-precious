import { useState, useMemo } from 'react';
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameMonth, isSameDay, addMonths, subMonths, parseISO, isValid, startOfWeek, endOfWeek } from 'date-fns';
import { useData } from '../contexts/DataContext';
import { getFinancialsForMonth } from '../lib/financialPeriodUtils';
import { parseTransactionsCSV } from '../lib/csvParser';
import { categorizeTransaction } from '../lib/categorizer';



export function useCalendarData() {
    const { data, addRecurringTransaction, updateRecurringTransaction, deleteRecurringTransaction, skipRecurringTransaction, addTransaction, updateTransaction, deleteTransaction } = useData();
    const [currentMonth, setCurrentMonth] = useState(new Date());
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [itemType, setItemType] = useState('one-time'); // 'one-time' or 'recurring'
    const [selectedDate, setSelectedDate] = useState(new Date());
    const [editingItem, setEditingItem] = useState(null);
    const [isConfirming, setIsConfirming] = useState(false); // For variable expenses confirmation

    const [formData, setFormData] = useState({
        title: '',
        amount: '',
        type: 'EXPENSE',
        date: format(new Date(), 'yyyy-MM-dd'),
        categoryId: '',
        // Recurring specific
        frequency: 'MONTHLY',
        startDate: format(new Date(), 'yyyy-MM-dd'),
        endDate: '',
        isVariable: false
    });

    // ... (Memo hooks same as before)
    const daysInMonth = useMemo(() => {
        const start = startOfWeek(startOfMonth(currentMonth));
        const end = endOfWeek(endOfMonth(currentMonth));
        return eachDayOfInterval({ start, end });
    }, [currentMonth]);

    const financialsHistory = useMemo(() => {
        return getFinancialsForMonth(currentMonth, data.recurringTransactions, data.transactions, data.fixedExpenses || []);
    }, [currentMonth, data.recurringTransactions, data.transactions, data.fixedExpenses]);

    const monthlyFinancials = useMemo(() => {
        const income = financialsHistory.filter(i => i.type === 'INCOME').reduce((acc, i) => acc + i.amount, 0);
        const expense = financialsHistory.filter(i => i.type === 'EXPENSE').reduce((acc, i) => acc + i.amount, 0);
        return {
            history: financialsHistory,
            income,
            expense,
            balance: income - expense
        };
    }, [financialsHistory]);

    const getItemsForDay = (day) => {
        // financialPeriodUtils returns items where item.date is a Date object (or sometimes string if raw?) 
        // We safely handle both by comparing ISO strings YYYY-MM-DD
        const targetDateStr = format(day, 'yyyy-MM-dd');
        return financialsHistory.filter(item => {
            const itemDateStr = isValid(item.date) ? format(item.date, 'yyyy-MM-dd') : null;
            return itemDateStr === targetDateStr;
        });
    };

    // Handlers
    const handleDayClick = (day) => {
        setSelectedDate(day);
        setFormData({
            title: '',
            amount: '',
            type: 'EXPENSE',
            date: format(day, 'yyyy-MM-dd'),
            categoryId: '',
            frequency: 'MONTHLY',
            startDate: format(day, 'yyyy-MM-dd'),
            endDate: '',
            isVariable: false
        });
        setEditingItem(null);
        setItemType('one-time');
        setIsConfirming(false);
        setIsModalOpen(true);
    };

    const handleEditItem = (item) => {
        setEditingItem(item);

        // Identify if it's a Child (Linked to Recurring)
        const isChild = !!(item.recurringTransactionId || item.fixedItemId);

        // If it's a Child, we force it to be treated as "one-time" (instance) mode, but restricted.
        // If it's a "Definition" (e.g. clicked from a list of definitions?), we handle that separately (but calendar only shows instances).

        setItemType(item.isRecurring && !isChild ? 'recurring' : 'one-time'); // Calendar items effectively one-time instances unless strictly a definition obj

        // User Rule: "Child transactions just have confirm action"
        // If it's a Child (Projected OR Realized), we treat it as "Confirming" logic usually?
        // Actually: 
        // - Projected: Needs Confirmation (isConfirming = true).
        // - Realized (PAID): Already confirmed. User can VIEW details. Can they edit? 
        //   User said: "nao deve ser possivel editar uma transacao filha... caso contrario só confirmar para mudar o status para pago."
        //   "Confirmar" implies changing status. If already PAID, maybe just View? 
        //   Let's treat Realized Children as "Confirming" mode too (Read Only fields), but maybe button says "Update" or "Save".
        //   Let's use `isConfirming` to trigger the Read-Only state in the modal.

        setIsConfirming(item.status === 'PROJECTED' || isChild);

        // item.date comes from financialPeriodUtils which returns Date objects.
        // We must format it to yyyy-MM-dd for HTML date inputs.
        const dateStr = isValid(item.date) ? format(item.date, 'yyyy-MM-dd') : '';
        const startDateStr = item.startDate ? (item.startDate instanceof Date ? format(item.startDate, 'yyyy-MM-dd') : item.startDate) : dateStr;

        setFormData({
            title: item.title || item.name || '', // Inherited from Parent (or saved in transaction)
            amount: item.amount.toString(),
            type: item.type,
            date: dateStr,
            categoryId: item.categoryId || '',
            frequency: item.frequency || 'MONTHLY',
            startDate: startDateStr,
            endDate: item.endDate || '',
            isVariable: item.isVariable || false
        });
        setIsModalOpen(true);
    };

    const handleDelete = async (item) => {
        if (confirm('Are you sure you want to delete this item?')) {
            if (item.status === 'PROJECTED' && item.recurringTransactionId) {
                // It's a projection, so we skip this specific instance
                const dateStr = format(item.date, 'yyyy-MM-dd');
                await skipRecurringTransaction(item.recurringTransactionId, dateStr);
            } else if (item.isRecurring && !item.status) {
                // Fallback for logic that might treat "isRecurring" property as "Definition" 
                // But usually we don't delete definitions from the calendar view, only instances.
                // If the user TRULY wants to delete the series, they should edit -> delete series.
                // For now, assuming clicking "Delete" on an item means "Delete this instance".

                // If item is a PAID transaction linked to a recurring one:
                if (item.recurringTransactionId || item.fixedItemId) {
                    // Deleting a Realized Transaction should probably invoke standard deleteTransaction
                    // AND if the user wants to remove the slot, we might need to skip getting it back as projection?
                    // Standard behavior: Delete Transaction -> Projection Reappears (Unpaid).
                    await deleteTransaction(item.id);
                }
            } else if (item.fixedItemId || item.recurringTransactionId) {
                // Realized Transaction linked to Recurring
                await deleteTransaction(item.id);
            } else {
                // One-time transaction
                await deleteTransaction(item.id);
            }
            setIsModalOpen(false);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        const amount = parseFloat(formData.amount);
        if (!amount) return;

        const commonData = {
            title: formData.title,
            amount: amount,
            type: formData.type,
            categoryId: formData.categoryId
        };

        try {
            if (editingItem) {
                if (editingItem.isRecurring || editingItem.recurringTransactionId || editingItem.fixedItemId) {
                    // Update Recurring Definition OR Transaction?
                    // If editing a PROJECTION, usually we want to "Edit this Instance" -> Create Real Transaction
                    // OR "Edit Series" -> Update Recurring Def.

                    // Current simplified flow: If specific instance edit, we likely convert to Transaction.
                    // But if the modal has "Frequency" fields, it implies editing the series.

                    // Let's assume if itemType === 'recurring', we are editing the series logic.
                    if (itemType === 'recurring') {
                        // We need the ID of the definition
                        const defId = editingItem.recurringTransactionId || editingItem.fixedItemId || editingItem.id;
                        await updateRecurringTransaction(defId, {
                            ...commonData,
                            frequency: formData.frequency,
                            startDate: formData.startDate,
                            endDate: formData.endDate || null,
                            isVariable: formData.isVariable
                        });
                    } else {
                        // Editing a specific instance (converting projection to transaction or updating transaction)
                        if (editingItem.status === 'PROJECTED') {
                            await addTransaction({
                                ...commonData,
                                date: formData.date,
                                recurringTransactionId: editingItem.recurringTransactionId,
                                status: 'PAID'
                            });

                            // Important: Skip the original projection date to prevent duplication
                            // The new transaction replaces this specific occurrence.
                            // calculated date from editingItem might be Date object or string
                            const originalDateStr = isValid(editingItem.date)
                                ? format(editingItem.date, 'yyyy-MM-dd')
                                : editingItem.date;

                            if (editingItem.recurringTransactionId) {
                                await skipRecurringTransaction(editingItem.recurringTransactionId, originalDateStr);
                            }
                        } else {
                            await updateTransaction(editingItem.id, {
                                ...commonData,
                                date: formData.date
                            });
                        }
                    }
                } else {
                    // Update One-time (Transaction)
                    await updateTransaction(editingItem.id, {
                        ...commonData,
                        date: formData.date
                    });
                }
            } else {
                // Create New
                if (itemType === 'recurring') {
                    await addRecurringTransaction({
                        ...commonData,
                        isRecurring: true,
                        frequency: formData.frequency,
                        startDate: formData.startDate,
                        endDate: formData.endDate || null,
                        isVariable: formData.isVariable
                    });
                } else {
                    await addTransaction({
                        ...commonData,
                        date: formData.date,
                        status: 'PAID' // Default to PAID as per user request
                    });
                }
            }
            setIsModalOpen(false);
        } catch (error) {
            console.error("Error saving item:", error);
            alert("Failed to save item.");
        }
    };

    const handleImportTransactions = async (transactions) => {
        let importedCount = 0;
        try {
            for (const t of transactions) {
                // Categorize returns the CATEGORY ID string
                const categoryId = categorizeTransaction(t.description, t.categoryOriginal || t.description, data.categories || []);

                // Create transaction
                await addTransaction({
                    title: t.description,
                    amount: Math.abs(t.amount),
                    type: t.type || 'EXPENSE', // Support dynamic type
                    date: t.date,
                    categoryId: categoryId || 'cat_other',
                    status: 'PAID'
                });
                importedCount++;
            }
            alert(`Successfully imported ${importedCount} transactions!`);
        } catch (error) {
            console.error('Import logic error:', error);
            alert('Failed to process imported data.');
        }
    };

    const handleFileUpload = async (event) => {
        // Legacy support if needed, or wrapped
        const file = event.target.files[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = async (e) => {
            const text = e.target.result;
            try {
                const { transactions, errors } = parseTransactionsCSV(text);
                if (errors.length > 0) console.warn("CSV Import warnings:", errors);
                await handleImportTransactions(transactions);
                event.target.value = '';
            } catch (error) {
                console.error('Legacy CSV Import error:', error);
            }
        };
        reader.readAsText(file);
    };

    return {
        currentMonth,
        setCurrentMonth,
        daysInMonth,
        getItemsForDay,
        monthlyFinancials,
        isModalOpen,
        setIsModalOpen,
        itemType,
        setItemType,
        formData,
        setFormData,
        handleDayClick,
        handleEditItem,
        handleDelete,
        handleSubmit,
        handleFileUpload,
        handleImportTransactions, // New exposed method
        isConfirming,
        editingItem,
        data
    };
}
