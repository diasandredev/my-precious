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
 * @param {Array} transactions List of transactions for the current month
 * @param {Array} recurringTransactions List of recurring transaction rules
 * @returns {Array} List of insights
 */
export function analyzeTrends(currentMonth, historyStats, currentIndex, categories, formatCurrency = (val) => val, transactions = [], recurringTransactions = []) {
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

            let momInsight = null;
            let avgInsight = null;

            // A. Spike/Drop Detection (vs Last Month)
            const diff = currentAmount - prevAmount;

            // INCREASE Logic (Spike)
            if (currentAmount > 100 && diff > 0 && prevAmount > 0) {
                const pctChange = (diff / prevAmount) * 100;
                const severityInfo = determineSeverity(pctChange, diff);
                if (severityInfo) {
                    momInsight = {
                        type: severityInfo.type,
                        title: `${catName} Increase`,
                        message: `Spending on ${catName} increased by ${pctChange.toFixed(0)}% vs last month (was ${formatCurrency(prevAmount)}).`,
                        amount: diff,
                        severity: severityInfo.severity,
                        categoryId: catId,
                        comparisonType: 'month_over_month'
                    };
                }
            }
            // DECREASE Logic (Good)
            else if (diff < 0 && prevAmount > 0) {
                const pctDecrease = Math.abs((diff / prevAmount) * 100);
                const absDiff = Math.abs(diff);

                let isSignificantDrop = false;
                if (pctDecrease >= 10 || (pctDecrease >= 5 && absDiff >= 100)) {
                    isSignificantDrop = true;
                }

                if (isSignificantDrop) {
                    momInsight = {
                        type: 'good',
                        title: `${catName} Decrease`,
                        message: `Spending on ${catName} decreased by ${pctDecrease.toFixed(0)}% vs last month.`,
                        amount: absDiff,
                        severity: 'low',
                        categoryId: catId,
                        comparisonType: 'month_over_month'
                    };
                }
            }

            // B. 3-Month Moving Average
            let sum = 0;
            let count = 0;
            for (let i = 1; i <= 3; i++) {
                const histMonth = historyStats[currentIndex + i];
                // STRICT CHECK
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
                        avgInsight = {
                            type: severityInfo.type,
                            title: `${catName} Above Average`,
                            message: `Spending is ${pctAboveAvg.toFixed(0)}% higher than the 3-month average (${formatCurrency(average)}).`,
                            amount: diffAvg,
                            severity: severityInfo.severity,
                            categoryId: catId,
                            comparisonType: 'average',
                            isProjected: currentMonth.isProjected
                        };
                    }
                }
                // DECREASE (< Average)
                else if (currentAmount < average) {
                    const absDiffAvg = Math.abs(diffAvg);
                    const pctBelowAvg = (absDiffAvg / average) * 100;

                    if (pctBelowAvg >= 5) { // Min 5%
                        if (pctBelowAvg >= 10 || absDiffAvg >= 100) {
                            avgInsight = {
                                type: 'good',
                                title: `${catName} Below Average`,
                                message: `Spending is ${pctBelowAvg.toFixed(0)}% lower than average (${formatCurrency(average)}).`,
                                amount: absDiffAvg,
                                severity: 'low',
                                categoryId: catId,
                                comparisonType: 'average',
                                isProjected: currentMonth.isProjected
                            };
                        }
                    }
                }
            }

            // MERGE LOGIC
            if (momInsight && avgInsight) {
                // Determine dominant type (Alert > Warning > Good)
                const severityScore = { 'alert': 3, 'warning': 2, 'good': 1 };
                const momScore = severityScore[momInsight.type] || 0;
                const avgScore = severityScore[avgInsight.type] || 0;

                // Use the higher severity base
                const base = momScore >= avgScore ? momInsight : avgInsight;
                const secondary = momScore >= avgScore ? avgInsight : momInsight;

                // Combined Message
                // "Spending ... increased by X% vs last month. It is also Y% higher than average."
                const combinedMessage = `${momInsight.message} It is also ${avgInsight.message.replace('Spending is ', '').replace('Your ' + catName + ' spending is ', '')}`;

                insights.push({
                    ...base,
                    message: combinedMessage,
                    comparisonType: 'average', // Always use average to show full history context
                    title: `${catName} Trends` // Generic title? Or keep specific? User asked to unify.
                    // Maybe `${catName}: ${momInsight.type === avgInsight.type ? (momInsight.type === 'good' ? 'Savings' : 'High Spending') : 'Analysis'}`
                    // Let's rely on the base title but maybe simplify?
                    // "Compras Decrease" + "Compras Below Average" -> "Compras Savings"?
                    // Let's use "Trends" or "Analysis" to be safe, or just the Category Name.
                    // Actually "Title" is prominent.
                    // If both are Good -> "Savings on CatName"
                    // If both are Bad -> "High Spending on CatName"
                    // If mixed -> "CatName Analysis"
                });
            } else if (momInsight) {
                insights.push(momInsight);
            } else if (avgInsight) {
                insights.push(avgInsight);
            }
        });
    }



    // 3. New Insights Implementation

    if (currentMonth.total > 0) {
        // A. DOMINANT CATEGORY (> 50% of spend)
        // Check if any category exceeds 50% of total
        Object.entries(currentMonth.categories).forEach(([catId, amount]) => {
            if (amount > currentMonth.total * 0.5) {
                const catName = categories.find(c => c.id === catId)?.name || 'Unknown Category';
                const pct = (amount / currentMonth.total) * 100;
                insights.push({
                    type: 'warning',
                    title: 'Dominant Category',
                    message: `${catName} makes up ${pct.toFixed(0)}% of your total spending this month.`,
                    amount: amount,
                    severity: 'medium',
                    categoryId: catId
                });
            }
        });

        // B. WEEKEND SPENDING SPIKE (> 35% on weekends)
        if (transactions.length > 0) {
            const weekendSpend = transactions.reduce((sum, t) => {
                const dateObj = typeof t.date === 'string' ? parseISO(t.date) : t.date;
                const day = dateObj.getDay();
                // 0 = Sunday, 6 = Saturday
                if (day === 0 || day === 6) {
                    return sum + Number(t.amount);
                }
                return sum;
            }, 0);

            const weekendPct = (weekendSpend / currentMonth.total) * 100;
            if (weekendPct > 35 && weekendSpend > 200) { // Min threshold to avoid noise
                insights.push({
                    type: 'info',
                    title: 'Weekend Spending Spike',
                    message: `High weekend activity: ${weekendPct.toFixed(0)}% of expenses occurred on Sat/Sun.`,
                    amount: weekendSpend,
                    severity: 'low'
                });
            }
        }

        // C. BIG TICKET ALERT (> 25% single transaction)
        if (transactions.length > 0) {
            const bigTicket = transactions.find(t => Number(t.amount) > currentMonth.total * 0.25 && Number(t.amount) > 100);
            if (bigTicket) {
                // Find category name for context
                const catName = categories.find(c => c.id === bigTicket.categoryId)?.name || 'Unknown';
                const pct = (Number(bigTicket.amount) / currentMonth.total) * 100;
                insights.push({
                    type: 'info',
                    title: 'Big Ticket Item',
                    message: `A single ${catName} transaction of ${formatCurrency(bigTicket.amount)} represents ${pct.toFixed(0)}% of monthly spend.`,
                    amount: Number(bigTicket.amount),
                    severity: 'low',
                    categoryId: bigTicket.categoryId
                });
            }
        }

        // D. NEW CATEGORY DETECTED
        // Spending in a category that had 0 spend in previous 3 months
        if (Object.keys(currentMonth.categories).length > 0) {
            Object.keys(currentMonth.categories).forEach(catId => {
                const amount = currentMonth.categories[catId];
                if (amount < 50) return; // Ignore small noise

                let hasHistory = false;
                // Check last 3 months
                for (let i = 1; i <= 3; i++) {
                    const histMonth = historyStats[currentIndex + i];
                    if (histMonth && histMonth.categories[catId] > 0) {
                        hasHistory = true;
                        break;
                    }
                }

                // If no usage in last 3 months AND current amount > 0
                if (!hasHistory) {
                    const catName = categories.find(c => c.id === catId)?.name || 'Unknown Category';
                    insights.push({
                        type: 'info',
                        title: 'New Category',
                        message: `You haven't spent on ${catName} in the last 3 months.`,
                        amount: amount,
                        severity: 'low',
                        categoryId: catId
                    });
                }
            });
        }

        // E. FIXED COST BURDEN (> 70% is recurring laws/rules)
        // We use transactions (Realized + Projected) that are linked to recurring rules.
        if (transactions.length > 0) {
            const fixedCostTotal = transactions.reduce((sum, t) => {
                // Check if transaction is linked to a recurring rule or fixed item
                if ((t.recurringTransactionId || t.fixedItemId) && t.type === 'EXPENSE') {
                    return sum + Number(t.amount);
                }
                return sum;
            }, 0);

            // Compare fixedCostTotal to currentMonth.total
            if (currentMonth.total > 500) {
                const fixedRatio = (fixedCostTotal / currentMonth.total) * 100;
                if (fixedRatio > 70) {
                    insights.push({
                        type: 'warning',
                        title: 'High Fixed Costs',
                        message: `Fixed costs (${formatCurrency(fixedCostTotal)}) make up ${fixedRatio.toFixed(0)}% of your budget this month.`,
                        amount: fixedCostTotal,
                        severity: 'medium'
                    });
                }
            }
        }
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
