import { useMemo } from 'react';
import {
    Chart as ChartJS,
    CategoryScale,
    LinearScale,
    PointElement,
    LineElement,
    BarElement,
    ArcElement,
    Title,
    Tooltip,
    Legend,
    Filler
} from 'chart.js';
import { Line, Doughnut, Bar } from 'react-chartjs-2';
import { format, parseISO } from 'date-fns';
import { useData } from '../../contexts/DataContext';
import { Card } from '../ui';

ChartJS.register(
    CategoryScale,
    LinearScale,
    PointElement,
    LineElement,
    BarElement,
    ArcElement,
    Title,
    Tooltip,
    Legend,
    Filler
);

export function DashboardTab() {
    const { data } = useData();

    // --- Prepare Data for Net Worth Growth (Line Chart) ---
    const growthData = useMemo(() => {
        const sortedSnapshots = [...data.snapshots].sort((a, b) => new Date(a.date) - new Date(b.date));

        return {
            labels: sortedSnapshots.map(s => format(parseISO(s.date), 'MMM yyyy')),
            datasets: [
                {
                    label: 'Net Worth',
                    data: sortedSnapshots.map(s => Object.values(s.balances).reduce((a, b) => a + b, 0)),
                    borderColor: '#fbbf24', // Primary Color (Amber 400)
                    backgroundColor: 'rgba(251, 191, 36, 0.1)',
                    tension: 0.4,
                    fill: true,
                    pointBackgroundColor: '#fbbf24',
                    pointBorderColor: '#09090b',
                    pointBorderWidth: 2,
                    pointRadius: 4,
                    pointHoverRadius: 6,
                }
            ]
        };
    }, [data.snapshots]);

    // --- Prepare Data for Asset Allocation (Doughnut Chart) ---
    const allocationData = useMemo(() => {
        // Get latest snapshot
        const sortedSnapshots = [...data.snapshots].sort((a, b) => new Date(b.date) - new Date(a.date));
        const latestSnapshot = sortedSnapshots[0];

        if (!latestSnapshot) return null;

        // Group by Type
        const byType = {};
        Object.entries(latestSnapshot.balances).forEach(([accountId, amount]) => {
            const account = data.accounts.find(a => a.id === accountId);
            if (account) {
                byType[account.type] = (byType[account.type] || 0) + amount;
            }
        });

        const labels = Object.keys(byType);
        const values = Object.values(byType);
        const colors = [
            '#8b5cf6', // Violet
            '#fbbf24', // Amber
            '#10b981', // Emerald
            '#3b82f6', // Blue
            '#ef4444', // Red
        ];

        return {
            labels,
            datasets: [
                {
                    data: values,
                    backgroundColor: colors,
                    borderColor: '#09090b',
                    borderWidth: 2,
                }
            ]
        };
    }, [data.snapshots, data.accounts]);

    // --- Prepare Data for Fixed Expenses (Bar Chart) ---
    const expensesData = useMemo(() => {
        const totalFixed = data.fixedExpenses.reduce((sum, exp) => sum + exp.amount, 0);
        // Just showing a projection for next 6 months
        const labels = [];
        const values = [];

        for (let i = 0; i < 6; i++) {
            const d = new Date();
            d.setMonth(d.getMonth() + i);
            labels.push(format(d, 'MMM'));
            values.push(totalFixed);
        }

        return {
            labels,
            datasets: [
                {
                    label: 'Fixed Expenses',
                    data: values,
                    backgroundColor: '#ef4444',
                    borderRadius: 4,
                }
            ]
        };
    }, [data.fixedExpenses]);

    const options = {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
            legend: {
                position: 'bottom',
                labels: { color: '#a1a1aa' }
            },
            tooltip: {
                backgroundColor: '#09090b',
                titleColor: '#ffffff',
                bodyColor: '#a1a1aa',
                borderColor: '#27272a',
                borderWidth: 1,
                padding: 12,
                displayColors: true,
                callbacks: {
                    label: function (context) {
                        let label = context.dataset.label || '';
                        if (label) {
                            label += ': ';
                        }
                        if (context.parsed.y !== null) {
                            label += new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(context.parsed.y || context.parsed);
                        }
                        return label;
                    }
                }
            }
        },
        scales: {
            x: {
                grid: { color: '#27272a' },
                ticks: { color: '#a1a1aa' }
            },
            y: {
                grid: { color: '#27272a' },
                ticks: {
                    color: '#a1a1aa',
                    callback: (value) => 'R$ ' + value // Simplified formatting
                }
            }
        }
    };

    const doughnutOptions = {
        ...options,
        scales: { display: false }
    };

    return (
        <div className="space-y-6">
            <h2 className="text-3xl font-bold tracking-tight text-foreground">Financial Overview</h2>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Net Worth Growth */}
                <Card className="lg:col-span-2 min-h-[400px] p-6">
                    <h3 className="text-lg font-semibold mb-4">Net Worth Growth</h3>
                    <div className="h-[300px]">
                        {growthData.labels.length > 0 ? (
                            <Line data={growthData} options={options} />
                        ) : (
                            <div className="h-full flex items-center justify-center text-muted-foreground">
                                Not enough data. Add snapshots in Balances tab.
                            </div>
                        )}
                    </div>
                </Card>

                {/* Asset Allocation */}
                <Card className="min-h-[400px] p-6">
                    <h3 className="text-lg font-semibold mb-4">Asset Allocation</h3>
                    <div className="h-[300px] flex items-center justify-center">
                        {allocationData ? (
                            <Doughnut data={allocationData} options={doughnutOptions} />
                        ) : (
                            <div className="text-muted-foreground">
                                No data available.
                            </div>
                        )}
                    </div>
                </Card>

                {/* Fixed Expenses Projection */}
                <Card className="lg:col-span-3 p-6">
                    <h3 className="text-lg font-semibold mb-4">Projected Fixed Expenses (Next 6 Months)</h3>
                    <div className="h-[200px]">
                        <Bar data={expensesData} options={options} />
                    </div>
                </Card>
            </div>
        </div>
    );
}
