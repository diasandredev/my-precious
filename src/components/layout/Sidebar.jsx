import { LayoutDashboard, Wallet, TrendingUp, Calendar as CalendarIcon, Bell, Settings, LogOut } from 'lucide-react';
import { cn } from '../../lib/utils';
import logo from '../../assets/logo.png';

export function Sidebar({ activeTab, onTabChange }) {
    const menuItems = {
        main: [
            { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
            { id: 'accounts', label: 'Accounts', icon: Wallet },
            { id: 'balances', label: 'Balances', icon: TrendingUp },
            { id: 'calendar', label: 'Calendar', icon: CalendarIcon },
        ],
        personal: [
            { id: 'notifications', label: 'Notifications', icon: Bell },
            { id: 'settings', label: 'Settings', icon: Settings },
        ]
    };

    const SidebarItem = ({ item, isActive }) => (
        <button
            onClick={() => onTabChange(item.id)}
            className={cn(
                "flex items-center gap-3 px-4 py-3 w-full text-sm font-medium transition-colors rounded-xl mx-2 mb-1",
                isActive
                    ? "bg-primary/5 text-primary"
                    : "text-gray-500 hover:text-gray-900 hover:bg-gray-50"
            )}
        >
            <item.icon size={20} className={isActive ? "text-primary" : "text-gray-400"} />
            <span>{item.label}</span>
            {isActive && <div className="ml-auto w-1.5 h-1.5 rounded-full bg-primary" />}
        </button>
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
                            isActive={activeTab === item.id}
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
                            isActive={activeTab === item.id}
                        />
                    ))}
                </div>
            </div>

            <div className="p-6 border-t border-gray-50">
                <div className="mb-6 p-4 bg-gray-50 rounded-xl border border-gray-100/50">
                    <p className="text-xs text-gray-500 uppercase font-bold mb-1">Monthly Cashback</p>
                    <p className="text-xl font-bold text-gray-900">$215.50</p>
                </div>

                <button className="flex items-center gap-2 text-sm font-medium text-gray-500 hover:text-gray-900 transition-colors w-full px-2">
                    <LogOut size={18} />
                    <span>Log out</span>
                </button>
            </div>
        </aside>
    );
}
