import React from 'react';
import { NavLink } from 'react-router-dom';
import { LayoutDashboard, Wallet, TrendingUp, Calendar as CalendarIcon, Bell, Settings, LogOut, Lightbulb } from 'lucide-react';
import { cn } from '../../lib/utils';
import logo from '../../assets/logo.png';
import { logout } from '../../services/auth';
import { useData } from '../../contexts/DataContext';
import { analyzeTrends, calculateMonthlyExpenses } from '../../lib/insights';
import { format } from 'date-fns';

export function Sidebar() {
    const handleLogout = async () => {
        try {
            await logout();
            window.location.reload(); // Reload to clear state/context
        } catch (error) {
            console.error("Logout failed", error);
        }
    };

    const { data } = useData();

    // Calculate Alerts for Badge
    const alertCount = React.useMemo(() => {
        if (!data.transactions.length) return null; // Return null instead of 0 for no badge

        const now = new Date();
        const currentMonthExpenses = calculateMonthlyExpenses(data.transactions);
        const currentMonthStr = format(now, 'yyyy-MM');
        const currentIndex = currentMonthExpenses.findIndex(m => m.month === currentMonthStr);

        if (currentIndex === -1) return null;

        const currentMonthData = currentMonthExpenses[currentIndex];

        const insights = analyzeTrends(
            currentMonthData,
            currentMonthExpenses,
            currentIndex,
            data.categories
        );

        const counts = {
            alert: insights.filter(i => i.type === 'alert').length,
            warning: insights.filter(i => i.type === 'warning').length,
            good: insights.filter(i => i.type === 'good').length
        };

        if (counts.alert === 0 && counts.warning === 0 && counts.good === 0) return null;

        return counts;
    }, [data.transactions, data.categories]);

    const menuItems = {
        main: [
            { id: '/', label: 'Dashboard', icon: LayoutDashboard },
            { id: '/accounts', label: 'Accounts', icon: Wallet },
            { id: '/projections', label: 'Projections', icon: TrendingUp },
            { id: '/insights', label: 'Insights', icon: Lightbulb, badge: alertCount },
            { id: '/calendar', label: 'Calendar', icon: CalendarIcon },
        ],
        personal: [
            { id: '/notifications', label: 'Notifications', icon: Bell },
            { id: '/settings', label: 'Settings', icon: Settings },
        ]
    };

    const SidebarItem = ({ item }) => (
        <NavLink
            to={item.id}
            className={({ isActive }) => cn(
                "flex items-center gap-3 px-6 py-3 w-full text-sm transition-all duration-200 relative",
                isActive
                    ? "bg-gray-100 text-black font-bold border-l-4 border-black"
                    : "text-gray-500 hover:text-gray-900 hover:bg-gray-50 font-medium border-l-4 border-transparent"
            )}
        >
            {({ isActive }) => (
                <>
                    <item.icon size={20} className={isActive ? "text-black" : "text-gray-400"} strokeWidth={isActive ? 2.5 : 2} />
                    <span className="flex-1 text-left">{item.label}</span>
                    {item.badge && (
                        typeof item.badge === 'object' ? (
                            <div className="flex items-center h-5 rounded-md overflow-hidden text-[10px] font-bold min-w-fit">
                                {item.badge.alert > 0 && (
                                    <span className="bg-red-500 text-white px-1.5 h-full flex items-center justify-center min-w-[1.2rem]">
                                        {item.badge.alert}
                                    </span>
                                )}
                                {item.badge.warning > 0 && (
                                    <span className="bg-amber-500 text-white px-1.5 h-full flex items-center justify-center min-w-[1.2rem]">
                                        {item.badge.warning}
                                    </span>
                                )}
                                {item.badge.good > 0 && (
                                    <span className="bg-emerald-500 text-white px-1.5 h-full flex items-center justify-center min-w-[1.2rem]">
                                        {item.badge.good}
                                    </span>
                                )}
                            </div>
                        ) : (
                            typeof item.badge === 'number' && item.badge > 0 && (
                                <span className="bg-red-500 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full min-w-[1.25rem] text-center">
                                    {item.badge}
                                </span>
                            )
                        )
                    )}
                </>
            )}
        </NavLink>
    );

    return (
        <aside className="w-64 bg-white border-r border-gray-100 flex flex-col h-screen sticky top-0 font-sans shadow-[4px_0_24px_rgba(0,0,0,0.02)] z-20">
            <div className="p-6">
                <div className="flex items-center gap-3">
                    <img src={logo} alt="Precious" className="w-auto" />
                </div>
            </div>

            <div className="flex-1 overflow-y-auto py-6 px-2">
                <div className="mb-2 px-4 text-xs font-bold text-gray-400 uppercase tracking-wider">
                    General
                </div>
                <div className="space-y-1 mb-8">
                    {menuItems.main.map((item) => (
                        <SidebarItem
                            key={item.id}
                            item={item}
                        />
                    ))}
                </div>

                <div className="mb-2 px-4 text-xs font-bold text-gray-400 uppercase tracking-wider">
                    Personal
                </div>
                <div className="space-y-1">
                    {menuItems.personal.map((item) => (
                        <SidebarItem
                            key={item.id}
                            item={item}
                        />
                    ))}
                </div>
            </div>

            <div className="p-6 border-t border-gray-50 space-y-2">
                {/* Sync Status Button */}
                <button
                    onClick={handleLogout}
                    className="flex items-center gap-2 text-sm font-medium text-gray-500 hover:text-gray-900 transition-colors w-full px-2 py-2 rounded-md hover:bg-gray-50"
                >
                    <LogOut size={18} />
                    <span>Log out</span>
                </button>
            </div>
        </aside>
    );
}

