import {
    startOfMonth,
    endOfMonth,
    eachDayOfInterval,
    getDate,
    isSameDay,
    addDays,
    differenceInDays,
    parseISO,
    isValid,
    isSameMonth,
    format
} from 'date-fns';

export function getFinancialsForMonth(currentMonthDate, recurringTransactions = [], transactions = [], fixedExpenses = []) {
    const monthStart = startOfMonth(currentMonthDate);
    const monthEnd = endOfMonth(currentMonthDate);
    const daysInMonth = eachDayOfInterval({ start: monthStart, end: monthEnd });

    let allItems = [];

    // 1. Process Recurring Transactions (Projections)
    recurringTransactions.forEach(item => {
        // Validation
        if (!item.startDate) return; // Need a start date for recurrences
        const startDate = parseISO(item.startDate);
        if (!isValid(startDate)) return;
        const endDate = item.endDate ? parseISO(item.endDate) : null;

        // Check occurrences within this month
        // Simple optimization: only check if item started before or during this month
        if (startDate > monthEnd) return;

        daysInMonth.forEach(day => {
            let isDue = false;

            // Check if this specific date is skipped
            const dateStr = format(day, 'yyyy-MM-dd');
            if (item.skippedDates && item.skippedDates.includes(dateStr)) {
                return; // Skip this day
            }

            if (item.frequency === 'MONTHLY') {
                if (day >= startDate && getDate(day) === getDate(startDate)) {
                    if (!endDate || day <= endDate) {
                        isDue = true;
                    }
                }
            } else if (item.frequency === 'WEEKLY') {
                const diff = differenceInDays(day, startDate);
                if (day >= startDate && diff % 7 === 0) {
                    if (!endDate || day <= endDate) isDue = true;
                }
            } else if (item.frequency === 'BIWEEKLY') {
                const diff = differenceInDays(day, startDate);
                if (day >= startDate && diff % 14 === 0) {
                    if (!endDate || day <= endDate) isDue = true;
                }
            } else if (item.frequency === 'YEARLY') {
                if (day >= startDate &&
                    getDate(day) === getDate(startDate) &&
                    day.getMonth() === startDate.getMonth()) {
                    if (!endDate || day <= endDate) isDue = true;
                }
            }

            if (isDue) {
                // Check if there is already a transaction for this item on this specific day??
                const existingTransaction = transactions.find(t =>
                    (t.fixedItemId === item.id || t.recurringTransactionId === item.id) &&
                    isSameDay(parseISO(t.date), day)
                );

                if (existingTransaction) {
                    // It's already handled by a transaction, so we don't add a "projection"
                } else {
                    allItems.push({
                        id: `projection-${item.id}-${dateStr}`,
                        date: day,
                        amount: item.amount,
                        name: item.title || item.name,
                        categoryId: item.categoryId, // Ensure Category ID is passed
                        description: item.description, // Ensure Description is passed if exists (though UI uses title usually)
                        type: item.type, // 'INCOME' or 'EXPENSE'
                        status: 'PROJECTED',
                        fixedItemId: item.id, // Keep legacy ID ref for now ??
                        recurringTransactionId: item.id, // New ID ref
                        isVariable: item.isVariable,
                        originalItem: item
                    });
                }
            }
        });
    });

    // 2. Process Transactions (Actuals)
    transactions.forEach(t => {
        const tDate = parseISO(t.date);
        if (isSameMonth(tDate, currentMonthDate)) {
            allItems.push({
                ...t,
                name: t.name || t.title, // Ensure name is populated
                date: tDate,
                status: t.status || (t.isPaid ? 'PAID' : 'PENDING'), // Prioritize existing status
            });
        }
    });

    // Sort by date
    return allItems.sort((a, b) => a.date - b.date);
}
