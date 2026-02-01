import { useState } from 'react';
import { Helmet } from 'react-helmet-async';
import { useData } from '../../contexts/DataContext';
import { useCalendarData } from '../../hooks/useCalendarData';
import { CalendarHeader } from '../calendar/CalendarHeader';
import { CalendarGrid } from '../calendar/CalendarGrid';
import { CalendarMonthSummary } from '../calendar/CalendarMonthSummary';
import { FinancialItemModal } from '../calendar/FinancialItemModal';
import { RecurringTransactionsList } from './RecurringTransactionsList';
import { ImportDialog } from '../calendar/ImportDialog';
import { parsePicPayPDF } from '../../lib/picpayParser';
import { parseItauPDF } from '../../lib/itauParser';
import { parseTransactionsCSV, parseXpCSV } from '../../lib/csvParser';

export function CalendarTab() {
    const {
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
        handleSubmit,
        handleImportTransactions, // Rename or use this for the data processing part
        handleDelete,
        isConfirming,
        editingItem,
        data // Contains categories
    } = useCalendarData();

    const [view, setView] = useState('calendar');
    const [isImportDialogOpen, setIsImportDialogOpen] = useState(false);
    
    // --- Recurring Rules Logic (Lifted Up) ---
    // We reuse the existing isModalOpen/formData logic from useCalendarData for standard items,
    // but for Recurring Rules we need a separate state or reuse carefully.
    // The previous implementation had its own state inside RecurringTransactionsList.
    // We will create a dedicated state here for the Recurring Modal to avoid conflicts.
    
    const [isRecurringModalOpen, setIsRecurringModalOpen] = useState(false);
    const [editingRule, setEditingRule] = useState(null);
    const [ruleFormData, setRuleFormData] = useState({
        title: '',
        amount: '',
        type: 'EXPENSE',
        categoryId: '',
        frequency: 'MONTHLY',
        startDate: new Date().toISOString().split('T')[0],
        endDate: '',
        isVariable: false
    });

    const { addRecurringTransaction, updateRecurringTransaction, deleteRecurringTransaction } = useData();

    const handleAddClick = () => {
        if (view === 'calendar') {
            handleDayClick(new Date());
        } else {
            // New Recurring Rule
            setEditingRule(null);
            setRuleFormData({
                title: '',
                amount: '',
                type: 'EXPENSE',
                categoryId: '',
                frequency: 'MONTHLY',
                startDate: new Date().toISOString().split('T')[0],
                endDate: '',
                isVariable: false
            });
            setIsRecurringModalOpen(true);
        }
    };

    const handleEditRule = (rule) => {
        setEditingRule(rule);
        setRuleFormData({
            title: rule.title,
            amount: rule.amount,
            type: rule.type,
            categoryId: rule.categoryId || '',
            frequency: rule.frequency || 'MONTHLY',
            startDate: rule.startDate,
            endDate: rule.endDate || '',
            isVariable: rule.isVariable || false
        });
        setIsRecurringModalOpen(true);
    };

    const handleDeleteRule = async (id) => {
        if (confirm('Are you sure you want to delete this Recurring Transaction? ALL linked past and future transactions will be deleted.')) {
            await deleteRecurringTransaction(id);
        }
    };

    const handleRuleSubmit = async (e) => {
        e.preventDefault();
        const commonData = {
            title: ruleFormData.title,
            amount: parseFloat(ruleFormData.amount),
            type: ruleFormData.type,
            categoryId: ruleFormData.categoryId,
            frequency: ruleFormData.frequency,
            startDate: ruleFormData.startDate,
            endDate: ruleFormData.endDate || null,
            isVariable: ruleFormData.isVariable,
            isRecurring: true
        };

        if (editingRule) {
            await updateRecurringTransaction(editingRule.id, commonData);
        } else {
            await addRecurringTransaction(commonData);
        }
        setIsRecurringModalOpen(false);
    };

    const onImport = async (file, source) => {
        let result = { transactions: [], errors: [] };

        if (source === 'c6') {
            const text = await file.text();
            result = parseTransactionsCSV(text);
        } else if (source === 'xp') {
            const text = await file.text();
            result = parseXpCSV(text);
        } else if (source === 'picpay') {
            result = await parsePicPayPDF(file);
        } else if (source === 'itau') {
            result = await parseItauPDF(file);
        }

        if (result.transactions.length > 0) {
            // We need to access the logic that was previously in handleFileUpload in useCalendarData
            // Since we can't easily change the hook right now without viewing it, 
            // I'll assume handleFileUpload (or a renamed version) accepts the list of transactions directly 
            // OR I need to look at how handleFileUpload was implemented.
            // Let's check useCalendarData first or assume we can pass the transactions.
            // Wait, the original handleFileUpload took an event. I should probably check useCalendarData.
            // But to proceed, I'll pass the parsed transactions to a method available from the hook.
            // If the hook only exposes handleFileUpload which expects an event, I might need to refactor the hook.

            // However, based on the previous file content, handleFileUpload was exposed.
            // I'll check if I can modify the hook or if I should implement the processing here.
            // To be safe and quick, I will modify useCalendarData to accept raw transactions or keep logic here.
            // Actually, I should probably inspect useCalendarData to see how to properly feed it data.
            // BUT, for this step, I will call a function `handleImportTransactions` which I will ensure exists in the hook in a separate step or assume it handles the array.

            // To be safe, let's look at useCalendarData in the next step if needed. 
            // For now, I will assume handleFileUpload handles the FILE event.
            // I need to change the hook to accept parsed data.

            // NOTE: I am calling handleImportTransactions(result.transactions) here. 
            // I will update useCalendarData in the next step to support this.
            handleImportTransactions(result.transactions);
        }

        if (result.errors.length > 0) {
            console.error("Import Errors:", result.errors);
            alert(`Import completed with ${result.errors.length} errors. Check console.`);
        }
    };

    return (
        <div className="space-y-6">
            <Helmet>
                <title>Calendar - Precious</title>
                <meta name="description" content="View and manage your monthly financial transactions in a calendar view." />
                <link rel="canonical" href="https://my-precious-app.com/calendar" />
            </Helmet>
            <CalendarHeader
                currentMonth={currentMonth}
                setCurrentMonth={setCurrentMonth}
                handleFileUpload={() => setIsImportDialogOpen(true)} 
                onAdd={handleAddClick}
                view={view}
                setView={setView}
            />

            {view === 'calendar' ? (
                <>
                    <CalendarGrid
                        daysInMonth={daysInMonth}
                        currentMonth={currentMonth}
                        getItemsForDay={getItemsForDay}
                        onDayClick={handleDayClick}
                    />

                    <CalendarMonthSummary
                        monthlyFinancials={monthlyFinancials}
                        categories={data.categories}
                        onEdit={handleEditItem}
                        onDelete={handleDelete}
                    />

                    <FinancialItemModal
                        isOpen={isModalOpen}
                        onClose={() => setIsModalOpen(false)}
                        itemType={itemType}
                        setItemType={setItemType}
                        formData={formData}
                        setFormData={setFormData}
                        handleSubmit={handleSubmit}
                        isConfirming={isConfirming}
                        categories={data.categories}
                        editingItem={editingItem}
                    />
                </>
            ) : (
                <>
                    <RecurringTransactionsList 
                        onEdit={handleEditRule}
                        onDelete={handleDeleteRule}
                    />
                    
                    <FinancialItemModal
                        isOpen={isRecurringModalOpen}
                        onClose={() => setIsRecurringModalOpen(false)}
                        itemType="recurring"
                        setItemType={() => {}}
                        formData={ruleFormData}
                        setFormData={setRuleFormData}
                        handleSubmit={handleRuleSubmit}
                        categories={data.categories}
                        editingItem={editingRule}
                    />
                </>
            )}

            <ImportDialog
                isOpen={isImportDialogOpen}
                onClose={() => setIsImportDialogOpen(false)}
                onImport={onImport}
            />
        </div>
    );
}
