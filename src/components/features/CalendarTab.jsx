import { useState } from 'react';
import { useCalendarData } from '../../hooks/useCalendarData';
import { CalendarHeader } from '../calendar/CalendarHeader';
import { CalendarGrid } from '../calendar/CalendarGrid';
import { CalendarMonthSummary } from '../calendar/CalendarMonthSummary';
import { FinancialItemModal } from '../calendar/FinancialItemModal';
import { RecurringTransactionsList } from './RecurringTransactionsList';

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
        handleEditItem, // Not used in Grid yet unless passed down or Grid implements click on item
        handleSubmit,
        handleFileUpload,
        handleDelete,
        isConfirming,
        editingItem,
        data // Contains categories
    } = useCalendarData();

    const [view, setView] = useState('calendar');

    return (
        <div className="space-y-6">
            <CalendarHeader
                currentMonth={currentMonth}
                setCurrentMonth={setCurrentMonth}
                handleFileUpload={handleFileUpload}
                onAdd={() => handleDayClick(new Date())}
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
                <RecurringTransactionsList />
            )}
        </div>
    );
}
