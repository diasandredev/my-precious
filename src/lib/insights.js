import { startOfMonth, format, parseISO } from 'date-fns';

/**
 * Groups a list of transactions (realized or projected) by category and calculates total.
 * @param {Array} transactions List of transaction objects
 * @param {Date} date Month date
 * @returns {Object} { month: 'YYYY-MM', total: number, categories: {}, date: Date }
 */
export function aggregateMonthlyData(transactions, date) {
    const stats = {
        month: format(date, 'yyyy-MM'),
        date: startOfMonth(date),
        total: 0,
        categories: {}
    };

    transactions.forEach(t => {
        if (t.type !== 'EXPENSE') return;
        const amount = Number(t.amount);
        stats.total += amount;
        if (!stats.categories[t.categoryId]) {
            stats.categories[t.categoryId] = 0;
        }
        stats.categories[t.categoryId] += amount;
    });

    return stats;
}

/**
 * Groups all transactions by month and calculates total expenses.
 * @param {Array} transactions
 * @returns {Array} Array of aggregated month objects, sorted descending
 */
export function calculateMonthlyExpenses(transactions) {
    const months = {};

    transactions.forEach(t => {
        if (t.type !== 'EXPENSE') return;

        const date = parseISO(t.date);
        const monthKey = format(date, 'yyyy-MM');

        if (!months[monthKey]) {
            months[monthKey] = {
                month: monthKey,
                date: startOfMonth(date),
                total: 0,
                categories: {}
            };
        }

        months[monthKey].total += Number(t.amount);

        if (!months[monthKey].categories[t.categoryId]) {
            months[monthKey].categories[t.categoryId] = 0;
        }
        months[monthKey].categories[t.categoryId] += Number(t.amount);
    });

    return Object.values(months).sort((a, b) => b.date - a.date); // Descending order
}

/**
 * Analyzes trends including 3-month average and spikes.
 * @param {Object} currentMonth Current month stats (Realized + Projected)
 * @param {Array} historyStats Array of ALL monthly stats (sorted descending)
 * @param {number} currentIndex Index of currentMonth in the history array (usually 0 if latest)
 * @param {Array} categories List of categories
 * @returns {Array} List of insights
 */
export function analyzeTrends(currentMonth, historyStats, currentIndex, categories, formatCurrency = (val) => val) {
    const insights = [];
    if (!currentMonth) return insights;

    // Use historyStats to find previous months relative to the *selected* month (currentIndex)
    // Note: currentMonth might be a "Virtual" object (Projected), but historyStats is the source of truth for past.
    // If currentMonth is derived from historyStats[currentIndex], then prev is currentIndex + 1.
    // If currentMonth is a totally new object passed in, we assume it corresponds to proper time flow relative to historyStats[currentIndex + 1]?
    // Let's assume historyStats is the full list. prevMonth is historyStats[currentIndex + 1].

    const prevMonth = historyStats[currentIndex + 1];

    if (!prevMonth) return insights;

    // Helper: Determine Insight Type & Severity
    // Helper: Determine Insight Type & Severity
    const determineSeverity = (pctChange, diffAmount) => {
        // 1. FILTERS (Ignore noise)
        // Rule: Increases < 5% are NOT warnings (ignore)
        if (pctChange < 5) return null;

        // Rule: Increases < 10% are only valid if > R$ 100
        if (pctChange < 10 && diffAmount < 100) return null;

        // 2. HIGH VALUE OVERRIDE
        // Absolute increase > 1000 -> Always Critical Alert
        if (diffAmount > 1000) return { type: 'alert', severity: 'high' };

        // 3. SEVERITY CLASSIFICATION
        // Prevent "Alert" for small absolute values (< 200), max them at Warning
        const isSmallAmount = diffAmount < 200;

        if (pctChange >= 50 && !isSmallAmount) return { type: 'alert', severity: 'high' };

        // Default to Warning for anything else that passed the filters
        // This includes:
        // - pct >= 20%
        // - pct 5-19% (if passed the >100 filter)
        // - Any > 50% that was "small amount"
        return { type: 'warning', severity: 'medium' };
    };

    // 1. Total Spend Comparison
    const totalDiff = currentMonth.total - prevMonth.total;
    const totalPercentChange = prevMonth.total > 0 ? (totalDiff / prevMonth.total) * 100 : 100;

    if (totalDiff > 0) {
        const severityInfo = determineSeverity(totalPercentChange, totalDiff);
        if (severityInfo) {
            insights.push({
                type: severityInfo.type,
                title: 'Spending Spike',
                message: `Spending is ${totalPercentChange.toFixed(0)}% higher than last month (was ${formatCurrency(prevMonth.total)}).`,
                amount: totalDiff,
                severity: severityInfo.severity,
                comparisonType: 'month_over_month'
            });
        }
    } else if (totalPercentChange < -10) {
        insights.push({
            type: 'good',
            title: 'Under Budget',
            message: `Spending is ${Math.abs(totalPercentChange).toFixed(0)}% lower than last month!`,
            amount: Math.abs(totalDiff),
            severity: 'low'
        });
    }

    // 2. Category Analysis (Spikes & 3-Month Average)
    if (currentMonth.categories) {
        Object.keys(currentMonth.categories).forEach(catId => {
            const currentAmount = currentMonth.categories[catId];
            const prevAmount = prevMonth.categories[catId] || 0;
            const catName = categories.find(c => c.id === catId)?.name || 'Unknown Category';

            // A. Spike/Drop Detection (vs Last Month)
            const diff = currentAmount - prevAmount;

            // INCREASE Logic (Spike)
            if (currentAmount > 100 && diff > 0 && prevAmount > 0) {
                const pctChange = (diff / prevAmount) * 100;
                const severityInfo = determineSeverity(pctChange, diff);
                if (severityInfo) {
                    insights.push({
                        type: severityInfo.type,
                        title: `${catName} Increase`,
                        message: `Spending on ${catName} increased by ${pctChange.toFixed(0)}% vs last month (was ${formatCurrency(prevAmount)}).`,
                        amount: diff,
                        severity: severityInfo.severity,
                        categoryId: catId,
                        comparisonType: 'month_over_month'
                    });
                }
            }
            // DECREASE Logic (Good)
            else if (diff < 0 && prevAmount > 0) {
                const pctDecrease = Math.abs((diff / prevAmount) * 100);
                const absDiff = Math.abs(diff);

                // Apply similar filters for "Good" to match "Warning/Alert" threshold logic (symmetrical)
                // Ignore if < 10% AND < 100 BRL
                // Ignore if < 5% always

                let isSignificantDrop = false;
                if (pctDecrease >= 10 || (pctDecrease >= 5 && absDiff >= 100)) {
                    isSignificantDrop = true;
                }

                // Also ensure absolute saving is somewhat meaningful (> 50?) or stick to the 100 rule?
                // User said "seguindo as mesmas logicas".
                // Logic was: < 5% ignore. < 10% ignore unless > 100.
                if (pctDecrease >= 5) {
                    if (pctDecrease >= 10 || absDiff >= 100) {
                        insights.push({
                            type: 'good',
                            title: `${catName} Decrease`,
                            message: `Spending on ${catName} decreased by ${pctDecrease.toFixed(0)}% vs last month (was ${formatCurrency(prevAmount)}).`,
                            amount: absDiff,
                            severity: 'low',
                            categoryId: catId,
                            comparisonType: 'month_over_month'
                        });
                    }
                }
            }

            // B. 3-Month Moving Average
            let sum = 0;
            let count = 0;
            for (let i = 1; i <= 3; i++) {
                const histMonth = historyStats[currentIndex + i];
                if (histMonth && histMonth.categories[catId] > 0) {
                    sum += histMonth.categories[catId];
                    count++;
                }
            }

            if (count >= 3) {
                const average = sum / count;
                const diffAvg = currentAmount - average;

                // INCREASE (> Average)
                if (currentAmount > 100 && currentAmount > average) {
                    const pctAboveAvg = average > 0 ? (diffAvg / average) * 100 : 100;
                    const severityInfo = determineSeverity(pctAboveAvg, diffAvg);

                    if (severityInfo) {
                        insights.push({
                            type: severityInfo.type,
                            title: `${catName} Above Average`,
                            message: `Your ${catName} spending is ${pctAboveAvg.toFixed(0)}% higher than the 3-month average (Avg: ${formatCurrency(average)}).`,
                            amount: diffAvg,
                            severity: severityInfo.severity,
                            categoryId: catId,
                            comparisonType: 'average',
                            isProjected: currentMonth.isProjected
                        });
                    }
                }
                // DECREASE (< Average)
                else if (currentAmount < average) {
                    const absDiffAvg = Math.abs(diffAvg);
                    const pctBelowAvg = (absDiffAvg / average) * 100;

                    // Filter Logic
                    if (pctBelowAvg >= 5) { // Min 5%
                        if (pctBelowAvg >= 10 || absDiffAvg >= 100) {
                            insights.push({
                                type: 'good',
                                title: `${catName} Below Average`,
                                message: `Your ${catName} spending is ${pctBelowAvg.toFixed(0)}% lower than the 3-month average (Avg: ${formatCurrency(average)}).`,
                                amount: absDiffAvg,
                                severity: 'low',
                                categoryId: catId,
                                comparisonType: 'average',
                                isProjected: currentMonth.isProjected
                            });
                        }
                    }
                }
            }
        });

    }

    return insights;
}

/**
 * Gets top spent categories for a specific month.
 * @param {Object} monthStat Single month object from calculateMonthlyExpenses
 * @param {Array} categories Category definitions
 * @returns {Array} Sored array of { name, amount, color, percentage }
 */
export function identifyTopCategories(monthStat, categories) {
    if (!monthStat || !monthStat.categories) return [];

    const total = monthStat.total;
    return Object.entries(monthStat.categories)
        .map(([catId, amount]) => {
            const cat = categories.find(c => c.id === catId);
            return {
                id: catId,
                name: cat ? cat.name : 'Uncategorized',
                color: cat ? cat.color : '#cbd5e1',
                amount: amount,
                percentage: total > 0 ? (amount / total) * 100 : 0
            };
        })
        .sort((a, b) => b.amount - a.amount)
        .slice(0, 5); // Top 5
}
