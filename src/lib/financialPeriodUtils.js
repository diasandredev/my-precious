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

export function getFinancialsForMonth(currentMonthDate, fixedItems = [], transactions = []) {
    const monthStart = startOfMonth(currentMonthDate);
    const monthEnd = endOfMonth(currentMonthDate);
    const daysInMonth = eachDayOfInterval({ start: monthStart, end: monthEnd });

    let allItems = [];

    // 1. Process Fixed Items (Projections)
    fixedItems.forEach(item => {
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

            if (item.frequency === 'MONTHLY') {
                // Same day of month, handling day overflow (e.g. 31st in Feb) is tricky roughly, 
                // but usually we just check getDate match.
                // Better approach: Check if (day.getDate() === startDate.getDate())
                // Or if startDate.getDate() > daysInThisMonth ??
                // Let's stick to simple day match for now.
                // Also need to handle cases where start date is in future relative to "day", but we handled that with startDate > monthEnd check somewhat.

                // IMPORTANT: Only if >= startDate AND <= endDate
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
                // Or maybe the transaction is linked by ID.
                // Current approach: We allow manually linking or just matching.
                // For simplified UX: If a transaction exists with `fixedItemId` equal to this item's ID,
                // AND it falls in the "same period" (e.g. same day), we replace projection with actual.

                const existingTransaction = transactions.find(t =>
                    t.fixedItemId === item.id &&
                    isSameDay(parseISO(t.date), day)
                );

                if (existingTransaction) {
                    // It's already handled by a transaction, so we don't add a "projection"
                    // We will add the transaction later in step 2.
                } else {
                    allItems.push({
                        id: `projection-${item.id}-${format(day, 'yyyy-MM-dd')}`,
                        date: day,
                        amount: item.amount,
                        name: item.title || item.name,
                        type: item.type, // 'INCOME' or 'EXPENSE'
                        status: 'PROJECTED',
                        fixedItemId: item.id,
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
                status: t.isPaid ? 'PAID' : 'PENDING', // 'PENDING' might mean confirmed but not yet money-out? Or just 'CONFIRMED'
                // If it's a fixed item realization, it might be paid or not.
                // Let's assume transactions in the list are "Actuals"
            });
        }
    });

    // Sort by date
    return allItems.sort((a, b) => a.date - b.date);
}
