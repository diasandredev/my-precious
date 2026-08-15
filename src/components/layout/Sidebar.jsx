import React from 'react';
import { NavLink } from 'react-router-dom';
import { LayoutDashboard, Wallet, TrendingUp, Calendar as CalendarIcon, Bell, Settings, LogOut, Lightbulb, UserCheck } from 'lucide-react';
import { cn } from '../../lib/utils';
import logo from '../../assets/logo.png';
import { logout } from '../../services/auth';
import { useData } from '../../contexts/DataContext';
import { analyzeTrends, calculateMonthlyExpenses } from '../../lib/insights';
import { format } from 'date-fns';
import { auth } from '../../lib/firebase';

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
    const currentUser = auth.currentUser;
    const userInitial = currentUser?.displayName?.[0] || currentUser?.email?.[0]?.toUpperCase() || 'P';

    // Calculate Alerts for Badge
    const alertCount = React.useMemo(() => {
        if (!data.transactions.length) return null;

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
                "group flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 relative",
                isActive
                    ? "bg-slate-900 text-white shadow-sm shadow-slate-900/10 font-semibold"
                    : "text-slate-600 hover:text-slate-900 hover:bg-slate-100/80"
            )}
        >
            {({ isActive }) => (
                <>
                    <div className={cn(
                        "flex items-center justify-center rounded-lg p-1 transition-colors",
                        isActive ? "text-white" : "text-slate-400 group-hover:text-slate-900"
                    )}>
                        <item.icon size={18} strokeWidth={isActive ? 2.5 : 2} />
                    </div>
                    <span className="flex-1 text-left tracking-tight">{item.label}</span>
                    {item.badge && (
                        typeof item.badge === 'object' ? (
                            <div className="flex items-center gap-0.5 rounded-full overflow-hidden text-[10px] font-bold">
                                {item.badge.alert > 0 && (
                                    <span className="bg-rose-500 text-white px-1.5 py-0.5 rounded-full min-w-[1.2rem] text-center shadow-xs">
                                        {item.badge.alert}
                                    </span>
                                )}
                                {item.badge.warning > 0 && (
                                    <span className="bg-amber-500 text-white px-1.5 py-0.5 rounded-full min-w-[1.2rem] text-center shadow-xs">
                                        {item.badge.warning}
                                    </span>
                                )}
                                {item.badge.good > 0 && (
                                    <span className="bg-emerald-500 text-white px-1.5 py-0.5 rounded-full min-w-[1.2rem] text-center shadow-xs">
                                        {item.badge.good}
                                    </span>
                                )}
                            </div>
                        ) : (
                            typeof item.badge === 'number' && item.badge > 0 && (
                                <span className="bg-rose-500 text-white text-[10px] font-bold px-2 py-0.5 rounded-full min-w-[1.25rem] text-center">
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
        <aside className="w-64 bg-white/95 backdrop-blur-xl border-r border-slate-200/80 flex flex-col h-screen sticky top-0 z-30 select-none shadow-[2px_0_12px_rgba(0,0,0,0.02)]">
            <div className="p-5 pb-4 border-b border-slate-100 flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                    <img src={logo} alt="Precious" className="h-8 w-auto object-contain" />
                    <span className="font-bold text-slate-900 tracking-tight text-lg">Precious</span>
                </div>
            </div>

            <div className="flex-1 overflow-y-auto py-5 px-3 space-y-6 custom-scrollbar">
                <div>
                    <div className="mb-2 px-3 text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
                        Menu Principal
                    </div>
                    <div className="space-y-1">
                        {menuItems.main.map((item) => (
                            <SidebarItem
                                key={item.id}
                                item={item}
                            />
                        ))}
                    </div>
                </div>

                <div>
                    <div className="mb-2 px-3 text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
                        Preferências
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
            </div>

            {/* User Profile & Logout Bottom Card */}
            <div className="p-3 border-t border-slate-100 space-y-2 bg-slate-50/50">
                <div className="flex items-center justify-between p-2 rounded-xl bg-white border border-slate-200/60 shadow-xs">
                    <div className="flex items-center gap-2.5 min-w-0">
                        <div className="w-8 h-8 rounded-full bg-slate-900 text-white flex items-center justify-center text-xs font-bold shrink-0">
                            {userInitial}
                        </div>
                        <div className="min-w-0">
                            <p className="text-xs font-semibold text-slate-800 truncate">
                                {currentUser?.displayName || currentUser?.email?.split('@')[0] || 'User'}
                            </p>
                            <p className="text-[10px] text-slate-400 truncate font-mono">
                                {currentUser?.email || 'Logged in'}
                            </p>
                        </div>
                    </div>
                    <button
                        onClick={handleLogout}
                        title="Sair"
                        className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                    >
                        <LogOut size={16} />
                    </button>
                </div>
            </div>
        </aside>
    );
}

